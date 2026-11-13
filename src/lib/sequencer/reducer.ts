import { MAX_BPM, MIN_BPM, STEPS_PER_BAR, TRACK_IDS, type BeatPattern, type TrackId } from "@/lib/validation/beat";

/** Every edit the editor can make to a beat. `step` is 0-based. */
export type SequencerAction =
  | { type: "toggleStep"; track: TrackId; step: number }
  | { type: "clear" }
  | { type: "setTempo"; bpm: number };

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
    case "setTempo":
      return setTempo(state, action.bpm);
  }
}

/**
 * Whole BPM inside the PRD range, like a saved beat stores. Returns `state` itself for a no-op,
 * so undo/redo history doesn't fill with empty changes.
 */
function setTempo(state: BeatPattern, bpm: number): BeatPattern {
  if (!Number.isFinite(bpm)) return state;
  const next = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
  return next === state.bpm ? state : { ...state, bpm: next };
}

function toggleStep(state: BeatPattern, track: TrackId, step: number): BeatPattern {
  if (!Number.isInteger(step) || step < 0 || step >= STEPS_PER_BAR) return state;
  const steps = state.tracks[track].steps.map((on, i) => (i === step ? !on : on));
  return { ...state, tracks: { ...state.tracks, [track]: { ...state.tracks[track], steps } } };
}

/**
 * Turns every step off; tempo, swing, volume, mute, and effects stay as they are.
 * Returns `state` itself when every step is already off, so history gets no empty entry.
 */
function clear(state: BeatPattern): BeatPattern {
  if (TRACK_IDS.every((track) => state.tracks[track].steps.every((on) => !on))) return state;
  const tracks = { ...state.tracks };
  for (const track of TRACK_IDS) {
    tracks[track] = { ...tracks[track], steps: tracks[track].steps.map(() => false) };
  }
  return { ...state, tracks };
}
