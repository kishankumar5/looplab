// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaClient } from "@/lib/db/prisma";
import { defaultPattern } from "@/lib/validation/beat";
import { resetDb, seedBeat, seedUser } from "./helpers";

const auth = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUserId: async () => auth.userId }));

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = () => new Request("http://localhost/api/beats/x/remix", { method: "POST" });

describe.skipIf(!url)("remix (US-6)", () => {
  let remix: typeof import("@/app/api/beats/[id]/remix/route");
  let beats: typeof import("@/lib/db/beats");

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    remix = await import("@/app/api/beats/[id]/remix/route");
    beats = await import("@/lib/db/beats");
  });

  beforeEach(async () => {
    auth.userId = null;
    await resetDb(db!);
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  async function seedOriginal(opts: { isPublic?: boolean; title?: string } = {}) {
    const maya = await seedUser(db!, "maya");
    const pattern = { ...defaultPattern(), bpm: 96 };
    const original = await seedBeat(db!, maya.id, { title: "rainy window", pattern, ...opts });
    return { maya, original, pattern };
  }

  it("needs sign-in", async () => {
    const { original } = await seedOriginal();
    expect((await remix.POST(post(), ctx(original.id))).status).toBe(401);
  });

  it("copies a public beat into a new private beat I own, with credit", async () => {
    const { original, pattern } = await seedOriginal();
    auth.userId = (await seedUser(db!, "sam")).id;

    const res = await remix.POST(post(), ctx(original.id));
    expect(res.status).toBe(201);
    const { beat } = await res.json();
    expect(beat).toMatchObject({
      title: "rainy window (remix)",
      pattern,
      isPublic: false,
      isOwner: true,
      isRemix: true,
      creator: { displayName: "sam" },
      remixedFrom: { id: original.id, title: "rainy window", creator: { displayName: "maya" } },
    });
    expect(beat.id).not.toBe(original.id);
    const row = await db!.beat.findUniqueOrThrow({ where: { id: beat.id } });
    expect(row).toMatchObject({ ownerId: auth.userId, remixedFromId: original.id, isPublic: false });
  });

  it("returns 404 for someone else's private beat and for a missing beat", async () => {
    const { original } = await seedOriginal({ isPublic: false });
    auth.userId = (await seedUser(db!, "sam")).id;
    expect((await remix.POST(post(), ctx(original.id))).status).toBe(404);
    expect((await remix.POST(post(), ctx("missing"))).status).toBe(404);
    expect(await db!.beat.count()).toBe(1);
  });

  it("lets me remix my own private beat, and still credits it to me", async () => {
    const { maya, original } = await seedOriginal({ isPublic: false });
    auth.userId = maya.id;
    const { beat } = await (await remix.POST(post(), ctx(original.id))).json();
    expect(beat.remixedFrom).toMatchObject({ id: original.id, creator: { displayName: "maya" } });
  });

  it("keeps the title within 80 characters", async () => {
    const { original } = await seedOriginal({ title: "x".repeat(80) });
    auth.userId = (await seedUser(db!, "sam")).id;
    const { beat } = await (await remix.POST(post(), ctx(original.id))).json();
    expect(beat.title).toHaveLength(80);
    expect(beat.title.endsWith(" (remix)")).toBe(true);
  });

  it("says the original is gone once it is made private or deleted", async () => {
    const { original } = await seedOriginal();
    const samId = (await seedUser(db!, "sam")).id;
    auth.userId = samId;
    const { beat } = await (await remix.POST(post(), ctx(original.id))).json();

    await db!.beat.update({ where: { id: original.id }, data: { isPublic: false } });
    expect(await beats.getBeat(samId, beat.id, db!)).toMatchObject({ isRemix: true, remixedFrom: null });

    await db!.beat.delete({ where: { id: original.id } });
    expect(await beats.getBeat(samId, beat.id, db!)).toMatchObject({ isRemix: true, remixedFrom: null });
  });

  it("a beat that isn't a remix has isRemix false", async () => {
    const { maya, original } = await seedOriginal();
    expect(await beats.getBeat(maya.id, original.id, db!)).toMatchObject({ isRemix: false, remixedFrom: null });
  });

  it("My Beats shows the remix credit", async () => {
    const { original } = await seedOriginal();
    const samId = (await seedUser(db!, "sam")).id;
    await beats.remixBeat(samId, original.id, db!);
    const [row] = await beats.listMyBeats(samId, db!);
    expect(row).toMatchObject({
      title: "rainy window (remix)",
      isRemix: true,
      remixedFrom: { id: original.id, title: "rainy window", creator: { displayName: "maya" } },
    });
  });
});
