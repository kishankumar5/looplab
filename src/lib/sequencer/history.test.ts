import { describe, expect, it } from "vitest";
import { defaultPattern, type BeatPattern } from "@/lib/validation/beat";
import { canRedo, canUndo, initHistory, withHistory, type History, type HistoryAction } from "./history";
import { sequencerReducer, type SequencerAction } from "./reducer";

const sequencer = withHistory(sequencerReducer);
type Step = HistoryAction<SequencerAction>;

const toggleKick = (step: number): Step => ({ type: "apply", action: { type: "toggleStep", track: "kick", step } });
const setTempo = (bpm: number): Step => ({ type: "apply", action: { type: "setTempo", bpm } });
const dragTempo = (bpm: number): Step => ({ type: "preview", action: { type: "setTempo", bpm } });
const CLEAR: Step = { type: "apply", action: { type: "clear" } };
const COMMIT: Step = { type: "commit" };
const UNDO: Step = { type: "undo" };
const REDO: Step = { type: "redo" };

/** Runs the actions in order, starting from an empty beat. */
function run(...actions: Step[]): History<BeatPattern> {
  return actions.reduce(sequencer, initHistory(defaultPattern()));
}

/** The kick steps that are on, numbered from 1, so patterns read at a glance. */
function kickSteps(history: History<BeatPattern>): number[] {
  return history.present.tracks.kick.steps.flatMap((on, i) => (on ? [i + 1] : []));
}

describe("withHistory", () => {
  it("starts with nothing to undo or redo", () => {
    const history = run();
    expect(history.present).toEqual(defaultPattern());
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  it("undo goes back one change and redo goes forward again", () => {
    expect(kickSteps(run(toggleKick(0), toggleKick(4)))).toEqual([1, 5]);

    const undone = run(toggleKick(0), toggleKick(4), UNDO);
    expect(kickSteps(undone)).toEqual([1]);
    expect(canRedo(undone)).toBe(true);

    expect(kickSteps(run(toggleKick(0), toggleKick(4), UNDO, REDO))).toEqual([1, 5]);
  });

  it("undoes and redoes several changes in order", () => {
    const edits = [toggleKick(0), toggleKick(1), toggleKick(2)];
    expect(kickSteps(run(...edits, UNDO, UNDO))).toEqual([1]);
    expect(kickSteps(run(...edits, UNDO, UNDO, REDO))).toEqual([1, 2]);

    const allUndone = run(...edits, UNDO, UNDO, UNDO);
    expect(kickSteps(allUndone)).toEqual([]);
    expect(canUndo(allUndone)).toBe(false);
  });

  it("ignores undo and redo when there is nothing to undo or redo", () => {
    const empty = run();
    expect(sequencer(empty, UNDO)).toBe(empty);
    const edited = run(toggleKick(0));
    expect(sequencer(edited, REDO)).toBe(edited);
  });

  it("covers Clear and tempo changes", () => {
    const cleared = run(toggleKick(0), setTempo(100), CLEAR);
    expect(kickSteps(cleared)).toEqual([]);

    const clearUndone = sequencer(cleared, UNDO);
    expect(kickSteps(clearUndone)).toEqual([1]);
    expect(clearUndone.present.bpm).toBe(100);
    expect(sequencer(clearUndone, UNDO).present.bpm).toBe(82);
  });

  it("clears the redo history after a new change", () => {
    const history = run(toggleKick(0), toggleKick(1), UNDO, toggleKick(8));
    expect(canRedo(history)).toBe(false);
    expect(kickSteps(sequencer(history, REDO))).toEqual([1, 9]);
  });

  it("adds no entry, and keeps the redo history, for a change that changes nothing", () => {
    const history = run(toggleKick(0), toggleKick(1), UNDO);
    const unchanged = sequencer(history, setTempo(82));
    expect(unchanged).toBe(history);
    expect(canRedo(unchanged)).toBe(true);
  });

  it("keeps only the last 100 changes", () => {
    const counter = withHistory((n: number, by: number) => n + by);
    let history = initHistory(0);
    for (let i = 0; i < 150; i++) history = counter(history, { type: "apply", action: 1 });
    expect(history.past).toHaveLength(100);

    for (let i = 0; i < 100; i++) history = counter(history, { type: "undo" });
    expect(history.present).toBe(50);
    expect(canUndo(history)).toBe(false);
    expect(counter(history, { type: "undo" })).toBe(history);
  });
});

describe("withHistory slider drags", () => {
  it("shows a drag as it happens but records it as one change when it ends", () => {
    const moves = [84, 90, 97, 105, 112, 120].map(dragTempo);
    expect(run(...moves).present.bpm).toBe(120);

    const dragged = run(...moves, COMMIT);
    expect(dragged.present.bpm).toBe(120);
    expect(dragged.past).toHaveLength(1);

    const undone = sequencer(dragged, UNDO);
    expect(undone.present.bpm).toBe(82);
    expect(canUndo(undone)).toBe(false);
    expect(sequencer(undone, REDO).present.bpm).toBe(120);
  });

  it("records two drags as two changes", () => {
    const history = run(dragTempo(90), COMMIT, dragTempo(110), dragTempo(120), COMMIT);
    expect(sequencer(history, UNDO).present.bpm).toBe(90);
    expect(run(dragTempo(90), COMMIT, dragTempo(120), COMMIT, UNDO, UNDO).present.bpm).toBe(82);
  });

  it("adds no entry for a drag that changes nothing", () => {
    expect(canUndo(run(COMMIT))).toBe(false);
    expect(canUndo(run(dragTempo(82), COMMIT))).toBe(false);
  });

  it("adds no entry, and keeps the redo history, for a drag that ends where it started", () => {
    const history = run(toggleKick(0), UNDO, dragTempo(90), dragTempo(82), COMMIT);
    expect(history.present.bpm).toBe(82);
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(true);
  });

  it("clears the redo history when a drag after undoing ends", () => {
    const history = run(toggleKick(0), UNDO, dragTempo(100), COMMIT);
    expect(canRedo(history)).toBe(false);
    expect(sequencer(history, UNDO).present.bpm).toBe(82);
  });

  it("counts a drag that hasn't ended yet as a change", () => {
    const dragging = run(toggleKick(0), UNDO, dragTempo(100));
    expect(canUndo(dragging)).toBe(true);
    expect(canRedo(dragging)).toBe(false);
    expect(sequencer(dragging, UNDO).present.bpm).toBe(82);
  });

  it("records an unfinished drag before the next change, so undo takes them back one at a time", () => {
    const history = run(dragTempo(100), toggleKick(0));
    const undoneOnce = sequencer(history, UNDO);
    expect(undoneOnce.present.bpm).toBe(100);
    expect(kickSteps(undoneOnce)).toEqual([]);
    expect(sequencer(undoneOnce, UNDO).present.bpm).toBe(82);
  });
});
