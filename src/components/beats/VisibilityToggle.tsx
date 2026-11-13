"use client";

import { useState } from "react";

export interface VisibilityToggleProps {
  beatId: string;
  /** The beat's current visibility; the page holds it. */
  isPublic: boolean;
  /** Called with the new visibility once the server has saved it. */
  onChange: (isPublic: boolean) => void;
}

/**
 * Private/Public pill plus "Make public" / "Make private" (mockup title bar, PRD US-4). Saves the
 * change right away with PATCH /api/beats/{id}. Owner only: render it for a saved beat you own.
 */
export function VisibilityToggle({ beatId, isPublic, onChange }: VisibilityToggleProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/beats/${beatId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message);
      onChange(json?.beat?.isPublic ?? !isPublic);
    } catch (e) {
      setError((e instanceof Error && e.message) || "Couldn't change who can see this beat. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Announced when it changes, so the new state is heard, not just the new button label. */}
      <span
        aria-live="polite"
        className={`rounded-full border px-2.5 py-1 text-xs ${isPublic ? "border-accent-2 text-accent-2" : "border-line text-muted"}`}
      >
        {isPublic ? "Public" : "Private"}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
      >
        {isPublic ? "Make private" : "Make public"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
