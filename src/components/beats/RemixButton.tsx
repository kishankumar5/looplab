"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export interface RemixButtonProps {
  beatId: string;
  signedIn: boolean;
}

/** Remix button (PRD US-6): copies the beat into my beats and opens the copy in the editor. */
export function RemixButton({ beatId, signedIn }: RemixButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remix() {
    if (!signedIn) {
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/beats/${beatId}/remix`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.beat?.id) {
      router.push(`/beats/${body.beat.id}`);
      return;
    }
    setError(body?.error?.message ?? "Couldn't remix this beat.");
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={remix}
        disabled={busy}
        className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 disabled:opacity-60"
      >
        Remix
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
