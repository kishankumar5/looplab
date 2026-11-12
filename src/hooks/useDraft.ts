import { useMemo, useSyncExternalStore } from "react";
import { loadDraft, type Draft } from "@/lib/beats/draft";

// The draft is read when the editor opens; nothing needs to announce later changes to it.
const subscribe = () => () => {};
// A string snapshot, so it stays equal from one render to the next while the stored draft doesn't change.
const readDraft = () => JSON.stringify(loadDraft());
const noDraftOnServer = () => "null";

/**
 * The unsaved draft kept across the sign-in redirect (PRD US-1), or null. The server has no
 * localStorage, so the server render and hydration both see no draft; React then re-renders with
 * the stored one. Reading it any earlier would make the hydrated page differ from the server's.
 */
export function useDraft(): Draft | null {
  const snapshot = useSyncExternalStore(subscribe, readDraft, noDraftOnServer);
  return useMemo(() => JSON.parse(snapshot) as Draft | null, [snapshot]);
}
