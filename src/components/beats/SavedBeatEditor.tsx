import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Editor } from "@/components/sequencer/Editor";
import { getCurrentUserId } from "@/lib/auth";
import { findBeat } from "@/lib/db/beats";

export interface SavedBeatEditorProps {
  params: Promise<{ id: string }>;
}

/**
 * The editor for a saved beat at /beats/{id}, for its owner. Reads the session, so render it inside
 * <Suspense>. Anyone else is sent to a public beat's listen-only page /b/{id}; a private beat that
 * isn't yours, and any unknown id, gets the 404 page.
 */
export async function SavedBeatEditor({ params }: SavedBeatEditorProps) {
  // Request-time work (Cache Components): mark it before Auth.js reads the session cookie.
  await connection();
  const [{ id }, viewerId] = await Promise.all([params, getCurrentUserId()]);
  const beat = await findBeat(viewerId, id);
  // The same 404 for "doesn't exist" and "private, not yours", so private beats can't be discovered.
  if (!beat) notFound();
  // findBeat only returns someone else's beat when it's public: they can listen, not edit.
  if (!beat.isOwner) redirect(`/b/${beat.id}`);
  return (
    <Editor
      beatId={beat.id}
      initialTitle={beat.title}
      initialPattern={beat.pattern}
      signedIn
      initialIsPublic={beat.isPublic}
    />
  );
}
