import type * as Tone from "tone";
import type { TrackId } from "@/lib/validation/beat";

/** Plays one row's sound at an exact time on the audio clock (seconds). */
export type Voice = (time: number) => void;
export type Voices = Record<TrackId, Voice>;

/** Builds one synthesized instrument per row, all routed into `output`. */
export function createVoices(tone: typeof Tone, output: Tone.InputNode): Voices {
  void tone;
  void output;
  throw new Error("not implemented");
}
