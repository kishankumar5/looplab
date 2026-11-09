// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/prisma";

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;

function post(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe.skipIf(!url)("POST /api/auth/register", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    process.env.DATABASE_URL = url; // the route uses the shared client
    ({ POST } = await import("@/app/api/auth/register/route"));
  });

  beforeEach(async () => {
    await db!.like.deleteMany();
    await db!.beat.deleteMany();
    await db!.user.deleteMany();
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("creates an account and returns the public user with 201", async () => {
    const res = await POST(post({ email: "nick@example.com", displayName: "nick", password: "hunter222" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user).toMatchObject({ email: "nick@example.com", displayName: "nick" });
    expect(body.user).not.toHaveProperty("passwordHash");
  });

  it("returns 409 with the PRD message for a duplicate email", async () => {
    const data = { email: "nick@example.com", displayName: "nick", password: "hunter222" };
    await POST(post(data));
    const res = await POST(post(data));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: { code: "CONFLICT", message: "An account with this email already exists." },
    });
  });

  it("returns 400 naming the field that failed", async () => {
    const res = await POST(post({ email: "nick@example.com", displayName: "nick", password: "short" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("password: Password must be at least 8 characters");
  });

  it("returns 400 for a body that isn't JSON", async () => {
    const res = await POST(post("not json"));
    expect(res.status).toBe(400);
  });
});
