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
