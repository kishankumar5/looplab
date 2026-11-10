import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BeatCard } from "@/components/beats/BeatCard";
import { getCurrentUserId } from "@/lib/auth";
import { listPublicBeats } from "@/lib/db/beats";
import { galleryQuerySchema, type GalleryQuery } from "@/lib/validation/gallery";

export const metadata: Metadata = { title: "Gallery · LoopLab" };

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "likes", label: "Most liked" },
] as const;

/** Public gallery (PRD US-6). The list depends on the request (sort, page, viewer), so it streams in. */
export default function GalleryPage({ searchParams }: PageProps<"/gallery">) {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Gallery</h1>
      <Suspense fallback={<p className="text-muted">Loading beats…</p>}>
        <GalleryResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function GalleryResults({ searchParams }: { searchParams: PageProps<"/gallery">["searchParams"] }) {
  await connection();
  const parsed = galleryQuerySchema.safeParse(await searchParams);
  const query: GalleryQuery = parsed.success ? parsed.data : { sort: "new", page: 1 };
  const viewerId = await getCurrentUserId();
  const { beats, page, totalPages } = await listPublicBeats(query, viewerId);
  const href = (q: Partial<GalleryQuery>) => `/gallery?sort=${q.sort ?? query.sort}&page=${q.page ?? 1}`;

  return (
    <>
      <nav aria-label="Sort beats" className="mb-4 flex gap-1.5">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={href({ sort: s.value })}
            aria-current={query.sort === s.value ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              query.sort === s.value ? "border-accent text-accent" : "border-line"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {beats.length === 0 ? (
        <p className="text-muted">No public beats yet. Make one and share it!</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
          {beats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} signedIn={viewerId !== null} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-3 text-sm">
          {page > 1 && <Link href={href({ page: page - 1 })}>← Newer</Link>}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && <Link href={href({ page: page + 1 })}>Older →</Link>}
        </nav>
      )}
    </>
  );
}
