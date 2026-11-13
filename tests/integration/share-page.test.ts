// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ListenOnlyBeat } from "@/components/beats/ListenOnlyBeat";
import { SharedBeat } from "@/components/beats/SharedBeat";
import { createBeat, updateBeat } from "@/lib/db/beats";
import { prisma as db } from "@/lib/db/prisma";
import { defaultPattern } from "@/lib/validation/beat";
import { resetDb, seedUser } from "./helpers";

// The page runs as the viewer in `viewer.id` (null: signed out), against the test database.
const viewer = vi.hoisted(() => ({ id: null as string | null }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/auth", () => ({ getCurrentUserId: async () => viewer.id }));
vi.mock("@/lib/db/prisma", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/db/prisma")>();
  const url = process.env.DATABASE_URL_TEST;
  return { ...real, prisma: url ? real.createPrismaClient(url) : real.prisma };
});

const NOT_FOUND = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };

/** Renders the content of /b/{id} for the current viewer. */
function openSharePage(id: string) {
  return SharedBeat({ params: Promise.resolve({ id }) });
}

describe.skipIf(!process.env.DATABASE_URL_TEST)("listen-only page /b/[id] (US-5)", () => {
  beforeEach(async () => {
    viewer.id = null;
    await resetDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  async function seedBeats() {
    const owner = await seedUser(db, "nick");
    const someoneElse = await seedUser(db, "kishan");
    const pattern = { ...defaultPattern(), bpm: 96 };
    pattern.tracks.kick.steps[0] = true;
    const publicBeat = await createBeat(owner.id, { title: "study hall", pattern }, db);
    await updateBeat(owner.id, publicBeat.id, { isPublic: true }, db);
    const privateBeat = await createBeat(owner.id, { title: "rainy window", pattern: defaultPattern() }, db);
    return { owner, someoneElse, pattern, publicBeat, privateBeat };
  }

  it("shows a public beat to anyone, signed out, read-only", async () => {
    const { pattern, publicBeat } = await seedBeats();

    const page = await openSharePage(publicBeat.id);
    expect(page.type).toBe(ListenOnlyBeat);
    expect(page.props).toEqual({
      id: publicBeat.id,
      title: "study hall",
      creator: "nick",
      pattern,
      isOwner: false,
      isPublic: true,
      signedIn: false,
      isRemix: false,
      remixedFrom: null,
    });
  });

  it("shows a public beat to another signed-in user, without owner controls", async () => {
    const { someoneElse, publicBeat } = await seedBeats();
    viewer.id = someoneElse.id;
    const page = await openSharePage(publicBeat.id);
    expect(page.props).toMatchObject({ id: publicBeat.id, isOwner: false });
  });

  it("always shows the owner their own beat, public or private", async () => {
    const { owner, publicBeat, privateBeat } = await seedBeats();
    viewer.id = owner.id;
    expect((await openSharePage(publicBeat.id)).props).toMatchObject({ isOwner: true, isPublic: true });
    expect((await openSharePage(privateBeat.id)).props).toMatchObject({
      id: privateBeat.id,
      title: "rainy window",
      isOwner: true,
      isPublic: false,
    });
  });

  it("shows the 404 page for a private beat to anyone but its owner", async () => {
    const { someoneElse, privateBeat } = await seedBeats();
    await expect(openSharePage(privateBeat.id)).rejects.toMatchObject(NOT_FOUND);
    viewer.id = someoneElse.id;
    await expect(openSharePage(privateBeat.id)).rejects.toMatchObject(NOT_FOUND);
  });

  it("shows the same 404 page for an id that doesn't exist", async () => {
    await seedBeats();
    await expect(openSharePage("no-such-beat")).rejects.toMatchObject(NOT_FOUND);
  });

  it("shows the 404 page once a public beat is made private again", async () => {
    const { owner, publicBeat } = await seedBeats();
    await updateBeat(owner.id, publicBeat.id, { isPublic: false }, db);
    await expect(openSharePage(publicBeat.id)).rejects.toMatchObject(NOT_FOUND);
  });
});
