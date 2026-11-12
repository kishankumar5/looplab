"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearDraft, saveDraft } from "@/lib/beats/draft";
import type { BeatPattern } from "@/lib/validation/beat";

export interface SaveBarProps {
  /** null until the beat has been saved once. */
  beatId: string | null;
  initialTitle: string;
  /** The editor's current pattern. */
  pattern: BeatPattern;
  signedIn: boolean;
  /** Shown right after the title, such as the tempo. */
  children?: ReactNode;
  /** Called once, when the first save creates the beat, before the address changes to /beats/{id}. */
  onCreated?: (id: string) => void;
}

const DEFAULT_TITLE = "Untitled beat";
const snapshot = (title: string, pattern: BeatPattern) => JSON.stringify([title, pattern]);

/**
 * Title + Save for the editor (PRD US-1, US-4). Drop it into the editor and pass the current pattern:
 * - first save creates the beat and changes the address to /beats/{id} without a navigation, so the
 *   editor stays mounted (playback and undo history carry on); later saves update that beat
 * - signed out: keeps the beat as a draft (see loadDraft) and sends you to sign in
 * - warns before leaving the page with unsaved changes
 */
export function SaveBar({ beatId, initialTitle, pattern, signedIn, children, onCreated }: SaveBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  // The editor isn't remounted after the first save, so the new beat's id is kept here.
  const [savedId, setSavedId] = useState(beatId);
  const [title, setTitle] = useState(initialTitle);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initialTitle, pattern));
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = snapshot(title, pattern) !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    const body = { title: title.trim() || DEFAULT_TITLE, pattern };
    if (!signedIn) {
      saveDraft(body);
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setError(null);
    setState("saving");
    const res = await fetch(savedId ? `/api/beats/${savedId}` : "/api/beats", {
      method: savedId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Couldn't save. Please try again.");
      setState("idle");
      return;
    }
    setSavedSnapshot(snapshot(title, pattern));
    setState("saved");
    clearDraft();
    if (!savedId) moveToNewBeat(json.beat.id);
  }

  function moveToNewBeat(id: string) {
    setSavedId(id);
    onCreated?.(id);
    // Not router.replace: that would render the /beats/[id] page and remount the editor. Next keeps
    // usePathname in step with replaceState; reloading the address opens the saved beat's page.
    window.history.replaceState(null, "", `/beats/${id}`);
  }

  const status = state === "saving" ? "Saving…" : dirty ? "Unsaved changes" : state === "saved" ? "Saved" : "";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={DEFAULT_TITLE}
        aria-label="Beat title"
        maxLength={80}
        className="min-w-0 flex-1 border-b border-dashed border-line bg-transparent py-1 text-[22px] font-bold placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-2"
      />
      {children}
      <p role="status" className="text-sm text-muted">
        {status}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={state === "saving"}
        className="cursor-pointer rounded-lg bg-accent px-4 py-2 font-bold text-on-accent disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
      >
        Save
      </button>
    </div>
  );
}
