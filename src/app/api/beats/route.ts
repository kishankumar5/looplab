import { apiError } from "@/lib/api/errors";
import { getCurrentUserId } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createBeat, listPublicBeats } from "@/lib/db/beats";
import { createBeatSchema } from "@/lib/validation/beat";
import { galleryQuerySchema } from "@/lib/validation/gallery";

/** GET /api/beats?sort=new|likes&page=N: list public beats (PRD US-6). No sign-in needed. */
export async function GET(request: Request): Promise<Response> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = galleryQuerySchema.safeParse(params);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return apiError("BAD_REQUEST", `${issue.path.join(".")}: ${issue.message}`);
  }
  return Response.json(await listPublicBeats(parsed.data, await getCurrentUserId()));
}

/** POST /api/beats: save a new beat (PRD US-4). Signed-in only; new beats are private. */
export async function POST(request: Request): Promise<Response> {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Sign in to save beats");
  const parsed = await parseJsonBody(request, createBeatSchema);
  if (parsed.error) return parsed.error;
  return Response.json({ beat: await createBeat(userId, parsed.data) }, { status: 201 });
}
