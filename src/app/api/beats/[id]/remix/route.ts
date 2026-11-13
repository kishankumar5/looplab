import { apiError } from "@/lib/api/errors";
import { getCurrentUserId } from "@/lib/auth";
import { BeatNotFoundError, remixBeat } from "@/lib/db/beats";

type Ctx = RouteContext<"/api/beats/[id]/remix">;

/**
 * POST /api/beats/{id}/remix: copy a beat into my beats (PRD US-6).
 * The copy is private, titled "{title} (remix)", and credits the original.
 * Someone else's private beat returns 404, the same as a missing one.
 */
export async function POST(_request: Request, ctx: Ctx): Promise<Response> {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Sign in to remix beats");
  const { id } = await ctx.params;
  try {
    return Response.json({ beat: await remixBeat(userId, id) }, { status: 201 });
  } catch (error) {
    if (error instanceof BeatNotFoundError) return apiError("NOT_FOUND", error.message);
    throw error;
  }
}
