import { STEPS_PER_BAR, TRACK_IDS, type BeatPattern, type TrackId } from "@/lib/validation/beat";

/** Every edit the editor can make to a beat. `step` is 0-based. */
export type SequencerAction = { type: "toggleStep"; track: TrackId; step: number } | { type: "clear" };

/**
 * The editor's single reducer (PRD US-2). Pure: returns a new pattern and never mutates `state`,
 * so undo/redo (#12) can wrap it and keep old states as history.
 */
export function sequencerReducer(state: BeatPattern, action: SequencerAction): BeatPattern {
  switch (action.type) {
    case "toggleStep":
      return toggleStep(state, action.track, action.step);
    case "clear":
      return clear(state);
  }
}

function toggleStep(state: BeatPattern, track: TrackId, step: number): BeatPattern {
  if (!Number.isInteger(step) || step < 0 || step >= STEPS_PER_BAR) return state;
  const steps = state.tracks[track].steps.map((on, i) => (i === step ? !on : on));
  return { ...state, tracks: { ...state.tracks, [track]: { ...state.tracks[track], steps } } };
}

/** Turns every step off; tempo, swing, volume, mute, and effects stay as they are. */
function clear(state: BeatPattern): BeatPattern {
  const tracks = { ...state.tracks };
  for (const track of TRACK_IDS) {
    tracks[track] = { ...tracks[track], steps: tracks[track].steps.map(() => false) };
  }
  return { ...state, tracks };
}
