import { MAX_SWING, type Track } from "@/lib/validation/beat";

/**
 * A row's level on its channel, as a linear gain from 0 (silent) to 1 (the instrument's own
 * level), from the row's volume (0 to 100) and mute (PRD US-3). Pure, so it's tested without Tone.
 */
export function trackGain({ volume, muted }: Pick<Track, "volume" | "muted">): number {
  if (muted) return 0;
  // Squared, because loudness isn't linear in amplitude: halfway (50) sounds about half as loud
  // (-12 dB), and the default 80 is about -4 dB. Whole-number maths keeps 0.64 exactly 0.64.
  const level = Math.min(100, Math.max(0, volume));
  return (level * level) / 10_000;
}

/**
 * The make-up gain (dB) that a Web Audio DynamicsCompressorNode adds to everything it passes, with
 * a hard knee (knee 0). The engine trims it off after its limiter, so the limiter doesn't make the
 * beat louder. Pure, so it's tested without Tone.
 */
export function compressorMakeupDb(threshold: number, ratio: number): number {
  // Web Audio spec, DynamicsCompressorNode processing: makeup = (1 / fullRangeGain) ^ 0.6, where
  // fullRangeGain is where a 0 dBFS input comes out. With a hard knee, that's threshold * (1 - 1/ratio).
  const fullRangeDb = threshold * (1 - 1 / ratio);
  return -0.6 * fullRangeDb;
}

/**
 * How late (seconds) step `step` (0-based) plays for a swing of 0 to 60% at `bpm` (PRD US-3).
 * Only every second 16th moves (steps 2, 4, ... counting from 1), by `swing`% of a 16th note:
 * at 50%, half a 16th. Pure, so it's tested without Tone.
 */
export function swingDelaySeconds(step: number, swing: number, bpm: number): number {
  if (step % 2 === 0) return 0;
  const amount = Math.min(MAX_SWING, Math.max(0, swing)) / 100;
  const sixteenthSeconds = 60 / bpm / 4;
  return amount * sixteenthSeconds;
}
