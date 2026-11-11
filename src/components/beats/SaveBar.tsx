"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearDraft, saveDraft } from "@/lib/beats/draft";
import type { BeatPattern } from "@/lib/validation/beat";

export interface SaveBarProps {
  /** null until the beat has been saved once. */
  beatId: string | null;
  initialTitle: string;
  /** The editor's current pattern. */
  pattern: BeatPattern;
  signedIn: boolean;
}

const DEFAULT_TITLE = "Untitled beat";
const snapshot = (title: string, pattern: BeatPattern) => JSON.stringify([title, pattern]);

/**
 * Title + Save for the editor (PRD US-1, US-4). Drop it into the editor and pass the current pattern:
 * - first save creates the beat and moves to /beats/{id}; later saves update it in place
 * - signed out: keeps the beat as a draft (see loadDraft) and sends you to sign in
 * - warns before leaving the page with unsaved changes
 */
export function SaveBar({ beatId, initialTitle, pattern, signedIn }: SaveBarProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    const res = await fetch(beatId ? `/api/beats/${beatId}` : "/api/beats", {
      method: beatId ? "PATCH" : "POST",
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
    if (!beatId) router.replace(`/beats/${json.beat.id}`);
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
        className="min-w-0 flex-1 border-b border-dashed border-line bg-transparent py-1 text-xl font-bold focus-visible:outline-2 focus-visible:outline-accent-2"
      />
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
        className="rounded-lg bg-accent px-4 py-2 font-bold text-on-accent disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
      >
        Save
      </button>
    </div>
  );
}
