import type { ReactNode } from "react";
import type { BeatPattern, TrackId } from "@/lib/validation/beat";

export interface StepGridProps {
  pattern: BeatPattern;
  /** `step` is 0-based. */
  onToggleStep: (track: TrackId, step: number) => void;
}

/** The 5 x 16 step grid (mockup Editor screen, PRD US-2). */
export function StepGrid({ pattern, onToggleStep }: StepGridProps): ReactNode {
  throw new Error("not implemented");
}
