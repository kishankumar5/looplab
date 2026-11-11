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
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const okJson = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("SaveBar", () => {
  it("saves a new beat and moves to its URL", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1", title: "rainy window" } }, 201));
    render(<SaveBar beatId={null} initialTitle="" pattern={defaultPattern()} signedIn />);

    await userEvent.type(screen.getByLabelText("Beat title"), "rainy window");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/beats", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ title: "rainy window", pattern: defaultPattern() });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/beats/b1"));
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
