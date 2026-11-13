import type { TrackId } from "@/lib/validation/beat";
import { TRACK_LOOKS } from "./tracks";

export interface StepCellProps {
  track: TrackId;
  /** 0-based step index. */
  step: number;
  on: boolean;
  /** This cell is in the column being played. */
  playhead: boolean;
  /** Leave it out for a read-only cell: disabled, so it's announced as unavailable and skipped by Tab. */
  onToggle?: () => void;
}

const PAD = [
  // An empty pad: outlined, with a little depth. Active pads are filled (never colour alone).
  "aspect-square rounded-md border border-line bg-panel-2 shadow-pad",
  "motion-safe:transition-[scale,filter,background-color,box-shadow] motion-safe:duration-100",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2",
  // Playhead column (mockup .cell.now): accent-2 outline, a faint wash on empty pads, lit active pads.
  "data-playhead:outline-2 data-playhead:outline-accent-2",
  "not-aria-pressed:data-playhead:bg-accent-2/20 aria-pressed:data-playhead:brightness-115",
].join(" ");

// Brighten on hover, shrink a little on press (only when the user is fine with motion). Editable cells only.
const EDITABLE = "cursor-pointer motion-safe:hover:brightness-125 motion-safe:active:scale-92";

/**
 * One step of the grid. A real button, so click, Enter, and Space all toggle it (PRD US-2). Without
 * onToggle it's read-only: still a pressed/not-pressed button, but disabled.
 */
export function StepCell({ track, step, on, playhead, onToggle }: StepCellProps) {
  const look = TRACK_LOOKS[track];
  return (
    <button
      type="button"
      aria-label={`${look.name} step ${step + 1}`}
      aria-pressed={on}
      data-playhead={playhead || undefined}
      onClick={onToggle}
      disabled={!onToggle}
      className={`${PAD} ${onToggle ? EDITABLE : ""} ${look.activePad}`}
    />
  );
}
