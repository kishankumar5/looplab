import type { BeatPattern } from "@/lib/validation/beat";

/** The one unsaved beat we keep in the browser so it survives the sign-in redirect (PRD US-1). */
export interface Draft {
  title: string;
  pattern: BeatPattern;
}

export const DRAFT_KEY = "looplab:draft";

export function saveDraft(draft: Draft): void {
  void draft;
  throw new Error("not implemented");
}

export function loadDraft(): Draft | null {
  throw new Error("not implemented");
}

export function clearDraft(): void {
  throw new Error("not implemented");
}
