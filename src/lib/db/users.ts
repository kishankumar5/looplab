import type { PrismaClient } from "@/generated/prisma/client";
import type { RegisterInput } from "@/lib/validation/auth";
import { prisma } from "./prisma";

/** A user as the app sees it. Never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailTakenError";
  }
}

/** Creates a user with a bcrypt-hashed password. Throws EmailTakenError for a duplicate email. */
export async function createUser(input: RegisterInput, db: PrismaClient = prisma): Promise<PublicUser> {
  void input;
  void db;
  throw new Error("not implemented");
}

/** Returns the user if the email and password match, otherwise null. */
export async function verifyCredentials(
  email: string,
  password: string,
  db: PrismaClient = prisma,
): Promise<PublicUser | null> {
  void email;
  void password;
  void db;
  throw new Error("not implemented");
}
