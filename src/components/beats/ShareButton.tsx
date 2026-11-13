"use client";

import { useId, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

export interface ShareButtonProps {
  /** null until the beat has been saved. */
  beatId: string | null;
  isPublic: boolean;
}

/** Why the beat can't be shared yet, or null when it can. */
function whyNotShareable(beatId: string | null, isPublic: boolean): string | null {
  if (!beatId) return "Save the beat, then make it public to share it.";
  if (!isPublic) return "Make the beat public to share it.";
  return null;
}

/**
 * "Copy share link" (mockup transport bar, PRD US-5): copies the beat's /b/{id} link and confirms
 * with a "Link copied" toast. Only a public beat can be shared; otherwise it says why it can't.
 */
export function ShareButton({ beatId, isPublic }: ShareButtonProps) {
  const reasonId = useId();
  const [toast, showToast] = useToast();
  const [linkToCopy, setLinkToCopy] = useState<string | null>(null);
  const reason = whyNotShareable(beatId, isPublic);

  async function copy() {
    const link = `${window.location.origin}/b/${beatId}`;
    setLinkToCopy(null);
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copied");
    } catch {
      // No clipboard (an insecure page, or permission denied): show the link to copy by hand.
      setLinkToCopy(link);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        disabled={reason !== null}
        aria-describedby={reason ? reasonId : undefined}
        className="cursor-pointer rounded-lg border border-line bg-panel-2 px-3.5 py-2 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
      >
        Copy share link
      </button>
      {reason && (
        <span id={reasonId} className="text-xs text-muted">
          {reason}
        </span>
      )}
      {linkToCopy && (
        <p role="alert" className="w-full text-sm text-danger">
          Couldn&apos;t copy the link. Copy it from here: <span className="select-all text-text">{linkToCopy}</span>
        </p>
      )}
      <Toast message={toast} />
    </>
  );
}
