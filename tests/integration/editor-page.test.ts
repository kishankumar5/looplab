// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SavedBeatEditor } from "@/components/beats/SavedBeatEditor";
import { Editor } from "@/components/sequencer/Editor";
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

/** Renders the content of /beats/{id} for the current viewer. */
function openBeatPage(id: string) {
  return SavedBeatEditor({ params: Promise.resolve({ id }) });
}

describe.skipIf(!process.env.DATABASE_URL_TEST)("saved-beat editor page /beats/[id] (US-4)", () => {
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
    const privateBeat = await createBeat(owner.id, { title: "rainy window", pattern }, db);
    const publicBeat = await createBeat(owner.id, { title: "study hall", pattern: defaultPattern() }, db);
    await updateBeat(owner.id, publicBeat.id, { isPublic: true }, db);
    return { owner, someoneElse, pattern, privateBeat, publicBeat };
  }

  it("opens the owner's beat in the editor with its saved pattern and title", async () => {
    const { owner, pattern, privateBeat } = await seedBeats();
    viewer.id = owner.id;

    const page = await openBeatPage(privateBeat.id);
    expect(page.type).toBe(Editor);
    expect(page.props).toEqual({
      beatId: privateBeat.id,
      initialTitle: "rainy window",
      initialPattern: pattern,
      signedIn: true,
      initialIsPublic: false,
    });
  });

  it("opens the owner's public beat showing it as public (US-4)", async () => {
    const { owner, publicBeat } = await seedBeats();
    viewer.id = owner.id;

    const page = await openBeatPage(publicBeat.id);
    expect(page.type).toBe(Editor);
    expect(page.props).toMatchObject({ beatId: publicBeat.id, initialIsPublic: true });
  });

  it("shows the 404 page for an id that doesn't exist", async () => {
    const { owner } = await seedBeats();
    viewer.id = owner.id;
    await expect(openBeatPage("no-such-beat")).rejects.toMatchObject(NOT_FOUND);
  });

  it("shows the 404 page for someone else's private beat", async () => {
    const { someoneElse, privateBeat } = await seedBeats();
    viewer.id = someoneElse.id;
    await expect(openBeatPage(privateBeat.id)).rejects.toMatchObject(NOT_FOUND);
  });

  it("shows the 404 page for someone else's public beat, since only the owner can edit it", async () => {
    const { someoneElse, publicBeat } = await seedBeats();
    viewer.id = someoneElse.id;
    await expect(openBeatPage(publicBeat.id)).rejects.toMatchObject(NOT_FOUND);
  });

  it("shows the 404 page when signed out", async () => {
    const { privateBeat, publicBeat } = await seedBeats();
    await expect(openBeatPage(privateBeat.id)).rejects.toMatchObject(NOT_FOUND);
    await expect(openBeatPage(publicBeat.id)).rejects.toMatchObject(NOT_FOUND);
  });
});
