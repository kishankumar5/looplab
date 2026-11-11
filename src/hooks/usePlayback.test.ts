import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as engine from "@/lib/audio/engine";
import { sequencerReducer } from "@/lib/sequencer/reducer";
import { defaultPattern } from "@/lib/validation/beat";
import { usePlayback } from "./usePlayback";

vi.mock("@/lib/audio/engine");

function setup(pattern = defaultPattern()) {
  return renderHook(({ pattern }) => usePlayback(pattern), { initialProps: { pattern } });
}

/** The callback usePlayback gave the engine for reporting the step being heard. */
const stepListener = () => vi.mocked(engine.start).mock.calls[0][1];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("usePlayback", () => {
  it("leaves the audio engine alone until play is called", () => {
    const { result, rerender } = setup();
    rerender({ pattern: { ...defaultPattern(), bpm: 100 } });
    expect(result.current.playing).toBe(false);
    expect(result.current.currentStep).toBeNull();
    expect(engine.start).not.toHaveBeenCalled();
    expect(engine.update).not.toHaveBeenCalled();
  });

  it("starts the engine with the current pattern and tempo", async () => {
    const pattern = { ...defaultPattern(), bpm: 90 };
    const { result } = setup(pattern);
    await act(() => result.current.play());
    expect(result.current.playing).toBe(true);
    expect(engine.start).toHaveBeenCalledExactlyOnceWith(pattern, expect.any(Function));
  });

  it("stops the engine", async () => {
    const { result } = setup();
    await act(() => result.current.play());
    act(() => result.current.stop());
    expect(result.current.playing).toBe(false);
    expect(engine.stop).toHaveBeenCalledOnce();
  });

  it("toggles between playing and stopped", async () => {
    const { result } = setup();
    await act(async () => result.current.toggle());
    expect(result.current.playing).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);
    expect(engine.start).toHaveBeenCalledOnce();
    expect(engine.stop).toHaveBeenCalledOnce();
  });

  it("follows the step the engine is playing, and clears it on stop", async () => {
    const { result } = setup();
    await act(() => result.current.play());
    act(() => stepListener()(5));
    expect(result.current.currentStep).toBe(5);
    act(() => result.current.stop());
    expect(result.current.currentStep).toBeNull();
  });

  it("sends edits to the playing engine without restarting it", async () => {
    const { result, rerender } = setup();
    await act(() => result.current.play());
    const edited = sequencerReducer(defaultPattern(), { type: "toggleStep", track: "snare", step: 4 });
    rerender({ pattern: edited });
    expect(engine.update).toHaveBeenLastCalledWith(edited);
    expect(engine.start).toHaveBeenCalledOnce();
    expect(engine.stop).not.toHaveBeenCalled();
  });

  it("sends a new tempo to the playing engine", async () => {
    const { result, rerender } = setup();
    await act(() => result.current.play());
    rerender({ pattern: sequencerReducer(defaultPattern(), { type: "setTempo", bpm: 120 }) });
    expect(engine.update).toHaveBeenLastCalledWith(expect.objectContaining({ bpm: 120 }));
  });

  it("goes back to stopped if audio can't start", async () => {
    vi.mocked(engine.start).mockRejectedValueOnce(new Error("blocked"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = setup();
    await act(() => result.current.play());
    expect(result.current.playing).toBe(false);
  });

  it("stops the sound when the editor goes away", async () => {
    const { result, unmount } = setup();
    await act(() => result.current.play());
    unmount();
    expect(engine.stop).toHaveBeenCalled();
  });
});
