"use client";

import type { ReactNode } from "react";

/** One beat playing at a time across the gallery (PRD US-6: each card previews in place). */
export function GalleryPreviewProvider(_props: { children: ReactNode }): ReactNode {
  throw new Error("not implemented");
}

export interface PreviewButtonProps {
  beatId: string;
  title: string;
  /** The saved pattern as stored (unvalidated JSON). */
  pattern: unknown;
}

/** A card's small Play/Stop button. */
export function PreviewButton(_props: PreviewButtonProps): ReactNode {
  throw new Error("not implemented");
}
