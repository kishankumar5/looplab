import type { Metadata } from "next";
import { Suspense } from "react";
import { SharedBeat } from "@/components/beats/SharedBeat";

export const metadata: Metadata = { title: "Shared beat · LoopLab" };

/**
 * A beat's share link (PRD US-5): listen-only, no sign-in needed. A private beat is the 404 page for
 * everyone but its owner.
 */
export default function SharedBeatPage({ params }: PageProps<"/b/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      {/* Who may see the beat depends on the session cookie: stream it in. */}
      <Suspense fallback={<p className="text-muted">Loading the beat…</p>}>
        <SharedBeat params={params} />
      </Suspense>
    </main>
  );
}
