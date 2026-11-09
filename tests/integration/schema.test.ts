// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/prisma";

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;

const pattern = { version: 1, bpm: 82, tracks: { kick: { steps: [true, false] } } };

async function makeUser(email = "nick@example.com") {
  return db!.user.create({ data: { email, displayName: "nick", passwordHash: "hash" } });
}

describe.skipIf(!url)("database schema (PRD section 6)", () => {
  beforeEach(async () => {
    await db!.like.deleteMany();
    await db!.beat.deleteMany();
    await db!.user.deleteMany();
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("rejects a second user with the same email", async () => {
    await makeUser();
    await expect(makeUser()).rejects.toMatchObject({ code: "P2002" });
  });

  it("gives new beats a default title, private visibility, and timestamps", async () => {
    const user = await makeUser();
    const beat = await db!.beat.create({ data: { ownerId: user.id, pattern } });
    expect(beat.title).toBe("Untitled beat");
    expect(beat.isPublic).toBe(false);
    expect(beat.createdAt).toBeInstanceOf(Date);
    expect(beat.updatedAt).toBeInstanceOf(Date);
  });

  it("stores the beat pattern as JSON and returns it unchanged", async () => {
    const user = await makeUser();
    const beat = await db!.beat.create({ data: { ownerId: user.id, pattern } });
    const loaded = await db!.beat.findUniqueOrThrow({ where: { id: beat.id } });
    expect(loaded.pattern).toEqual(pattern);
  });

  it("allows only one like per user per beat", async () => {
    const user = await makeUser();
    const beat = await db!.beat.create({ data: { ownerId: user.id, pattern } });
    await db!.like.create({ data: { userId: user.id, beatId: beat.id } });
    await expect(db!.like.create({ data: { userId: user.id, beatId: beat.id } })).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("deletes a user's beats and likes when the user is deleted", async () => {
    const owner = await makeUser();
    const fan = await makeUser("fan@example.com");
    const beat = await db!.beat.create({ data: { ownerId: owner.id, pattern } });
    await db!.like.create({ data: { userId: fan.id, beatId: beat.id } });
    await db!.like.create({ data: { userId: owner.id, beatId: beat.id } });

    await db!.user.delete({ where: { id: owner.id } });

    expect(await db!.beat.count()).toBe(0);
    expect(await db!.like.count()).toBe(0);
  });

  it("keeps remixes when the original beat is deleted", async () => {
    const user = await makeUser();
    const original = await db!.beat.create({ data: { ownerId: user.id, pattern, isPublic: true } });
    const remix = await db!.beat.create({
      data: { ownerId: user.id, pattern, title: "remix", remixedFromId: original.id },
    });

    await db!.beat.delete({ where: { id: original.id } });

    const kept = await db!.beat.findUniqueOrThrow({ where: { id: remix.id } });
    expect(kept.remixedFromId).toBeNull();
  });
});
