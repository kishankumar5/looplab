import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyBeatRow } from "./MyBeatRow";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

function renderRow(isPublic: boolean) {
  render(
    <ul>
      <MyBeatRow id="b1" title="rainy window" bpm={82} isPublic={isPublic} editedAgo="2 min ago" />
    </ul>,
  );
}

describe("MyBeatRow visibility (US-4)", () => {
  it("makes a private beat public from My Beats", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ beat: { id: "b1", isPublic: true } })));
    renderRow(false);
    expect(screen.getByText("Private")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Make public" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/beats/b1", expect.objectContaining({ method: "PATCH" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ isPublic: true });
    expect(await screen.findByText("Public")).toBeInTheDocument();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("offers Make private for a public beat", () => {
    renderRow(true);
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make private" })).toBeInTheDocument();
  });
});
