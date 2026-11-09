import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/db/users";
import { addUserIdToSession, addUserIdToToken, authorizeCredentials } from "./callbacks";

/**
 * Auth.js setup (PRD US-1): email + password via the Credentials provider, sessions as a signed JWT
 * in an HTTP-only cookie (Auth.js sets HttpOnly and SameSite=Lax, plus Secure on HTTPS).
 * The logic lives in ./callbacks (unit-tested); this file only wires it into Auth.js.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (raw) => authorizeCredentials(raw, verifyCredentials),
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => addUserIdToToken(token, user),
    session: ({ session, token }) => addUserIdToSession(session, token),
  },
});

/** The signed-in user's id, or null. Use in route handlers for ownership checks. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
