import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { findBeat } from "@/lib/db/beats";
import { ListenOnlyBeat } from "./ListenOnlyBeat";

export interface SharedBeatProps {
  params: Promise<{ id: string }>;
}

/**
 * The content of /b/{id}: a public beat for anyone, or your own beat. Reads the session, so render
 * it inside <Suspense>. A private beat that isn't yours, and any unknown id, gets the 404 page.
 */
export async function SharedBeat({ params }: SharedBeatProps) {
  // Request-time work (Cache Components): mark it before Auth.js reads the session cookie.
  await connection();
  const [{ id }, viewerId] = await Promise.all([params, getCurrentUserId()]);
  const beat = await findBeat(viewerId, id);
  // The same 404 for "doesn't exist" and "private, not yours", so private beats can't be discovered.
  if (!beat) notFound();
  return (
    <ListenOnlyBeat
      id={beat.id}
      title={beat.title}
      creator={beat.creator.displayName}
      pattern={beat.pattern}
      isOwner={beat.isOwner}
      isPublic={beat.isPublic}
    />
  );
}
