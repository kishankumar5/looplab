import { STEPS_PER_BAR, TRACK_IDS, type BeatPattern, type TrackId } from "@/lib/validation/beat";
import { StepCell } from "./StepCell";

export interface StepGridProps {
  pattern: BeatPattern;
  /** `step` is 0-based. */
  onToggleStep: (track: TrackId, step: number) => void;
}

const TRACK_NAMES: Record<TrackId, string> = {
  kick: "Kick",
  snare: "Snare",
  hihat: "Hi-hat",
  bass: "Bass",
  synth: "Synth",
};

/** Steps are shown in 4 blocks of 4 so beats are easy to count (PRD US-2): [[0..3], [4..7], ...]. */
const STEPS_PER_BLOCK = 4;
const BLOCKS = Array.from({ length: STEPS_PER_BAR / STEPS_PER_BLOCK }, (_, b) =>
  Array.from({ length: STEPS_PER_BLOCK }, (_, i) => b * STEPS_PER_BLOCK + i),
);

// Row header, then one column per block. The gap between blocks (16px) is wider than the gap
// between cells (5px), which is the visual break after every 4th step.
const ROW = "grid min-w-[640px] grid-cols-[150px_repeat(4,1fr)] items-center gap-x-4";
const BLOCK = "grid grid-cols-4 gap-[5px]";

/** The 5 x 16 step grid (mockup Editor screen, PRD US-2). */
export function StepGrid({ pattern, onToggleStep }: StepGridProps) {
  return (
    <div role="group" aria-label="Step grid" className="overflow-x-auto rounded-[10px] bg-panel p-3">
      <StepNumbers />
      {TRACK_IDS.map((track) => (
        <div key={track} className={`${ROW} mb-1.5 last:mb-0`}>
          {/* TODO(#11): volume slider and mute button */}
          <span className="text-sm">{TRACK_NAMES[track]}</span>
          {BLOCKS.map((block) => (
            <div key={block[0]} className={BLOCK}>
              {block.map((step) => (
                <StepCell
                  key={step}
                  trackName={TRACK_NAMES[track]}
                  step={step}
                  on={pattern.tracks[track].steps[step]}
                  onToggle={() => onToggleStep(track, step)}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Column numbers 1 to 16 above the grid. Hidden from screen readers: each cell's label has its number. */
function StepNumbers() {
  return (
    <div aria-hidden className={`${ROW} mb-1 text-[10px] text-muted`}>
      <span />
      {BLOCKS.map((block) => (
        <div key={block[0]} className={BLOCK}>
          {block.map((step) => (
            <span key={step} className="text-center">
              {step + 1}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
