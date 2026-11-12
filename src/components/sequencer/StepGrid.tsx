import { STEPS_PER_BAR, TRACK_IDS, type BeatPattern, type TrackId } from "@/lib/validation/beat";
import { StepCell } from "./StepCell";
import { TRACK_LOOKS } from "./tracks";

export interface StepGridProps {
  pattern: BeatPattern;
  /** 0-based step the loop is playing, highlighted as the playhead; null or omitted when stopped. */
  playheadStep?: number | null;
  /** `step` is 0-based. Leave it out for a read-only grid (the listen-only page): nothing toggles. */
  onToggleStep?: (track: TrackId, step: number) => void;
  /** A row's volume slider moved (0 to 100). With onToggleMute, gives each row its volume and mute controls. */
  onVolumeChange?: (track: TrackId, volume: number) => void;
  /** A volume slider was let go (or nudged with an arrow key): one history entry. */
  onVolumeCommit?: () => void;
  /** A row's Mute button was pressed. */
  onToggleMute?: (track: TrackId) => void;
}

/** Steps are shown in 4 blocks of 4 so beats are easy to count (PRD US-2): [[0..3], [4..7], ...]. */
const STEPS_PER_BLOCK = 4;
const BLOCKS = Array.from({ length: STEPS_PER_BAR / STEPS_PER_BLOCK }, (_, b) =>
  Array.from({ length: STEPS_PER_BLOCK }, (_, i) => b * STEPS_PER_BLOCK + i),
);

// Row header, then one column per block. Rows touch, so the shaded blocks (below) run as one band
// from the step numbers to the last row. Blocks are padded and spaced apart, which is the visual
// break after every 4th step.
const ROW = "grid min-w-[640px] grid-cols-[150px_repeat(4,1fr)] items-center gap-x-2";

type Edge = "top" | "middle" | "bottom";
const EDGE_PADDING: Record<Edge, string> = {
  top: "rounded-t-lg pt-1.5 pb-[3px]",
  middle: "py-[3px]",
  bottom: "rounded-b-lg pt-[3px] pb-1.5",
};

/** Blocks 2 and 4 are shaded, so 1-4, 5-8, 9-12, 13-16 are easy to tell apart. */
function blockClass(blockIndex: number, edge: Edge) {
  const band = blockIndex % 2 === 1 ? "bg-text/5" : "";
  return `grid grid-cols-4 gap-[5px] px-1.5 ${EDGE_PADDING[edge]} ${band}`;
}

/** The 5 x 16 step grid (mockup Editor screen, PRD US-2). Read-only without onToggleStep (PRD US-5). */
export function StepGrid({ pattern, playheadStep = null, onToggleStep }: StepGridProps) {
  const label = onToggleStep ? "Step grid" : "Step grid (read-only)";
  return (
    <div role="group" aria-label={label} className="overflow-x-auto rounded-[10px] bg-panel p-3">
      <StepNumbers playheadStep={playheadStep} />
      {TRACK_IDS.map((track, row) => (
        <div key={track} className={ROW}>
          <TrackName track={track} />
          {BLOCKS.map((block, b) => (
            <div key={block[0]} className={blockClass(b, row === TRACK_IDS.length - 1 ? "bottom" : "middle")}>
              {block.map((step) => (
                <StepCell
                  key={step}
                  track={track}
                  step={step}
                  on={pattern.tracks[track].steps[step]}
                  playhead={step === playheadStep}
                  onToggle={onToggleStep && (() => onToggleStep(track, step))}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TrackName({ track }: { track: TrackId }) {
  const look = TRACK_LOOKS[track];
  return (
    <span className="flex items-center gap-2 text-sm">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${look.dot}`} />
      {look.name}
      {/* TODO(#11): volume slider and mute button */}
    </span>
  );
}

/**
 * Column numbers 1 to 16 above the grid; the first of each beat (1, 5, 9, 13) is bolder.
 * Hidden from screen readers: each cell's label has its number.
 */
function StepNumbers({ playheadStep }: { playheadStep: number | null }) {
  const numberClass = (step: number) => {
    if (step === playheadStep) return "font-bold text-accent-2";
    return step % STEPS_PER_BLOCK === 0 ? "font-bold text-text" : "";
  };
  return (
    <div aria-hidden className={`${ROW} text-[10px] text-muted`}>
      <span />
      {BLOCKS.map((block, b) => (
        <div key={block[0]} className={blockClass(b, "top")}>
          {block.map((step) => (
            <span key={step} className={`text-center ${numberClass(step)}`}>
              {step + 1}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
