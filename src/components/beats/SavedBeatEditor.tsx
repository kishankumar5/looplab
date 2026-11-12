import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Editor } from "@/components/sequencer/Editor";
import { getCurrentUserId } from "@/lib/auth";
import { BeatNotFoundError, getBeat, type BeatDetail } from "@/lib/db/beats";

export interface SavedBeatEditorProps {
  params: Promise<{ id: string }>;
}

/**
 * The editor for a saved beat at /beats/{id}, for its owner only. Reads the session, so render it
 * inside <Suspense>. Anyone else, and any unknown id, gets the 404 page.
 */
export async function SavedBeatEditor({ params }: SavedBeatEditorProps) {
  // Request-time work (Cache Components): mark it before Auth.js reads the session cookie.
  await connection();
  const [{ id }, viewerId] = await Promise.all([params, getCurrentUserId()]);
  const beat = await findBeat(viewerId, id);
  // The same 404 for "doesn't exist" and "not yours", so private beats can't be discovered.
  // TODO(#9): send non-owners of a public beat to its listen-only page /b/{id} instead.
  if (!beat?.isOwner) notFound();
  return <Editor beatId={beat.id} initialTitle={beat.title} initialPattern={beat.pattern} signedIn />;
}

async function findBeat(viewerId: string | null, id: string): Promise<BeatDetail | null> {
  try {
    return await getBeat(viewerId, id);
  } catch (error) {
    if (error instanceof BeatNotFoundError) return null;
    throw error;
  }
}
