import Link from "next/link";
import type { GalleryBeat } from "@/lib/db/beats";
import { previewRows } from "@/lib/gallery/preview";
import { PreviewButton } from "@/components/gallery/GalleryPreview";
import { LikeButton } from "./LikeButton";

/** Gallery card (mockup Gallery screen): mini pattern, title, creator, preview play, likes, Open. */
export function BeatCard({ beat, signedIn }: { beat: GalleryBeat; signedIn: boolean }) {
  return (
    <article className="flex flex-col gap-2.5 rounded-[10px] bg-panel p-3.5">
      <div className="grid grid-cols-16 gap-0.5" aria-hidden>
        {previewRows(beat.pattern).flatMap((row, r) =>
          row.map((on, c) => (
            <i key={`${r}-${c}`} className={`aspect-square rounded-[2px] ${on ? "bg-accent" : "bg-panel-2"}`} />
          )),
        )}
      </div>
      <h2 className="font-bold">{beat.title}</h2>
      <p className="text-sm text-muted">by {beat.creator.displayName}</p>
      <div className="flex items-center gap-2">
        <PreviewButton beatId={beat.id} title={beat.title} pattern={beat.pattern} />
        <LikeButton beatId={beat.id} initialLiked={beat.likedByMe} initialCount={beat.likeCount} signedIn={signedIn} />
        <span className="flex-1" />
        <Link href={`/b/${beat.id}`} className="rounded-lg px-3 py-1.5 text-sm text-accent-2 hover:underline">
          Open
        </Link>
      </div>
    </article>
  );
}
