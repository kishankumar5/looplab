import type * as Tone from "tone";
import type { BeatPattern } from "@/lib/validation/beat";
import { crackleGain, crackleSamples, muffleCutoffHz } from "./mix";

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

/** Seconds of generated crackle, looped. Long enough that the repeat isn't noticeable. */
const CRACKLE_SECONDS = 2;
/** Fast, but a ramp, so moving a slider doesn't click. */
const RAMP_SECONDS = 0.05;

/**
 * Builds the lo-fi stage between the rows and the master:
 *   rows -> muffle (low-pass filter) -> output
 *   crackle loop -> crackle level ----> output
 * The crackle skips the filter, the way surface noise sits on top of a muffled record.
 */
export function createEffects(tone: typeof Tone, output: Tone.InputNode, initial: EffectValues): LofiEffects {
  const muffle = new tone.Filter({ type: "lowpass", frequency: muffleCutoffHz(initial.muffle), rolloff: -24, Q: 0.7 });
  muffle.connect(output);

  const level = new tone.Gain(crackleGain(initial.crackle));
  level.connect(output);
  const sampleRate = tone.getContext().sampleRate;
  const crackle = new tone.Player(
    tone.ToneAudioBuffer.fromArray(crackleSamples(CRACKLE_SECONDS * sampleRate, Math.random)),
  );
  crackle.loop = true;
  crackle.connect(level);

  return {
    input: muffle,
    set(values) {
      muffle.frequency.rampTo(muffleCutoffHz(values.muffle), RAMP_SECONDS);
      level.gain.rampTo(crackleGain(values.crackle), RAMP_SECONDS);
    },
    start() {
      if (crackle.state !== "started") crackle.start();
    },
    stop() {
      if (crackle.state === "started") crackle.stop();
    },
  };
}
