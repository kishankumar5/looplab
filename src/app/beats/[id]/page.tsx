import type { Metadata } from "next";
import { Suspense } from "react";
import { SavedBeatEditor } from "@/components/beats/SavedBeatEditor";

export const metadata: Metadata = { title: "Edit beat · LoopLab" };

/** Editor for a saved beat (PRD US-4), owner only. Everyone else sees the 404 page. */
export default function SavedBeatPage({ params }: PageProps<"/beats/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <h1 className="sr-only">Edit beat</h1>
      <Suspense fallback={<p className="text-muted">Loading your beat…</p>}>
        <SavedBeatEditor params={params} />
      </Suspense>
    </main>
  );
}
