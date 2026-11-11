// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/prisma";
import { createUser, EmailTakenError, verifyCredentials } from "@/lib/db/users";

const url = process.env.DATABASE_URL_TEST;
const db = url ? createPrismaClient(url) : null;
const input = { email: "nick@example.com", displayName: "nick", password: "hunter222" };

describe.skipIf(!url)("users (US-1)", () => {
  beforeEach(async () => {
    await db!.like.deleteMany();
    await db!.beat.deleteMany();
    await db!.user.deleteMany();
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("creates a user and never returns the password hash", async () => {
    const user = await createUser(input, db!);
    expect(user).toEqual({
      id: expect.any(String),
      email: "nick@example.com",
      displayName: "nick",
      createdAt: expect.any(Date),
    });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("stores a bcrypt hash, not the plain password", async () => {
    await createUser(input, db!);
    const row = await db!.user.findUniqueOrThrow({ where: { email: input.email } });
    expect(row.passwordHash).not.toBe(input.password);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$1\d\$/);
  });

  it("throws EmailTakenError for a duplicate email", async () => {
    await createUser(input, db!);
    await expect(createUser({ ...input, displayName: "other" }, db!)).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("verifies the right password and rejects a wrong one or an unknown email", async () => {
    const created = await createUser(input, db!);
    expect(await verifyCredentials(input.email, input.password, db!)).toEqual(created);
    expect(await verifyCredentials(input.email, "wrong-password", db!)).toBeNull();
    expect(await verifyCredentials("nobody@example.com", input.password, db!)).toBeNull();
  });
});
