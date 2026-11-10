"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface LikeButtonProps {
  beatId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}

/** Heart + count. Signed-out users are sent to sign in (PRD US-6). */
export function LikeButton({ beatId, initialLiked, initialCount, signedIn }: LikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState({ liked: initialLiked, likeCount: initialCount });
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setPending(true);
    const res = await fetch(`/api/beats/${beatId}/like`, { method: state.liked ? "DELETE" : "POST" });
    if (res.ok) setState(await res.json());
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.liked}
      aria-label={`${state.liked ? "Unlike" : "Like"} (${state.likeCount} likes)`}
      className={`rounded-lg border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 ${
        state.liked ? "border-accent text-accent" : "border-line"
      }`}
    >
      ♥ {state.likeCount}
    </button>
  );
}
