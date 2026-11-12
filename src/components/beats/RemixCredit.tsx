import Link from "next/link";
import type { RemixOriginal } from "@/lib/db/beats";

export interface RemixCreditProps {
  isRemix: boolean;
  remixedFrom: RemixOriginal | null;
}

/** "Remixed from {title} by {creator}" (PRD US-6), or a note that the original is gone. */
export function RemixCredit({ isRemix, remixedFrom }: RemixCreditProps) {
  if (!isRemix) return null;
  if (!remixedFrom) return <p className="text-sm text-muted">Remixed from a beat that is no longer available</p>;
  return (
    <p className="text-sm text-muted">
      Remixed from{" "}
      <Link href={`/b/${remixedFrom.id}`} className="text-accent-2 hover:underline">
        {remixedFrom.title}
      </Link>{" "}
      by {remixedFrom.creator.displayName}
    </p>
  );
}
