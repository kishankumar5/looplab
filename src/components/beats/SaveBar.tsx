"use client";

import type { BeatPattern } from "@/lib/validation/beat";

export interface SaveBarProps {
  /** null until the beat has been saved once. */
  beatId: string | null;
  initialTitle: string;
  /** The editor's current pattern. */
  pattern: BeatPattern;
  signedIn: boolean;
}

/** Title + Save for the editor (PRD US-4). Stub for the red step. */
export function SaveBar(props: SaveBarProps) {
  void props;
  return null;
}
