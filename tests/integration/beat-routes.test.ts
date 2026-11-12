// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaClient } from "@/lib/db/prisma";
import { defaultPattern } from "@/lib/validation/beat";
import { resetDb, seedUser } from "./helpers";

const auth = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUserId: async () => auth.userId }));

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const json = (method: string, body?: unknown) =>
  new Request("http://localhost/api/beats", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe.skipIf(!url)("beat routes (US-4)", () => {
  let beats: typeof import("@/app/api/beats/route");
  let beat: typeof import("@/app/api/beats/[id]/route");
  let mine: typeof import("@/app/api/me/beats/route");

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    beats = await import("@/app/api/beats/route");
    beat = await import("@/app/api/beats/[id]/route");
    mine = await import("@/app/api/me/beats/route");
  });

  beforeEach(async () => {
    auth.userId = null;
    await resetDb(db!);
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("POST /api/beats saves for the signed-in user with 201", async () => {
    auth.userId = (await seedUser(db!)).id;
    const res = await beats.POST(json("POST", { title: "rainy window", pattern: defaultPattern() }));
    expect(res.status).toBe(201);
    expect((await res.json()).beat).toMatchObject({ title: "rainy window", isPublic: false, isOwner: true });
  });

  it("POST /api/beats needs sign-in and a valid pattern", async () => {
    expect((await beats.POST(json("POST", { pattern: defaultPattern() }))).status).toBe(401);
    auth.userId = (await seedUser(db!)).id;
    const res = await beats.POST(json("POST", { pattern: { ...defaultPattern(), bpm: 500 } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toMatch(/^pattern\.bpm: /);
  });

  it("GET /api/me/beats lists my beats and needs sign-in", async () => {
    expect((await mine.GET()).status).toBe(401);
    auth.userId = (await seedUser(db!)).id;
    await beats.POST(json("POST", { title: "one", pattern: defaultPattern() }));
    const body = await (await mine.GET()).json();
    expect(body.beats).toHaveLength(1);
    expect(body.beats[0]).toMatchObject({ title: "one", bpm: 82, isPublic: false });
  });

  it("GET, PATCH, and DELETE /api/beats/{id} work for the owner", async () => {
    auth.userId = (await seedUser(db!)).id;
    const { beat: created } = await (await beats.POST(json("POST", { pattern: defaultPattern() }))).json();

    expect((await beat.GET(json("GET"), ctx(created.id))).status).toBe(200);
    const renamed = await beat.PATCH(json("PATCH", { title: "renamed" }), ctx(created.id));
    expect((await renamed.json()).beat.title).toBe("renamed");
    const deleted = await beat.DELETE(json("DELETE"), ctx(created.id));
    expect(deleted.status).toBe(204);
    expect((await beat.GET(json("GET"), ctx(created.id))).status).toBe(404);
  });

  it("returns 404 to anyone else for a private beat, including PATCH and DELETE", async () => {
    auth.userId = (await seedUser(db!)).id;
    const { beat: created } = await (await beats.POST(json("POST", { pattern: defaultPattern() }))).json();

    auth.userId = (await seedUser(db!)).id;
    expect((await beat.GET(json("GET"), ctx(created.id))).status).toBe(404);
    expect((await beat.PATCH(json("PATCH", { title: "x" }), ctx(created.id))).status).toBe(404);
    expect((await beat.DELETE(json("DELETE"), ctx(created.id))).status).toBe(404);

    auth.userId = null;
    expect((await beat.PATCH(json("PATCH", { title: "x" }), ctx(created.id))).status).toBe(401);
  });
});
