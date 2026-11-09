import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

/** Header area: "Signed in as {name}" + Sign out, or a Sign in link (PRD US-1). */
export async function UserMenu() {
  // Mark this as request-time before Auth.js runs (it uses random values, which can't be prerendered).
  await connection();
  const session = await auth();
  if (!session?.user) {
    return (
      <Link href="/signin" className="text-sm text-accent-2 hover:underline">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span>
        Signed in as <b className="text-text">{session.user.name}</b>
      </span>
      <SignOutButton />
    </div>
  );
}
