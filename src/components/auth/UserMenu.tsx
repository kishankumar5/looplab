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
      <Link href="/signin" className="whitespace-nowrap text-sm text-accent-2 hover:underline">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex min-w-0 grow basis-0 items-center justify-end gap-3 text-sm text-muted sm:grow-0 sm:basis-auto">
      {/* Long display names get cut off with "…" instead of pushing Sign out off screen. */}
      <span className="min-w-0 truncate">
        Signed in as <b className="text-text">{session.user.name}</b>
      </span>
      <SignOutButton />
    </div>
  );
}
