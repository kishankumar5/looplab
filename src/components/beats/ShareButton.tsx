"use client";

export interface ShareButtonProps {
  /** null until the beat has been saved. */
  beatId: string | null;
  isPublic: boolean;
}

/**
 * "Copy share link" (mockup transport bar, PRD US-5): copies the beat's /b/{id} link and confirms
 * with a "Link copied" toast. Only a public beat can be shared; otherwise it says why it can't.
 */
export function ShareButton(props: ShareButtonProps): React.JSX.Element {
  void props;
  throw new Error("not implemented");
}
