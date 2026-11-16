import { MAX_BPM, MIN_BPM, STEPS_PER_BAR, TRACK_IDS, type BeatPattern, type Track, type TrackId } from "@/lib/validation/beat";

/** A row's volume range (PRD US-3; the beat schema stores 0 to 100). */
const MIN_VOLUME = 0;
const MAX_VOLUME = 100;
/** The lo-fi effects' range (PRD US-3; the beat schema stores 0 to 100). */
const MIN_EFFECT = 0;
const MAX_EFFECT = 100;

/** Every edit the editor can make to a beat. `step` is 0-based. */
export type SequencerAction =
  | { type: "toggleStep"; track: TrackId; step: number }
  | { type: "clear" }
  | { type: "setTempo"; bpm: number }
  | { type: "setVolume"; track: TrackId; volume: number }
  | { type: "toggleMute"; track: TrackId }
  | { type: "setEffect"; effect: EffectId; value: number };

/** The lo-fi effects (PRD US-3): muffle (low-pass filter) and vinyl crackle, each 0 to 100. */
export type EffectId = keyof BeatPattern["effects"];

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
    case "setVolume":
      return setVolume(state, action.track, action.volume);
    case "toggleMute":
      return toggleMute(state, action.track);
    case "setEffect":
      return setEffect(state, action.effect, action.value);
  }
}

/**
 * One row's volume as a whole number from 0 to 100, like a saved beat stores. Returns `state`
 * itself for a no-op, so undo/redo history doesn't fill with empty changes.
 */
function setVolume(state: BeatPattern, track: TrackId, volume: number): BeatPattern {
  if (!Number.isFinite(volume)) return state;
  const next = Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, Math.round(volume)));
  return next === state.tracks[track].volume ? state : withTrack(state, track, { volume: next });
}

/**
 * Muffle or crackle as a whole number from 0 to 100, like a saved beat stores. Returns `state`
 * itself for a no-op, so undo/redo history doesn't fill with empty changes.
 */
function setEffect(state: BeatPattern, effect: EffectId, value: number): BeatPattern {
  if (!Number.isFinite(value)) return state;
  const next = Math.min(MAX_EFFECT, Math.max(MIN_EFFECT, Math.round(value)));
  return next === state.effects[effect] ? state : { ...state, effects: { ...state.effects, [effect]: next } };
}

/** Mutes an unmuted row, or unmutes a muted one; its volume and steps stay as they are. */
function toggleMute(state: BeatPattern, track: TrackId): BeatPattern {
  return withTrack(state, track, { muted: !state.tracks[track].muted });
}

/** A copy of `state` with one row changed. */
function withTrack(state: BeatPattern, track: TrackId, changes: Partial<Track>): BeatPattern {
  return { ...state, tracks: { ...state.tracks, [track]: { ...state.tracks[track], ...changes } } };
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
  return withTrack(state, track, { steps });
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
