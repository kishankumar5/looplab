// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BeatNotFoundError, createBeat, deleteBeat, getBeat, listMyBeats, updateBeat } from "@/lib/db/beats";
import { createPrismaClient } from "@/lib/db/prisma";
import { defaultPattern } from "@/lib/validation/beat";
import { resetDb, seedUser } from "./helpers";

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;

describe.skipIf(!url)("saving and managing beats (US-4)", () => {
  beforeEach(async () => {
    await resetDb(db!);
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("saves a new private beat and loads it back for the owner", async () => {
    const owner = await seedUser(db!, "nick");
    const created = await createBeat(owner.id, { title: "rainy window", pattern: defaultPattern() }, db!);
    expect(created).toMatchObject({ title: "rainy window", isPublic: false, isOwner: true, creator: { displayName: "nick" } });

    const loaded = await getBeat(owner.id, created.id, db!);
    expect(loaded.pattern).toEqual(defaultPattern());
    expect(loaded.remixedFrom).toBeNull();
  });

  it("lists my beats only, most recently edited first, with BPM", async () => {
    const me = await seedUser(db!);
    const other = await seedUser(db!);
    const first = await createBeat(me.id, { title: "first", pattern: defaultPattern() }, db!);
    const fast = { ...defaultPattern(), bpm: 120 };
    await createBeat(me.id, { title: "second", pattern: fast }, db!);
    await createBeat(other.id, { title: "not mine", pattern: defaultPattern() }, db!);
    await updateBeat(me.id, first.id, { title: "first, edited" }, db!);

    const mine = await listMyBeats(me.id, db!);
    expect(mine.map((b) => b.title)).toEqual(["first, edited", "second"]);
    expect(mine[1]).toMatchObject({ bpm: 120, isPublic: false });
  });

  it("renames, re-saves the pattern, and changes visibility", async () => {
    const me = await seedUser(db!);
    const beat = await createBeat(me.id, { pattern: defaultPattern() }, db!);
    const changed = defaultPattern();
    changed.tracks.kick.steps[0] = true;

    const updated = await updateBeat(me.id, beat.id, { title: "renamed", pattern: changed, isPublic: true }, db!);
    expect(updated).toMatchObject({ title: "renamed", isPublic: true });
    expect(updated.pattern.tracks.kick.steps[0]).toBe(true);
  });

  it("deletes my beat", async () => {
    const me = await seedUser(db!);
    const beat = await createBeat(me.id, { pattern: defaultPattern() }, db!);
    await deleteBeat(me.id, beat.id, db!);
    expect(await listMyBeats(me.id, db!)).toEqual([]);
  });

  it("hides private beats from others and blocks them from changing or deleting mine", async () => {
    const me = await seedUser(db!);
    const other = await seedUser(db!);
    const beat = await createBeat(me.id, { pattern: defaultPattern() }, db!);

    await expect(getBeat(other.id, beat.id, db!)).rejects.toBeInstanceOf(BeatNotFoundError);
    await expect(getBeat(null, beat.id, db!)).rejects.toBeInstanceOf(BeatNotFoundError);
    await expect(updateBeat(other.id, beat.id, { title: "hijacked" }, db!)).rejects.toBeInstanceOf(BeatNotFoundError);
    await expect(deleteBeat(other.id, beat.id, db!)).rejects.toBeInstanceOf(BeatNotFoundError);
    expect((await getBeat(me.id, beat.id, db!)).title).toBe("Untitled beat");
  });

  it("lets anyone load a public beat, but only the owner is the owner", async () => {
    const me = await seedUser(db!);
    const beat = await createBeat(me.id, { pattern: defaultPattern() }, db!);
    await updateBeat(me.id, beat.id, { isPublic: true }, db!);
    expect(await getBeat(null, beat.id, db!)).toMatchObject({ isOwner: false, isPublic: true });
  });
});
