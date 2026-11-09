// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { createPrismaClient, prisma } from "./prisma";

const globalForPrisma = globalThis as unknown as { prisma?: unknown };
const savedUrl = process.env.DATABASE_URL;

afterEach(() => {
  delete globalForPrisma.prisma;
  process.env.DATABASE_URL = savedUrl;
});

describe("prisma", () => {
  it("explains what is missing when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    expect(() => prisma.user).toThrow("DATABASE_URL is not set");
  });

  it("creates one shared client on first use and reuses it", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/unused";
    void prisma.user;
    const first = globalForPrisma.prisma;
    void prisma.beat;
    expect(first).toBeDefined();
    expect(globalForPrisma.prisma).toBe(first);
  });

  it("creates independent clients for explicit connection strings", () => {
    const a = createPrismaClient("postgresql://user:pass@localhost:5432/a");
    const b = createPrismaClient("postgresql://user:pass@localhost:5432/b");
    expect(a).not.toBe(b);
  });
});
