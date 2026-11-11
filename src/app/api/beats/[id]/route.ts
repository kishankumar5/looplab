import { apiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/validation";
import { getCurrentUserId } from "@/lib/auth";
import { BeatNotFoundError, deleteBeat, getBeat, updateBeat } from "@/lib/db/beats";
import { updateBeatSchema } from "@/lib/validation/beat";

type Ctx = RouteContext<"/api/beats/[id]">;

/** Turns "not found or not yours" into a 404, so private beats can't be discovered. */
async function notFoundIfMissing(work: () => Promise<Response>): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof BeatNotFoundError) return apiError("NOT_FOUND", error.message);
    throw error;
  }
}

/** GET /api/beats/{id}: a public beat, or your own private one (PRD US-4, US-5). */
export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params;
  const viewerId = await getCurrentUserId();
  return notFoundIfMissing(async () => Response.json({ beat: await getBeat(viewerId, id) }));
}

/** PATCH /api/beats/{id}: update title, pattern, or visibility (owner only). */
export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Sign in to edit beats");
  const { id } = await ctx.params;
  const parsed = await parseJsonBody(request, updateBeatSchema);
  if (parsed.error) return parsed.error;
  return notFoundIfMissing(async () => Response.json({ beat: await updateBeat(userId, id, parsed.data) }));
}

/** DELETE /api/beats/{id}: delete a beat (owner only). */
export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Sign in to delete beats");
  const { id } = await ctx.params;
  return notFoundIfMissing(async () => {
    await deleteBeat(userId, id);
    return new Response(null, { status: 204 });
  });
}
