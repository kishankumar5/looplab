import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as engine from "@/lib/audio/engine";
import { Editor } from "./Editor";

// Tests never play sound: they check what the audio engine was told.
vi.mock("@/lib/audio/engine");

beforeEach(() => {
  vi.resetAllMocks();
});

/** Labels of the cells marked as the playhead column. */
function playheadCells() {
  return screen
    .getAllByRole("button")
    .filter((cell) => cell.hasAttribute("data-playhead"))
    .map((cell) => cell.getAttribute("aria-label"));
}

describe("Editor", () => {
  it("starts with every step off", () => {
    render(<Editor />);
    expect(screen.getAllByRole("button", { name: /step \d+$/ })).toHaveLength(80);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("toggles a step on and off when its cell is clicked", async () => {
    render(<Editor />);
    const cell = screen.getByRole("button", { name: "Kick step 5" });

    await userEvent.click(cell);
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(cell);
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a focused step with the keyboard", async () => {
    render(<Editor />);
    const cell = screen.getByRole("button", { name: "Synth step 12" });
    cell.focus();

    await userEvent.keyboard("{Enter}");
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await userEvent.keyboard(" ");
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("turns every step off when Clear is clicked", async () => {
    render(<Editor />);
    for (const name of ["Kick step 1", "Snare step 5", "Hi-hat step 16"]) {
      await userEvent.click(screen.getByRole("button", { name }));
    }
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(3);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("shows the beat's title and tempo above the transport", () => {
    render(<Editor />);
    expect(screen.getByRole("heading", { name: "Untitled beat" })).toBeInTheDocument();
    // Once in the title area, once next to the tempo slider.
    expect(screen.getAllByText("82 BPM")).toHaveLength(2);
  });
});

describe("Editor playback", () => {
  it("does not start audio until Play is clicked", async () => {
    render(<Editor />);
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    expect(engine.start).not.toHaveBeenCalled();
    expect(engine.update).not.toHaveBeenCalled();
  });

  it("plays and stops the loop, switching the button between ▶ and ■", async () => {
    render(<Editor />);
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    const play = screen.getByRole("button", { name: "Play" });
    expect(play).toHaveTextContent("▶");

    await userEvent.click(play);
    const [pattern] = vi.mocked(engine.start).mock.calls[0];
    expect(pattern.tracks.kick.steps[0]).toBe(true);
    expect(pattern.bpm).toBe(82);
    const stop = screen.getByRole("button", { name: "Stop" });
    expect(stop).toHaveTextContent("■");

    await userEvent.click(stop);
    expect(engine.stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toHaveTextContent("▶");
  });

  it("toggles play and stop with Space when focus is not on a control", async () => {
    render(<Editor />);
    await userEvent.keyboard(" ");
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(engine.start).toHaveBeenCalledOnce();

    await userEvent.keyboard(" ");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("leaves Space to the cell, button, or slider that has focus", async () => {
    render(<Editor />);
    const cell = screen.getByRole("button", { name: "Bass step 2" });
    cell.focus();
    await userEvent.keyboard(" ");
    expect(cell).toHaveAttribute("aria-pressed", "true");

    screen.getByRole("slider", { name: "Tempo" }).focus();
    await userEvent.keyboard(" ");
    screen.getByRole("button", { name: "Clear" }).focus();
    await userEvent.keyboard(" ");

    expect(engine.start).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("highlights the column the engine is playing, and nothing once stopped", async () => {
    render(<Editor />);
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    const onStep = vi.mocked(engine.start).mock.calls[0][1];

    act(() => onStep(2));
    expect(playheadCells()).toEqual(["Kick step 3", "Snare step 3", "Hi-hat step 3", "Bass step 3", "Synth step 3"]);
    act(() => onStep(3));
    expect(playheadCells()).toHaveLength(5);
    expect(playheadCells()[0]).toBe("Kick step 4");

    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(playheadCells()).toEqual([]);
  });

  it("sends a cell toggled while playing to the engine, without restarting", async () => {
    render(<Editor />);
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    await userEvent.click(screen.getByRole("button", { name: "Snare step 5" }));

    expect(vi.mocked(engine.update).mock.lastCall?.[0].tracks.snare.steps[4]).toBe(true);
    expect(engine.start).toHaveBeenCalledOnce();
    expect(engine.stop).not.toHaveBeenCalled();
  });
});

describe("Editor tempo", () => {
  it("has a Tempo slider from 60 to 140 BPM that starts at 82", () => {
    render(<Editor />);
    const tempo = screen.getByRole("slider", { name: "Tempo" });
    expect(tempo).toHaveValue("82");
    expect(tempo).toHaveAttribute("min", "60");
    expect(tempo).toHaveAttribute("max", "140");
  });

  it("shows the new tempo and applies it live while playing", async () => {
    render(<Editor />);
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.change(screen.getByRole("slider", { name: "Tempo" }), { target: { value: "120" } });

    expect(screen.getAllByText("120 BPM")).toHaveLength(2);
    expect(engine.update).toHaveBeenLastCalledWith(expect.objectContaining({ bpm: 120 }));
    expect(engine.start).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });
});
