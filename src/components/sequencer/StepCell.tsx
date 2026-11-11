export interface StepCellProps {
  /** Display name of the row, e.g. "Hi-hat". */
  trackName: string;
  /** 0-based step index. */
  step: number;
  on: boolean;
  /** This cell is in the column being played. */
  playhead: boolean;
  onToggle: () => void;
}

/** One step of the grid. A real button, so click, Enter, and Space all toggle it (PRD US-2). */
export function StepCell({ trackName, step, on, playhead, onToggle }: StepCellProps) {
  return (
    <button
      type="button"
      aria-label={`${trackName} step ${step + 1}`}
      aria-pressed={on}
      data-playhead={playhead || undefined}
      onClick={onToggle}
      className="aspect-square cursor-pointer rounded-md border border-line bg-panel-2 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 data-playhead:outline-2 data-playhead:outline-accent-2"
    />
  );
}
