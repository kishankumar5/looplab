import { describe, expect, it } from "vitest";
import { apiError, type ApiErrorBody } from "./errors";

describe("apiError", () => {
  it("returns the shared error shape as JSON", async () => {
    const res = apiError("NOT_FOUND", "Beat not found");
    const body = (await res.json()) as ApiErrorBody;
    expect(body).toEqual({ error: { code: "NOT_FOUND", message: "Beat not found" } });
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("uses the default status for each code", () => {
    expect(apiError("BAD_REQUEST", "x").status).toBe(400);
    expect(apiError("UNAUTHORIZED", "x").status).toBe(401);
    expect(apiError("NOT_FOUND", "x").status).toBe(404);
    expect(apiError("CONFLICT", "x").status).toBe(409);
    expect(apiError("INTERNAL_ERROR", "x").status).toBe(500);
  });

  it("lets the caller override the status", () => {
    expect(apiError("BAD_REQUEST", "Too big", 413).status).toBe(413);
  });
});
