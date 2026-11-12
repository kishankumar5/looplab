import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { NewBeatEditor } from "@/components/sequencer/NewBeatEditor";
import { getCurrentUserId } from "@/lib/auth";

export const metadata: Metadata = { title: "New beat · LoopLab" };

/** Editor for a new, unsaved beat (PRD US-2). Anyone can use it; saving needs an account (US-1). */
export default function NewBeatPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <h1 className="sr-only">New beat</h1>
      {/* Save needs to know who is signed in, which reads the session cookie: stream it in. */}
      <Suspense fallback={<p className="text-muted">Loading the editor…</p>}>
        <NewBeat />
      </Suspense>
    </main>
  );
}

async function NewBeat() {
  // Request-time work (Cache Components): mark it before Auth.js reads the session cookie.
  await connection();
  const userId = await getCurrentUserId();
  return <NewBeatEditor signedIn={userId !== null} />;
}
