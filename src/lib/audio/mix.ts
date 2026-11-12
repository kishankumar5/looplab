import type { Track } from "@/lib/validation/beat";

/**
 * A row's level on its channel, as a linear gain from 0 (silent) to 1 (the instrument's own
 * level), from the row's volume (0 to 100) and mute (PRD US-3). Pure, so it's tested without Tone.
 */
export function trackGain(track: Pick<Track, "volume" | "muted">): number {
  void track;
  throw new Error("not implemented");
}
