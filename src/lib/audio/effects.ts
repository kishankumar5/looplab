import type * as Tone from "tone";
import type { BeatPattern } from "@/lib/validation/beat";

export type EffectValues = BeatPattern["effects"];

/** The lo-fi effects (PRD US-3): a muffle filter the rows pass through, and a vinyl crackle bed. */
export interface LofiEffects {
  /** Where the rows go in. */
  input: Tone.InputNode;
  /** Muffle and crackle follow the beat's values, live. */
  set: (values: EffectValues) => void;
  /** The crackle plays only while the loop does. */
  start: () => void;
  stop: () => void;
}

export function createEffects(_tone: typeof Tone, _output: Tone.InputNode, _initial: EffectValues): LofiEffects {
  throw new Error("not implemented");
}
