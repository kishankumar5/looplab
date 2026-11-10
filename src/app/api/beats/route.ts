import { apiError } from "@/lib/api/errors";
import { getCurrentUserId } from "@/lib/auth";
import { listPublicBeats } from "@/lib/db/beats";
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
