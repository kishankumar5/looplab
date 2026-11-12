import { useMemo, useState, useSyncExternalStore } from "react";
import { loadDraft, type Draft } from "@/lib/beats/draft";

// The draft is read when the editor opens; nothing needs to announce later changes to it.
const subscribe = () => () => {};
// A string snapshot, so it stays equal from one render to the next while the stored draft doesn't change.
const readDraft = () => JSON.stringify(loadDraft());
// Not valid JSON, so it can't be mistaken for a read that found no draft ("null").
const NOT_READ = "";
const notReadOnServer = () => NOT_READ;

/**
 * The unsaved draft kept across the sign-in redirect (PRD US-1), or null, as it was when the editor
 * opened. The server has no localStorage, so the server render and hydration both see no draft;
 * React then re-renders with the stored one. Reading it any earlier would make the hydrated page
 * differ from the server's. Saving clears the stored draft, but the editor stays open after its
 * first save, so this keeps returning the draft it started from.
 */
export function useDraft(): Draft | null {
  const stored = useSyncExternalStore(subscribe, readDraft, notReadOnServer);
  const [opened, setOpened] = useState(NOT_READ);
  // The first read in the browser is the draft the editor opened with.
  if (opened === NOT_READ && stored !== NOT_READ) setOpened(stored);
  const snapshot = opened === NOT_READ ? stored : opened;
  return useMemo(() => (snapshot === NOT_READ ? null : (JSON.parse(snapshot) as Draft | null)), [snapshot]);
}
