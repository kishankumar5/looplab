"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { RemixOriginal } from "@/lib/db/beats";
import { RemixCredit } from "./RemixCredit";

export interface MyBeatRowProps {
  id: string;
  title: string;
  bpm: number;
  isPublic: boolean;
  editedAgo: string;
  isRemix?: boolean;
  remixedFrom?: RemixOriginal | null;
}

const button =
  "rounded-lg border border-line px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

/** One row on My Beats (mockup My Beats screen): open, rename inline, delete with confirmation. */
export function MyBeatRow({ id, title, bpm, isPublic, editedAgo, isRemix = false, remixedFrom = null }: MyBeatRowProps) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "PATCH" | "DELETE", body?: unknown) {
    setError(null);
    const res = await fetch(`/api/beats/${id}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error?.message ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newTitle = String(new FormData(event.currentTarget).get("title"));
    if (await send("PATCH", { title: newTitle })) setRenaming(false);
  }

  async function remove() {
    if (window.confirm(`Delete "${title}"? This can't be undone.`)) await send("DELETE");
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[10px] bg-panel px-3.5 py-3">
      {renaming ? (
        <form onSubmit={rename} className="flex min-w-[140px] flex-1 gap-2">
          <input
            name="title"
            defaultValue={title}
            aria-label="New title"
            required
            maxLength={80}
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-2 py-1"
          />
          <button type="submit" className={button}>
            Save title
          </button>
          <button type="button" onClick={() => setRenaming(false)} className={button}>
            Cancel
          </button>
        </form>
      ) : (
        <span className="min-w-[140px] flex-1 font-bold">{title}</span>
      )}
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs ${isPublic ? "border-accent-2 text-accent-2" : "border-line text-muted"}`}
      >
        {isPublic ? "Public" : "Private"}
      </span>
      <span className="text-sm text-muted">
        {bpm} BPM · edited {editedAgo}
      </span>
      <Link href={`/beats/${id}`} className={button}>
        Open
      </Link>
      {!renaming && (
        <button type="button" onClick={() => setRenaming(true)} className={button}>
          Rename
        </button>
      )}
      <button type="button" onClick={remove} className={`${button} text-danger`}>
        Delete
      </button>
      {isRemix && (
        <div className="w-full">
          <RemixCredit isRemix={isRemix} remixedFrom={remixedFrom} />
        </div>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
