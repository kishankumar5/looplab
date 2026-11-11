import type { PublicUser } from "@/lib/db/users";
import { signInSchema } from "@/lib/validation/auth";

type VerifyFn = (email: string, password: string) => Promise<PublicUser | null>;

/** Credentials provider check: validate the form, then verify the password. Returns the Auth.js user or null. */
export async function authorizeCredentials(raw: unknown, verify: VerifyFn) {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return null;
  const user = await verify(parsed.data.email, parsed.data.password);
  return user ? { id: user.id, email: user.email, name: user.displayName } : null;
}

/** Copies the user id into the JWT when the user first signs in. */
export function addUserIdToToken<T extends Record<string, unknown>>(token: T, user?: { id?: string }): T {
  if (user?.id) return { ...token, userId: user.id };
  return token;
}

/** Exposes the user id from the JWT on the session. */
export function addUserIdToSession<S extends { user: { id: string } }>(session: S, token: Record<string, unknown>): S {
  if (typeof token.userId === "string") session.user.id = token.userId;
  return session;
}
