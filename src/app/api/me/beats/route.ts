import { apiError } from "@/lib/api/errors";
import { getCurrentUserId } from "@/lib/auth";
import { listMyBeats } from "@/lib/db/beats";

/** GET /api/me/beats: my beats, most recently edited first (PRD US-4). */
export async function GET(): Promise<Response> {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Sign in to see your beats");
  return Response.json({ beats: await listMyBeats(userId) });
}
