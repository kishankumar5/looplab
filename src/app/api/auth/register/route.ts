import { apiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/validation";
import { createUser, EmailTakenError } from "@/lib/db/users";
import { registerSchema } from "@/lib/validation/auth";

/** POST /api/auth/register: create an account (PRD US-1). */
export async function POST(request: Request): Promise<Response> {
  const parsed = await parseJsonBody(request, registerSchema);
  if (parsed.error) return parsed.error;

  try {
    const user = await createUser(parsed.data);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) return apiError("CONFLICT", error.message);
    throw error;
  }
}
