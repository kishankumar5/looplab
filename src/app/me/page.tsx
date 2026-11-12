import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { MyBeatRow } from "@/components/beats/MyBeatRow";
import { getCurrentUserId } from "@/lib/auth";
import { listMyBeats } from "@/lib/db/beats";
import { timeAgo } from "@/lib/format/time";

export const metadata: Metadata = { title: "My Beats · LoopLab" };

/** My Beats (PRD US-4): only the owner sees this page. */
export default function MyBeatsPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">My Beats</h1>
      <p className="mb-4 text-sm text-muted">Only you can see this page. New beats start private.</p>
      <Suspense fallback={<p className="text-muted">Loading your beats…</p>}>
        <MyBeatsList />
      </Suspense>
    </main>
  );
}

async function MyBeatsList() {
  await connection();
  const userId = await getCurrentUserId();
  if (!userId) redirect("/signin?callbackUrl=%2Fme");
  const beats = await listMyBeats(userId);

  if (beats.length === 0) {
    return (
      <p className="text-muted">
        No beats yet. <Link href="/" className="text-accent-2">Make your first one</Link>.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {beats.map((beat) => (
        <MyBeatRow
          key={beat.id}
          id={beat.id}
          title={beat.title}
          bpm={beat.bpm}
          isPublic={beat.isPublic}
          editedAgo={timeAgo(beat.updatedAt)}
          isRemix={beat.isRemix}
          remixedFrom={beat.remixedFrom}
        />
      ))}
    </ul>
  );
}
