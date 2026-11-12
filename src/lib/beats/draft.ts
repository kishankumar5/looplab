import { beatPatternSchema, type BeatPattern } from "@/lib/validation/beat";

/** The one unsaved beat we keep in the browser so it survives the sign-in redirect (PRD US-1). */
export interface Draft {
  title: string;
  pattern: BeatPattern;
}

export const DRAFT_KEY = "looplab:draft";

// Storage can be blocked (private windows, strict settings), so every access is guarded:
// losing a draft is better than crashing the editor.

export function saveDraft(draft: Draft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage blocked: nothing to keep */
  }
}

export function loadDraft(): Draft | null {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    const pattern = beatPatternSchema.safeParse(raw?.pattern);
    if (!pattern.success || typeof raw.title !== "string") return null;
    return { title: raw.title, pattern: pattern.data };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage blocked */
  }
}
