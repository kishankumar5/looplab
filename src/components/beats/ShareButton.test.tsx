import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const shareButton = () => screen.getByRole("button", { name: "Copy share link" });
const SHARE_URL = `${window.location.origin}/b/b1`;

describe("ShareButton", () => {
  it("is disabled until the beat is saved, and says why", () => {
    render(<ShareButton beatId={null} isPublic={false} />);
    expect(shareButton()).toBeDisabled();
    expect(shareButton()).toHaveAccessibleDescription("Save the beat, then make it public to share it.");
  });

  it("is disabled while the beat is private, and says it needs to be public", () => {
    render(<ShareButton beatId="b1" isPublic={false} />);
    expect(shareButton()).toBeDisabled();
    expect(shareButton()).toHaveAccessibleDescription("Make the beat public to share it.");
  });

  it("copies the beat's /b/{id} link and confirms with Link copied", async () => {
    // userEvent.setup() gives the page a clipboard to write to.
    const user = userEvent.setup();
    render(<ShareButton beatId="b1" isPublic />);
    expect(shareButton()).toBeEnabled();
    expect(shareButton()).toHaveAccessibleDescription("");

    await user.click(shareButton());

    expect(await navigator.clipboard.readText()).toBe(SHARE_URL);
    expect(screen.getByRole("status")).toHaveTextContent("Link copied");
  });

  it("hides Link copied again after about 1.5 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ShareButton beatId="b1" isPublic />);

    await user.click(shareButton());
    expect(screen.getByRole("status")).toHaveTextContent("Link copied");

    act(() => vi.advanceTimersByTime(1600));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("shows the link to copy by hand when the clipboard isn't available", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<ShareButton beatId="b1" isPublic />);

    await user.click(shareButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(SHARE_URL);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});
