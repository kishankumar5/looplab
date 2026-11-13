import { useMemo, useReducer } from "react";
import { canRedo, canUndo, initHistory, withHistory } from "@/lib/sequencer/history";
import { sequencerReducer, type SequencerAction } from "@/lib/sequencer/reducer";
import { defaultPattern, type BeatPattern } from "@/lib/validation/beat";

const sequencerWithHistory = withHistory(sequencerReducer);

export interface Sequencer {
  /** The beat as it is now. */
  pattern: BeatPattern;
  canUndo: boolean;
  canRedo: boolean;
  /** One undoable change, such as toggling a step or Clear. */
  edit: (action: SequencerAction) => void;
  /** A slider moving: applied (and heard) right away, recorded as one change by commit(). */
  preview: (action: SequencerAction) => void;
  /** The slider was let go. */
  commit: () => void;
  undo: () => void;
  redo: () => void;
}

/**
 * The editor's state: the beat plus its undo/redo history (PRD US-3). Only the beat is in the
 * history; playback and the playhead live in usePlayback, so undo never stops the music.
 */
export function useSequencer(initial?: BeatPattern): Sequencer {
  const [history, dispatch] = useReducer(sequencerWithHistory, initial, (start) =>
    initHistory(start ?? defaultPattern()),
  );
  // Stable functions, so the keyboard shortcuts and the slider don't re-subscribe on every edit.
  const actions = useMemo(
    () => ({
      edit: (action: SequencerAction) => dispatch({ type: "apply", action }),
      preview: (action: SequencerAction) => dispatch({ type: "preview", action }),
      commit: () => dispatch({ type: "commit" }),
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
    }),
    [],
  );
  return { pattern: history.present, canUndo: canUndo(history), canRedo: canRedo(history), ...actions };
}
