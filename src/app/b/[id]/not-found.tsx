import Link from "next/link";

/**
 * The 404 page for /b/{id} (PRD US-5): the same page for an id that doesn't exist and for a private
 * beat that isn't yours, so a share link never shows that a private beat exists.
 */
export default function BeatNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <div className="mx-auto mt-8 flex max-w-[460px] flex-col items-center gap-3 rounded-[10px] bg-panel px-6 py-8 text-center">
        <h1 className="text-[22px] font-bold">This beat is private or doesn&apos;t exist</h1>
        <p className="text-sm text-muted">The link may be wrong, or the beat&apos;s owner hasn&apos;t made it public.</p>
        <Link
          href="/gallery"
          className="mt-2 rounded-lg bg-accent px-4 py-2 font-bold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
        >
          Browse the gallery
        </Link>
      </div>
    </main>
  );
}
