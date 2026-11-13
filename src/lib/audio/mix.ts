import type { Track } from "@/lib/validation/beat";

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

/** Muffle 0 leaves the sound untouched (the top of human hearing); 100 is "through a wall". */
const OPEN_CUTOFF_HZ = 20_000;
const MUFFLED_CUTOFF_HZ = 400;

const clamp100 = (value: number) => Math.min(100, Math.max(0, value));

/**
 * The muffle filter's cutoff (Hz) for a muffle value 0 to 100 (PRD US-3). Exponential, so even
 * steps on the slider are even steps in pitch: 50 sits at the geometric middle (about 2.8 kHz).
 */
export function muffleCutoffHz(muffle: number): number {
  const amount = clamp100(muffle) / 100;
  if (amount === 0) return OPEN_CUTOFF_HZ;
  if (amount === 1) return MUFFLED_CUTOFF_HZ;
  return OPEN_CUTOFF_HZ * (MUFFLED_CUTOFF_HZ / OPEN_CUTOFF_HZ) ** amount;
}

/** The crackle's level at 100: a bed under the beat, never on top of it. */
const MAX_CRACKLE_GAIN = 0.35;

/**
 * The crackle's level as a linear gain, for a crackle value 0 to 100 (PRD US-3). Squared, like the
 * row volumes, so the slider's lower half stays subtle.
 */
export function crackleGain(crackle: number): number {
  const amount = clamp100(crackle) / 100;
  return MAX_CRACKLE_GAIN * amount * amount;
}

/** How loud the constant surface hiss is, and how often (per sample) a pop starts. */
const HISS = 0.012;
const POP_CHANCE = 0.0004;
/** Each pop dies away over a few dozen samples (under a millisecond): a click, not a thump. */
const POP_DECAY = 0.72;

/**
 * A vinyl-crackle sample (PRD US-3): faint hiss with occasional pops of random size and sign.
 * Generated in code because LoopLab ships no audio files. `random` is Math.random in the app and
 * a seeded generator in tests.
 */
export function crackleSamples(length: number, random: () => number): Float32Array {
  const samples = new Float32Array(length);
  let pop = 0;
  for (let i = 0; i < length; i++) {
    if (random() < POP_CHANCE) pop = (random() < 0.5 ? -1 : 1) * (0.3 + 0.6 * random());
    const hiss = HISS * (random() * 2 - 1);
    samples[i] = Math.min(1, Math.max(-1, hiss + pop));
    pop *= POP_DECAY;
  }
  return samples;
}
