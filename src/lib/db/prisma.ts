import type { PrismaClient } from "@/generated/prisma/client";

/** Creates a Prisma client for the given Postgres connection string. */
export function createPrismaClient(connectionString: string): PrismaClient {
  void connectionString;
  throw new Error("not implemented");
}
