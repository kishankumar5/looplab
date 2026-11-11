import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "./UserMenu";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 border-b border-line px-4 py-3">
      <Link href="/" className="text-xl font-extrabold tracking-wide">
        Loop<span className="text-accent">Lab</span>
      </Link>
      {/* Reads the session cookie, so with Cache Components it must stream in behind a boundary. */}
      <Suspense fallback={<span className="h-8" aria-hidden />}>
        <UserMenu />
      </Suspense>
    </header>
  );
}
