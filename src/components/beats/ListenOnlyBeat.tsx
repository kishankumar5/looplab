"use client";

import type { BeatPattern } from "@/lib/validation/beat";

export interface ListenOnlyBeatProps {
  id: string;
  title: string;
  /** The creator's display name. */
  creator: string;
  pattern: BeatPattern;
  /** The viewer owns the beat: show an Edit link back to the editor. */
  isOwner: boolean;
  isPublic: boolean;
}

/**
 * The listen-only beat at /b/{id} (mockup Shared link screen, PRD US-5): title, creator, tempo,
 * Play/Stop, and the grid, read-only. No editing controls.
 */
export function ListenOnlyBeat(props: ListenOnlyBeatProps): React.JSX.Element {
  void props;
  throw new Error("not implemented");
}
