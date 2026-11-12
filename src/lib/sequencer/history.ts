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
  return { past: [], present, future: [], dragStart: null };
}

/**
 * Wraps a pure reducer with undo/redo. Changes that return the same state add no entry, and any
 * new entry clears the redo history. An unfinished drag is recorded before anything else happens,
 * so a missed "commit" can merge two drags but never loses one.
 */
export function withHistory<S, A>(
  reducer: (state: S, action: A) => S,
  limit = HISTORY_LIMIT,
): (history: History<S>, action: HistoryAction<A>) => History<S> {
  return (history, action) => {
    if (action.type === "preview") return preview(history, reducer(history.present, action.action));
    const settled = endDrag(history, limit);
    switch (action.type) {
      case "apply":
        return record(settled, reducer(settled.present, action.action), limit);
      case "commit":
        return settled;
      case "undo":
        return undo(settled);
      case "redo":
        return redo(settled, limit);
    }
  };
}

/** There is a change to take back, counting an unfinished drag. */
export function canUndo<S>(history: History<S>): boolean {
  return history.past.length > 0 || dragChanged(history);
}

/** There is an undone change to bring back. An unfinished drag will replace the redo history. */
export function canRedo<S>(history: History<S>): boolean {
  return history.future.length > 0 && !dragChanged(history);
}

function dragChanged<S>(history: History<S>): boolean {
  return history.dragStart !== null && history.dragStart !== history.present;
}

/** Adds `state` as the newest past entry, dropping the oldest beyond `limit`. */
function pushPast<S>(past: S[], state: S, limit: number): S[] {
  return [...past, state].slice(-limit);
}

function record<S>(history: History<S>, next: S, limit: number): History<S> {
  if (next === history.present) return history;
  return { past: pushPast(history.past, history.present, limit), present: next, future: [], dragStart: null };
}

function preview<S>(history: History<S>, next: S): History<S> {
  if (next === history.present) return history;
  return { ...history, present: next, dragStart: history.dragStart ?? history.present };
}

/** Turns an unfinished drag into one entry, from where it started to where it is now. */
function endDrag<S>(history: History<S>, limit: number): History<S> {
  const { dragStart } = history;
  if (dragStart === null) return history;
  if (dragStart === history.present) return { ...history, dragStart: null };
  return { past: pushPast(history.past, dragStart, limit), present: history.present, future: [], dragStart: null };
}

function undo<S>(history: History<S>): History<S> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    dragStart: null,
  };
}

function redo<S>(history: History<S>, limit: number): History<S> {
  if (history.future.length === 0) return history;
  const [next, ...rest] = history.future;
  return { past: pushPast(history.past, history.present, limit), present: next, future: rest, dragStart: null };
}
