import { apiError } from "@/lib/api/errors";
import { getCurrentUserId } from "@/lib/auth";
import { BeatNotFoundError, likeBeat, unlikeBeat, type LikeState } from "@/lib/db/beats";

type Ctx = RouteContext<"/api/beats/[id]/like">;

async function withLike(ctx: Ctx, action: (userId: string, beatId: string) => Promise<LikeState>) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Sign in to like beats");
  const { id } = await ctx.params;
  try {
    return Response.json(await action(userId, id));
  } catch (error) {
    if (error instanceof BeatNotFoundError) return apiError("NOT_FOUND", error.message);
    throw error;
  }
}

/** POST /api/beats/{id}/like: like a beat (PRD US-6). Liking twice keeps one like. */
export async function POST(_request: Request, ctx: Ctx): Promise<Response> {
  return withLike(ctx, likeBeat);
}

/** DELETE /api/beats/{id}/like: remove my like. */
export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  return withLike(ctx, unlikeBeat);
}
