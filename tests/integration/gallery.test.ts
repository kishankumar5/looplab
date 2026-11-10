// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BeatNotFoundError, likeBeat, listPublicBeats, unlikeBeat } from "@/lib/db/beats";
import { createPrismaClient } from "@/lib/db/prisma";
import { resetDb, seedBeat, seedUser } from "./helpers";

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

describe.skipIf(!url)("gallery data (US-6)", () => {
  beforeEach(async () => {
    await resetDb(db!);
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("lists only public beats, newest first, with creator and like count", async () => {
    const owner = await seedUser(db!, "kishan");
    await seedBeat(db!, owner.id, { title: "old", createdAt: minutesAgo(10) });
    await seedBeat(db!, owner.id, { title: "new", createdAt: minutesAgo(1) });
    await seedBeat(db!, owner.id, { title: "secret", isPublic: false });

    const page = await listPublicBeats({ sort: "new", page: 1 }, null, db!);

    expect(page.beats.map((b) => b.title)).toEqual(["new", "old"]);
    expect(page.beats[0]).toMatchObject({ creator: { displayName: "kishan" }, likeCount: 0, likedByMe: false });
    expect(page.totalPages).toBe(1);
  });

  it("sorts by most liked, breaking ties by newest", async () => {
    const owner = await seedUser(db!);
    const [fan1, fan2] = [await seedUser(db!), await seedUser(db!)];
    const a = await seedBeat(db!, owner.id, { title: "one like", createdAt: minutesAgo(3) });
    const b = await seedBeat(db!, owner.id, { title: "two likes", createdAt: minutesAgo(5) });
    await seedBeat(db!, owner.id, { title: "no likes, newest", createdAt: minutesAgo(1) });
    await seedBeat(db!, owner.id, { title: "no likes, oldest", createdAt: minutesAgo(9) });
    await likeBeat(fan1.id, a.id, db!);
    await likeBeat(fan1.id, b.id, db!);
    await likeBeat(fan2.id, b.id, db!);

    const page = await listPublicBeats({ sort: "likes", page: 1 }, null, db!);

    expect(page.beats.map((x) => x.title)).toEqual(["two likes", "one like", "no likes, newest", "no likes, oldest"]);
    expect(page.beats[0].likeCount).toBe(2);
  });

  it("pages 20 at a time", async () => {
    const owner = await seedUser(db!);
    for (let i = 0; i < 25; i++) await seedBeat(db!, owner.id, { title: `beat ${i}`, createdAt: minutesAgo(100 - i) });

    const first = await listPublicBeats({ sort: "new", page: 1 }, null, db!);
    const second = await listPublicBeats({ sort: "new", page: 2 }, null, db!);

    expect(first.beats).toHaveLength(20);
    expect(second.beats).toHaveLength(5);
    expect(first.totalPages).toBe(2);
    expect(second.beats.at(-1)?.title).toBe("beat 0");
  });

  it("marks the beats the viewer has liked", async () => {
    const owner = await seedUser(db!);
    const viewer = await seedUser(db!);
    const beat = await seedBeat(db!, owner.id);
    await likeBeat(viewer.id, beat.id, db!);

    const asViewer = await listPublicBeats({ sort: "new", page: 1 }, viewer.id, db!);
    const asOwner = await listPublicBeats({ sort: "new", page: 1 }, owner.id, db!);

    expect(asViewer.beats[0].likedByMe).toBe(true);
    expect(asOwner.beats[0].likedByMe).toBe(false);
  });

  it("likes, ignores a double like, and unlikes", async () => {
    const owner = await seedUser(db!);
    const fan = await seedUser(db!);
    const beat = await seedBeat(db!, owner.id);

    expect(await likeBeat(fan.id, beat.id, db!)).toEqual({ liked: true, likeCount: 1 });
    expect(await likeBeat(fan.id, beat.id, db!)).toEqual({ liked: true, likeCount: 1 });
    expect(await unlikeBeat(fan.id, beat.id, db!)).toEqual({ liked: false, likeCount: 0 });
    expect(await unlikeBeat(fan.id, beat.id, db!)).toEqual({ liked: false, likeCount: 0 });
  });

  it("can't like a missing beat or someone else's private beat", async () => {
    const owner = await seedUser(db!);
    const fan = await seedUser(db!);
    const secret = await seedBeat(db!, owner.id, { isPublic: false });

    await expect(likeBeat(fan.id, "no-such-beat", db!)).rejects.toBeInstanceOf(BeatNotFoundError);
    await expect(likeBeat(fan.id, secret.id, db!)).rejects.toBeInstanceOf(BeatNotFoundError);
    await expect(likeBeat(owner.id, secret.id, db!)).resolves.toEqual({ liked: true, likeCount: 1 });
  });
});
