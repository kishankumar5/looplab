import type { RemixOriginal } from "@/lib/db/beats";

export interface RemixCreditProps {
  isRemix: boolean;
  remixedFrom: RemixOriginal | null;
}

/** "Remixed from {title} by {creator}" (PRD US-6), or a note that the original is gone. */
export function RemixCredit(_props: RemixCreditProps): React.ReactNode {
  throw new Error("not implemented");
}
