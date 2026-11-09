export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

const DEFAULT_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

/** Builds the shared JSON error response used by every API route (PRD US-7). */
export function apiError(code: ApiErrorCode, message: string, status?: number): Response {
  void code;
  void message;
  void status;
  void DEFAULT_STATUS;
  throw new Error("not implemented");
}
