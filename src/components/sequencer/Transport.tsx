import { useId, type ReactNode } from "react";
import { RangeInput } from "@/components/ui/RangeInput";
import { MAX_BPM, MIN_BPM } from "@/lib/validation/beat";
import { PlayButton } from "./PlayButton";

export interface TransportProps {
  playing: boolean;
  onTogglePlay: () => void;
  bpm: number;
  /** The tempo slider moved. */
  onTempoChange: (bpm: number) => void;
  /** The tempo slider was let go (or nudged with an arrow key): one history entry. */
  onTempoCommit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  /** Shown after Clear, such as Copy share link. */
  children?: ReactNode;
}

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";
const GHOST_BUTTON = `cursor-pointer rounded-lg border border-line px-3.5 py-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`;

/** The bar above the grid (mockup Editor screen): Play/Stop, Tempo, then Undo, Redo, Clear, and `children`. */
export function Transport(props: TransportProps) {
  const { playing, onTogglePlay, bpm, onTempoChange, onTempoCommit, onClear, children } = props;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-[10px] bg-panel px-3.5 py-3">
      <PlayButton playing={playing} onToggle={onTogglePlay} />
      <TempoSlider bpm={bpm} onChange={onTempoChange} onCommit={onTempoCommit} />
      {/* TODO(#10): Swing slider */}
      <span className="flex-1" />
      <HistoryButtons {...props} />
      <button type="button" onClick={onClear} className={GHOST_BUTTON}>
        Clear
      </button>
      {children}
    </div>
  );
}

/** Undo and Redo, disabled when there is nothing to undo or redo (PRD US-3). */
function HistoryButtons({ canUndo, canRedo, onUndo, onRedo }: TransportProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Cmd/Ctrl+Z)"
        aria-keyshortcuts="Meta+Z Control+Z"
        className={GHOST_BUTTON}
      >
        <span aria-hidden>↶</span> Undo
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Shift+Cmd/Ctrl+Z)"
        aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
        className={GHOST_BUTTON}
      >
        <span aria-hidden>↷</span> Redo
      </button>
    </div>
  );
}

interface TempoSliderProps {
  bpm: number;
  onChange: (bpm: number) => void;
  onCommit: () => void;
}

/** Tempo, 60 to 140 BPM, with its value shown as text (CLAUDE.md accessibility rules). */
function TempoSlider({ bpm, onChange, onCommit }: TempoSliderProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-xs text-muted">
      <label htmlFor={id}>Tempo</label>
      <span className="text-sm font-bold text-text">{bpm} BPM</span>
      <RangeInput
        id={id}
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        aria-valuetext={`${bpm} BPM`}
        onChange={onChange}
        onCommit={onCommit}
        className={`w-[130px] cursor-pointer accent-accent ${FOCUS_RING}`}
      />
    </div>
  );
}
