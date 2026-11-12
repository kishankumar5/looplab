"use client";

export interface VisibilityToggleProps {
  beatId: string;
  /** The beat's current visibility; the page holds it. */
  isPublic: boolean;
  /** Called with the new visibility once the server has saved it. */
  onChange: (isPublic: boolean) => void;
}

/**
 * Private/Public pill plus "Make public" / "Make private" (mockup title bar, PRD US-4). Saves the
 * change right away with PATCH /api/beats/{id}. Owner only: render it for a saved beat you own.
 */
export function VisibilityToggle(props: VisibilityToggleProps): React.JSX.Element {
  void props;
  throw new Error("not implemented");
}
