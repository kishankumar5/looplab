import bcrypt from "bcryptjs";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
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

const BCRYPT_COST = 10;
const publicFields = { id: true, email: true, displayName: true, createdAt: true } as const;
// Compared against when the email doesn't exist, so a missing account takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("looplab-dummy-password", BCRYPT_COST);

/** Creates a user with a bcrypt-hashed password. Throws EmailTakenError for a duplicate email. */
export async function createUser(input: RegisterInput, db: PrismaClient = prisma): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  try {
    return await db.user.create({
      data: { email: input.email, displayName: input.displayName, passwordHash },
      select: publicFields,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailTakenError();
    }
    throw error;
  }
}

/** Returns the user if the email and password match, otherwise null. */
export async function verifyCredentials(
  email: string,
  password: string,
  db: PrismaClient = prisma,
): Promise<PublicUser | null> {
  const row = await db.user.findUnique({ where: { email }, select: { ...publicFields, passwordHash: true } });
  const matches = await bcrypt.compare(password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !matches) return null;
  const { passwordHash: _omit, ...user } = row;
  void _omit;
  return user;
}
