import type { PrismaClient } from "@/generated/prisma/client";

export const samplePattern = { version: 1, bpm: 82, tracks: { kick: { steps: [true, false, false, false] } } };

/** Empties every table, children first. */
export async function resetDb(db: PrismaClient) {
  await db.like.deleteMany();
  await db.beat.deleteMany();
  await db.user.deleteMany();
}

let counter = 0;
export async function seedUser(db: PrismaClient, displayName = "user") {
  counter += 1;
  return db.user.create({
    data: { email: `${displayName}-${counter}-${Date.now()}@example.com`, displayName, passwordHash: "x" },
  });
}

export async function seedBeat(
  db: PrismaClient,
  ownerId: string,
  data: { title?: string; isPublic?: boolean; createdAt?: Date; pattern?: object } = {},
) {
  return db.beat.create({ data: { ownerId, pattern: samplePattern, isPublic: true, ...data } });
}
