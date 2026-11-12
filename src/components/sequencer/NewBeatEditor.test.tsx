import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_KEY, saveDraft } from "@/lib/beats/draft";
import { defaultPattern } from "@/lib/validation/beat";
import { NewBeatEditor } from "./NewBeatEditor";

vi.mock("@/lib/audio/engine");
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/" }));

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
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
