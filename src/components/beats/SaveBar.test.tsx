import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDraft } from "@/lib/beats/draft";
import { defaultPattern } from "@/lib/validation/beat";
import { SaveBar } from "./SaveBar";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/" }));

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const okJson = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("SaveBar", () => {
  it("saves a new beat and changes the address to its URL, without a navigation", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1", title: "rainy window" } }, 201));
    render(<SaveBar beatId={null} initialTitle="" pattern={defaultPattern()} signedIn />);

    await userEvent.type(screen.getByLabelText("Beat title"), "rainy window");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/beats", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ title: "rainy window", pattern: defaultPattern() });
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
    expect(window.location.pathname).toBe("/beats/b1");
    // A router navigation would swap in the /beats/[id] page and remount the editor.
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("saves into the same beat after the first save", async () => {
    fetchMock.mockReturnValueOnce(okJson({ beat: { id: "b1" } }, 201)).mockReturnValueOnce(okJson({ beat: { id: "b1" } }));
    // The editor keeps passing beatId={null}: it isn't remounted after the first save.
    const { rerender } = render(<SaveBar beatId={null} initialTitle="" pattern={defaultPattern()} signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");

    const changed = defaultPattern();
    changed.tracks.kick.steps[0] = true;
    rerender(<SaveBar beatId={null} initialTitle="" pattern={changed} signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/beats/b1", expect.objectContaining({ method: "PATCH" }));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).pattern.tracks.kick.steps[0]).toBe(true);
    expect(window.location.pathname).toBe("/beats/b1");
  });

  it("tells the editor once, before the address changes, when the first save creates the beat", async () => {
    fetchMock.mockReturnValueOnce(okJson({ beat: { id: "b1" } }, 201)).mockReturnValueOnce(okJson({ beat: { id: "b1" } }));
    const addressWhenCalled: string[] = [];
    const onCreated = vi.fn(() => addressWhenCalled.push(window.location.pathname));
    render(<SaveBar beatId={null} initialTitle="" pattern={defaultPattern()} signedIn onCreated={onCreated} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("b1"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(onCreated).toHaveBeenCalledTimes(1);
    // So the editor knows /beats/b1 is its own beat by the time the address shows it.
    expect(addressWhenCalled).toEqual(["/"]);
  });

  it("uses the default title when the field is empty", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1" } }, 201));
    render(<SaveBar beatId={null} initialTitle="" pattern={defaultPattern()} signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).title).toBe("Untitled beat");
  });

  it("updates an existing beat in place and shows Saved", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1" } }));
    render(<SaveBar beatId="b1" initialTitle="rainy window" pattern={defaultPattern()} signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/beats/b1", expect.objectContaining({ method: "PATCH" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
    expect(router.replace).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/");
  });

  it("keeps the beat and sends a signed-out user to sign in", async () => {
    render(<SaveBar beatId={null} initialTitle="draft beat" pattern={defaultPattern()} signedIn={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loadDraft()).toEqual({ title: "draft beat", pattern: defaultPattern() });
    expect(router.push).toHaveBeenCalledWith("/signin?callbackUrl=%2F");
  });

  it("shows the server's error message when saving fails", async () => {
    fetchMock.mockReturnValue(okJson({ error: { code: "BAD_REQUEST", message: "title: Too long" } }, 400));
    render(<SaveBar beatId="b1" initialTitle="x" pattern={defaultPattern()} signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("title: Too long");
  });

  it("warns before leaving with unsaved changes", async () => {
    const { rerender } = render(<SaveBar beatId="b1" initialTitle="x" pattern={defaultPattern()} signedIn />);
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);

    const changed = defaultPattern();
    changed.tracks.kick.steps[0] = true;
    rerender(<SaveBar beatId="b1" initialTitle="x" pattern={changed} signedIn />);
    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
});
