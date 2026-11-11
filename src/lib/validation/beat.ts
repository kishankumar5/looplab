import { z } from "zod";

/** The 5 rows of the grid, in display order (PRD US-2). */
export const TRACK_IDS = ["kick", "snare", "hihat", "bass", "synth"] as const;
export type TrackId = (typeof TRACK_IDS)[number];
export const STEPS_PER_BAR = 16;

// Stubs for the red step: real exports, no rules yet.
export const beatPatternSchema = z.object({}).loose();
export const createBeatSchema = z.object({}).loose();
export const updateBeatSchema = z.object({}).loose();

export type BeatPattern = {
  version: 1;
  bpm: number;
  swing: number;
  tracks: Record<TrackId, { steps: boolean[]; volume: number; muted: boolean }>;
  effects: { muffle: number; crackle: number };
};

/** An empty beat with the PRD defaults. */
export function defaultPattern(): BeatPattern {
  throw new Error("not implemented");
}
