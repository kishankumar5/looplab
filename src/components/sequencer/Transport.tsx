import { useId } from "react";
import { MAX_BPM, MIN_BPM } from "@/lib/validation/beat";

export interface TransportProps {
  playing: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onTempoChange: (bpm: number) => void;
  onClear: () => void;
}

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

/** The bar above the grid (mockup Editor screen): Play/Stop, Tempo, then Clear on the right. */
export function Transport({ playing, onTogglePlay, bpm, onTempoChange, onClear }: TransportProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-[10px] bg-panel px-3.5 py-3">
      <button
        type="button"
        aria-label={playing ? "Stop" : "Play"}
        onClick={onTogglePlay}
        className={`grid size-12 cursor-pointer place-items-center rounded-full bg-accent text-lg font-black text-on-accent ${FOCUS_RING}`}
      >
        {/* ▶ sits a touch left of centre in most fonts; nudge it. */}
        <span aria-hidden className={playing ? "" : "translate-x-px"}>
          {playing ? "■" : "▶"}
        </span>
      </button>
      <TempoSlider bpm={bpm} onChange={onTempoChange} />
      {/* TODO(#10): Swing slider */}
      <span className="flex-1" />
      <button
        type="button"
        onClick={onClear}
        className={`cursor-pointer rounded-lg border border-line px-3.5 py-2 ${FOCUS_RING}`}
      >
        Clear
      </button>
      {/* TODO(#9): Copy share link */}
    </div>
  );
}

/** Tempo, 60 to 140 BPM, with its value shown as text (CLAUDE.md accessibility rules). */
function TempoSlider({ bpm, onChange }: { bpm: number; onChange: (bpm: number) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-xs text-muted">
      <label htmlFor={id}>Tempo</label>
      <span className="text-sm font-bold text-text">{bpm} BPM</span>
      <input
        id={id}
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        value={bpm}
        aria-valuetext={`${bpm} BPM`}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`w-[130px] cursor-pointer accent-accent ${FOCUS_RING}`}
      />
    </div>
  );
}
