import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "./UserMenu";

/**
 * Site header. On phones the nav drops to its own full-width row under the logo and the
 * account menu, so nothing is pushed off screen; from the sm breakpoint up it's one row.
 */
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-3">
      <Link href="/" className="text-xl font-extrabold tracking-wide">
        Loop<span className="text-accent">Lab</span>
      </Link>
      <nav aria-label="Main" className="order-last -mx-3 flex w-full gap-1 text-sm sm:order-none sm:mx-0 sm:w-auto sm:flex-1">
        <Link href="/" className="rounded-lg px-3 py-2 text-muted hover:text-text">
          Editor
        </Link>
        <Link href="/me" className="rounded-lg px-3 py-2 text-muted hover:text-text">
          My Beats
        </Link>
        <Link href="/gallery" className="rounded-lg px-3 py-2 text-muted hover:text-text">
          Gallery
        </Link>
      </nav>
      {/* Reads the session cookie, so with Cache Components it must stream in behind a boundary. */}
      <Suspense fallback={<span className="h-8" aria-hidden />}>
        <UserMenu />
      </Suspense>
    </header>
  );
}
