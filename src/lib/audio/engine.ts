import type { BeatPattern } from "@/lib/validation/beat";

/** Called with the 0-based step being heard, in time with the sound, while the loop plays. */
export type StepListener = (step: number) => void;

/** Unlocks audio (call it from a click), then loops `pattern` from step 1. */
export async function start(pattern: BeatPattern, onStep: StepListener): Promise<void> {
  void pattern;
  void onStep;
  throw new Error("not implemented");
}

/** Hands the engine the latest pattern and tempo; a playing loop picks them up without restarting. */
export function update(pattern: BeatPattern): void {
  void pattern;
  throw new Error("not implemented");
}

/** Stops the loop and the playhead. */
export function stop(): void {
  throw new Error("not implemented");
}
