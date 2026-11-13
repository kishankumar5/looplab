import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as engine from "@/lib/audio/engine";
import { defaultPattern } from "@/lib/validation/beat";
import { GalleryPreviewProvider, PreviewButton } from "./GalleryPreview";

// Tests never play sound: they check what the audio engine was told.
vi.mock("@/lib/audio/engine");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(engine.start).mockResolvedValue(undefined);
});

function beat(kickStep: number) {
  const pattern = defaultPattern();
  pattern.tracks.kick.steps[kickStep] = true;
  return pattern;
}

function renderCards(patterns: Record<string, unknown> = { "rainy window": beat(0), "night bus": beat(4) }) {
  return render(
    <GalleryPreviewProvider>
      {Object.entries(patterns).map(([title, pattern]) => (
        <PreviewButton key={title} beatId={title} title={title} pattern={pattern} />
      ))}
    </GalleryPreviewProvider>,
  );
}

describe("gallery preview play (#13)", () => {
  it("plays a card's beat, and stops it", async () => {
    renderCards();
    await userEvent.click(screen.getByRole("button", { name: "Play rainy window" }));
    expect(engine.start).toHaveBeenCalledWith(beat(0), expect.any(Function));
    expect(screen.getByRole("button", { name: "Stop rainy window" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Stop rainy window" }));
    expect(engine.stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play rainy window" })).toBeInTheDocument();
  });

  it("plays one card at a time: another card's Play switches the beat without restarting", async () => {
    renderCards();
    await userEvent.click(screen.getByRole("button", { name: "Play rainy window" }));
    await userEvent.click(screen.getByRole("button", { name: "Play night bus" }));

    expect(engine.update).toHaveBeenCalledWith(beat(4));
    expect(engine.start).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Play rainy window" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop night bus" })).toBeInTheDocument();
  });

  it("can't play a saved pattern that doesn't match the beat format", () => {
    renderCards({ broken: { version: 1, tracks: {} } });
    expect(screen.getByRole("button", { name: "Play broken" })).toBeDisabled();
  });

  it("goes back to Play if audio can't start", async () => {
    vi.mocked(engine.start).mockRejectedValue(new Error("blocked"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderCards();
    await userEvent.click(screen.getByRole("button", { name: "Play rainy window" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Play rainy window" })).toBeInTheDocument());
  });

  it("stops the sound when the gallery is left", async () => {
    const { unmount } = renderCards();
    await userEvent.click(screen.getByRole("button", { name: "Play rainy window" }));
    unmount();
    expect(engine.stop).toHaveBeenCalled();
  });
});
