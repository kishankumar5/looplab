import type { ReactNode } from "react";

export interface StepCellProps {
  /** Display name of the row, e.g. "Hi-hat". */
  trackName: string;
  /** 0-based step index. */
  step: number;
  on: boolean;
  onToggle: () => void;
}

/** One step of the grid. A real button, so click, Enter, and Space all toggle it (PRD US-2). */
export function StepCell({ trackName, step, on, onToggle }: StepCellProps): ReactNode {
  throw new Error("not implemented");
}
