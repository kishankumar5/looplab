import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemixButton } from "./RemixButton";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/gallery" }));

const fetchMock = vi.fn();
const reply = (body: unknown, status: number) => Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => vi.stubGlobal("fetch", fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("RemixButton", () => {
  it("sends signed-out users to sign in, then back here", async () => {
    render(<RemixButton beatId="b1" signedIn={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Remix" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/signin?callbackUrl=%2Fgallery");
  });

  it("creates the remix and opens it in the editor", async () => {
    fetchMock.mockReturnValue(reply({ beat: { id: "r1" } }, 201));
    render(<RemixButton beatId="b1" signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Remix" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/beats/b1/remix", expect.objectContaining({ method: "POST" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/beats/r1"));
  });

  it("shows the API's error message when it fails", async () => {
    fetchMock.mockReturnValue(reply({ error: { code: "NOT_FOUND", message: "Beat not found" } }, 404));
    render(<RemixButton beatId="b1" signedIn />);
    await userEvent.click(screen.getByRole("button", { name: "Remix" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Beat not found");
    expect(router.push).not.toHaveBeenCalled();
  });
});
