import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { Client } from "pg";

/**
 * Direct database access for seeding E2E data (the app's own DATABASE_URL).
 * Plain SQL because Playwright can't load the generated Prisma client (it's an ES module).
 */
async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("E2E tests need DATABASE_URL");
  const db = new Client({ connectionString });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

export const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const pattern = {
  version: 1,
  bpm: 82,
  swing: 0,
  tracks: {
    kick: { steps: [true, false, false, false, false, false, false, false, true, false, true, false, false, false, false, false], volume: 80, muted: false },
    snare: { steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], volume: 80, muted: false },
    hihat: { steps: Array.from({ length: 16 }, (_, i) => i % 2 === 0), volume: 80, muted: false },
    bass: { steps: Array.from({ length: 16 }, () => false), volume: 80, muted: false },
    synth: { steps: Array.from({ length: 16 }, () => false), volume: 80, muted: false },
  },
  effects: { muffle: 30, crackle: 20 },
};

/** Creates a user who owns one public and one private beat, and returns the beats' ids. */
export async function seedCreatorWithBeats(suffix: string): Promise<{ publicId: string; privateId: string }> {
  return withDb(async (db) => {
    const ownerId = randomUUID();
    await db.query('INSERT INTO "User" (id, email, "displayName", "passwordHash") VALUES ($1, $2, $3, $4)', [
      ownerId,
      `creator-${suffix}@example.com`,
      `creator ${suffix}`,
      "x",
    ]);
    const insertBeat = 'INSERT INTO "Beat" (id, "ownerId", title, pattern, "isPublic", "updatedAt") VALUES ($1, $2, $3, $4, $5, now())';
    const publicId = randomUUID();
    const privateId = randomUUID();
    await db.query(insertBeat, [publicId, ownerId, `public ${suffix}`, JSON.stringify(pattern), true]);
    await db.query(insertBeat, [privateId, ownerId, `private ${suffix}`, JSON.stringify(pattern), false]);
    return { publicId, privateId };
  });
}

/** Registers a fresh account through the UI and leaves it signed in. */
export async function registerAndSignIn(page: Page, suffix: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(`fan-${suffix}@example.com`);
  await page.getByLabel("Display name").fill(`fan ${suffix}`.slice(0, 40));
  await page.getByLabel("Password").fill("hunter222");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Signed in as").waitFor();
}

/** Gives an existing user (by email) private beats; later titles are newer. */
export async function seedBeatsFor(email: string, titles: string[]) {
  await withDb(async (db) => {
    const { rows } = await db.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (!rows[0]) throw new Error(`No user ${email}`);
    for (const [i, title] of titles.entries()) {
      const at = new Date(Date.now() - (titles.length - i) * 60_000);
      await db.query(
        'INSERT INTO "Beat" (id, "ownerId", title, pattern, "isPublic", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, false, $5, $5)',
        [randomUUID(), rows[0].id, title, JSON.stringify(pattern), at],
      );
    }
  });
}
