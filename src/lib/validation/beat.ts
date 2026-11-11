import { z } from "zod";

/** The 5 rows of the grid, in display order (PRD US-2). */
export const TRACK_IDS = ["kick", "snare", "hihat", "bass", "synth"] as const;
export type TrackId = (typeof TRACK_IDS)[number];
export const STEPS_PER_BAR = 16;

/** Tempo range and default (PRD US-3). */
export const MIN_BPM = 60;
export const MAX_BPM = 140;
export const DEFAULT_BPM = 82;

const percent = z.number().int().min(0).max(100);

const trackSchema = z.object({
  steps: z.array(z.boolean()).length(STEPS_PER_BAR),
  volume: percent,
  muted: z.boolean(),
});

/**
 * A saved beat (PRD section 6). The single source of truth for the pattern shape:
 * the editor, the API, and the database all validate against this.
 */
export const beatPatternSchema = z.object({
  version: z.literal(1),
  bpm: z.number().int().min(MIN_BPM).max(MAX_BPM),
  swing: z.number().int().min(0).max(60),
  tracks: z.object({
    kick: trackSchema,
    snare: trackSchema,
    hihat: trackSchema,
    bass: trackSchema,
    synth: trackSchema,
  }),
  effects: z.object({ muffle: percent, crackle: percent }),
});

export type BeatPattern = z.infer<typeof beatPatternSchema>;
export type Track = z.infer<typeof trackSchema>;

const title = z.string().trim().min(1, "Title is required").max(80, "Title must be 80 characters or fewer");

/** POST /api/beats body. */
export const createBeatSchema = z.object({
  title: title.default("Untitled beat"),
  pattern: beatPatternSchema,
});

/** PATCH /api/beats/{id} body: any of title, pattern, isPublic. */
export const updateBeatSchema = z
  .object({ title: title.optional(), pattern: beatPatternSchema.optional(), isPublic: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, "Send at least one of title, pattern, or isPublic");

/** An empty beat with the PRD defaults: 82 BPM, no swing, every step off, volume 80, effects off. */
export function defaultPattern(): BeatPattern {
  const track = (): Track => ({ steps: Array(STEPS_PER_BAR).fill(false), volume: 80, muted: false });
  return {
    version: 1,
    bpm: DEFAULT_BPM,
    swing: 0,
    tracks: { kick: track(), snare: track(), hihat: track(), bass: track(), synth: track() },
    effects: { muffle: 0, crackle: 0 },
  };
}
