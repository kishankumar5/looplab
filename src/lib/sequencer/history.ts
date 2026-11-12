/** How many changes undo can go back (PRD US-3: at least 50). */
export const HISTORY_LIMIT = 100;

/** Undo/redo state around any value. Pure: no React, no browser APIs. */
export interface History<S> {
  /** Earlier states, oldest first; at most HISTORY_LIMIT of them. */
  past: S[];
  present: S;
  /** Undone states, the next redo first. */
  future: S[];
  /** Where an unfinished drag started (see "preview"), or null. */
  dragStart: S | null;
}

export type HistoryAction<A> =
  /** One undoable change, such as toggling a step or Clear. */
  | { type: "apply"; action: A }
  /** A change in progress, such as a slider being dragged: applied now, recorded on "commit". */
  | { type: "preview"; action: A }
  /** The drag ended: everything since its first preview becomes one history entry. */
  | { type: "commit" }
  | { type: "undo" }
  | { type: "redo" };

export function initHistory<S>(present: S): History<S> {
  void present;
  throw new Error("not implemented");
}

/** Wraps a pure reducer with undo/redo. Changes that return the same state add no entry. */
export function withHistory<S, A>(
  reducer: (state: S, action: A) => S,
  limit = HISTORY_LIMIT,
): (history: History<S>, action: HistoryAction<A>) => History<S> {
  void reducer;
  void limit;
  return () => {
    throw new Error("not implemented");
  };
}

export function canUndo<S>(history: History<S>): boolean {
  void history;
  throw new Error("not implemented");
}

export function canRedo<S>(history: History<S>): boolean {
  void history;
  throw new Error("not implemented");
}
