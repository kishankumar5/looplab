import type { BeatPattern, TrackId } from "@/lib/validation/beat";

/** Every edit the editor can make to a beat. `step` is 0-based. */
export type SequencerAction = { type: "toggleStep"; track: TrackId; step: number } | { type: "clear" };

/**
 * The editor's single reducer (PRD US-2). Pure: returns a new pattern and never mutates `state`,
 * so undo/redo (#12) can wrap it and keep old states as history.
 */
export function sequencerReducer(state: BeatPattern, action: SequencerAction): BeatPattern {
  throw new Error("not implemented");
}
