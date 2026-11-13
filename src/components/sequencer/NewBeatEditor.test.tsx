import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_KEY, saveDraft } from "@/lib/beats/draft";
import { defaultPattern } from "@/lib/validation/beat";
import { NewBeatEditor } from "./NewBeatEditor";

vi.mock("@/lib/audio/engine");
// The address is jsdom's: SaveBar changes it with history.replaceState, as in the browser.
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => window.location.pathname }));
const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function draftBeat() {
  const pattern = defaultPattern();
  pattern.bpm = 90;
  pattern.tracks.kick.steps[0] = true;
  pattern.tracks.hihat.steps[2] = true;
  return { title: "rainy window", pattern };
}

const title = () => screen.getByRole("textbox", { name: "Beat title" });
const onCells = () => screen.queryAllByRole("button", { pressed: true }).map((cell) => cell.getAttribute("aria-label"));
const button = (name: string) => screen.getByRole("button", { name });
const created = (id: string) => Promise.resolve(new Response(JSON.stringify({ beat: { id } }), { status: 201 }));

/** Renders the editor at "/"; `addressChanged` re-renders it, as Next does when the address changes. */
function renderAtHome() {
  const view = render(<NewBeatEditor signedIn />);
  return { addressChanged: () => view.rerender(<NewBeatEditor signedIn />) };
}

async function saveAndWait() {
  await userEvent.click(button("Save"));
  expect(await screen.findByText("Saved")).toBeInTheDocument();
}

describe("NewBeatEditor", () => {
  it("starts from an empty beat when there is no draft", () => {
    render(<NewBeatEditor signedIn={false} />);
    expect(title()).toHaveValue("");
    expect(onCells()).toEqual([]);
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("82");
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("starts from the unsaved draft kept across sign-in, as a fresh undo history", () => {
    saveDraft(draftBeat());
    render(<NewBeatEditor signedIn />);
    expect(title()).toHaveValue("rainy window");
    expect(onCells()).toEqual(["Kick step 1", "Hi-hat step 3"]);
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("90");
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("ignores a stored draft that isn't a valid beat", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: "broken", pattern: { bpm: 5 } }));
    render(<NewBeatEditor signedIn />);
    expect(title()).toHaveValue("");
    expect(onCells()).toEqual([]);
  });

  it("shows the draft after hydrating server HTML, without a hydration mismatch", () => {
    // The server has no localStorage, so it renders the empty beat.
    const container = document.createElement("div");
    container.innerHTML = renderToString(<NewBeatEditor signedIn />);
    document.body.appendChild(container);
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);

    saveDraft(draftBeat());
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<NewBeatEditor signedIn />, { container, hydrate: true });

    expect(onCells()).toEqual(["Kick step 1", "Hi-hat step 3"]);
    expect(title()).toHaveValue("rainy window");
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("NewBeatEditor saving", () => {
  it("keeps the restored draft, playback, and undo history when the first save creates the beat", async () => {
    saveDraft(draftBeat());
    fetchMock.mockReturnValue(created("b1"));
    const { addressChanged } = renderAtHome();
    await userEvent.click(button("Snare step 5"));
    await userEvent.click(button("Play"));

    await saveAndWait();
    expect(window.location.pathname).toBe("/beats/b1");
    addressChanged();

    // Saving cleared the stored draft, but the editor carries on with the beat it started from.
    expect(onCells()).toEqual(["Kick step 1", "Snare step 5", "Hi-hat step 3"]);
    expect(title()).toHaveValue("rainy window");
    expect(button("Stop")).toBeInTheDocument();
    expect(router.refresh).not.toHaveBeenCalled();
    await userEvent.click(button("Undo"));
    expect(onCells()).toEqual(["Kick step 1", "Hi-hat step 3"]);
  });

  it('starts a new beat when a link leads back to "/" after saving', async () => {
    fetchMock.mockReturnValue(created("b1"));
    const { addressChanged } = renderAtHome();
    await userEvent.click(button("Kick step 1"));
    await userEvent.type(title(), "first beat");
    await saveAndWait();
    addressChanged();

    // The header's Editor link: Next keeps this page (its route is still "/"), only the address changes.
    act(() => window.history.pushState(null, "", "/"));
    addressChanged();
    expect(onCells()).toEqual([]);
    expect(title()).toHaveValue("");
    expect(button("Undo")).toBeDisabled();

    // Saving now creates another beat instead of overwriting the first one.
    fetchMock.mockReturnValue(created("b2"));
    await userEvent.click(button("Save"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/beats", expect.objectContaining({ method: "POST" }));
  });

  it('keeps an unsaved beat when a link leads back to "/"', async () => {
    const { addressChanged } = renderAtHome();
    await userEvent.click(button("Kick step 1"));
    act(() => window.history.pushState(null, "", "/me"));
    addressChanged();
    act(() => window.history.pushState(null, "", "/"));
    addressChanged();
    expect(onCells()).toEqual(["Kick step 1"]);
  });

  it("loads a beat's own page when Back lands on a /beats/{id} address it isn't showing", async () => {
    const { addressChanged } = renderAtHome();
    // Saved, started a new beat, then pressed Back: Next shows this "/" page at the old address.
    act(() => window.history.pushState(null, "", "/beats/b1"));
    addressChanged();
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});
