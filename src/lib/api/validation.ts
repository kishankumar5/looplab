import type { z } from "zod";
import { apiError } from "./errors";

type ParseResult<T> = { data: T; error?: never } | { data?: never; error: Response };

/** Reads a JSON request body and validates it. On failure, returns a 400 naming the field that failed (PRD US-7). */
export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: apiError("BAD_REQUEST", "Request body must be valid JSON") };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".") || "body";
    return { error: apiError("BAD_REQUEST", `${field}: ${issue.message}`) };
  }
  return { data: result.data };
}
