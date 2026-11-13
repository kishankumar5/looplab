import type { EffectId } from "@/lib/sequencer/reducer";
import type { BeatPattern } from "@/lib/validation/beat";

export interface LofiControls {
  onChange: (effect: EffectId, value: number) => void;
  /** A slider was let go: one history entry. */
  onCommit: () => void;
}

export interface LofiPanelProps {
  effects: BeatPattern["effects"];
  /** Leave it out on a read-only page: the values as text. */
  controls?: LofiControls;
}

/** The Lo-fi panel below the grid (mockup Editor screen, PRD US-3): Muffle and Vinyl crackle. */
export function LofiPanel(_props: LofiPanelProps): React.ReactNode {
  throw new Error("not implemented");
}
