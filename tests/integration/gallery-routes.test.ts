// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaClient } from "@/lib/db/prisma";
import { resetDb, seedBeat, seedUser } from "./helpers";

const auth = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUserId: async () => auth.userId }));

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!url)("gallery and like routes (US-6)", () => {
  let listBeats: (req: Request) => Promise<Response>;
  let like: typeof import("@/app/api/beats/[id]/like/route");

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ GET: listBeats } = await import("@/app/api/beats/route"));
    like = await import("@/app/api/beats/[id]/like/route");
  });

  beforeEach(async () => {
    auth.userId = null;
    await resetDb(db!);
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("GET /api/beats lists public beats without signing in", async () => {
    const owner = await seedUser(db!, "kishan");
    await seedBeat(db!, owner.id, { title: "study hall" });
    const res = await listBeats(new Request("http://localhost/api/beats?sort=likes&page=1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ page: 1, totalPages: 1 });
    expect(body.beats[0]).toMatchObject({ title: "study hall", creator: { displayName: "kishan" }, likeCount: 0 });
  });

  it("GET /api/beats rejects a bad sort with 400", async () => {
    const res = await listBeats(new Request("http://localhost/api/beats?sort=random"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("BAD_REQUEST");
  });

  it("liking requires signing in", async () => {
    const owner = await seedUser(db!);
    const beat = await seedBeat(db!, owner.id);
    const res = await like.POST(new Request("http://localhost", { method: "POST" }), ctx(beat.id));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("likes and unlikes for the signed-in user", async () => {
    const owner = await seedUser(db!);
    const fan = await seedUser(db!);
    const beat = await seedBeat(db!, owner.id);
    auth.userId = fan.id;

    const liked = await like.POST(new Request("http://localhost", { method: "POST" }), ctx(beat.id));
    expect(liked.status).toBe(200);
    expect(await liked.json()).toEqual({ liked: true, likeCount: 1 });

    const unliked = await like.DELETE(new Request("http://localhost", { method: "DELETE" }), ctx(beat.id));
    expect(await unliked.json()).toEqual({ liked: false, likeCount: 0 });
  });

  it("returns 404 for a private beat that isn't mine", async () => {
    const owner = await seedUser(db!);
    const fan = await seedUser(db!);
    const secret = await seedBeat(db!, owner.id, { isPublic: false });
    auth.userId = fan.id;
    const res = await like.POST(new Request("http://localhost", { method: "POST" }), ctx(secret.id));
    expect(res.status).toBe(404);
  });
});
