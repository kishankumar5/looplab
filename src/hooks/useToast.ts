import { useCallback, useEffect, useState } from "react";

/** How long a toast stays up (mockup: about 1.5 seconds). */
export const TOAST_MS = 1500;

/**
 * A short message for <Toast>: show() puts it up, and it clears itself after TOAST_MS. Showing it
 * again restarts the clock. Returns [message or null, show].
 */
export function useToast(): [string | null, (message: string) => void] {
  // The count makes each show() a new state, so the same message twice still restarts the clock.
  const [toast, setToast] = useState<{ message: string; count: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const show = useCallback((message: string) => setToast((last) => ({ message, count: (last?.count ?? 0) + 1 })), []);
  return [toast?.message ?? null, show];
}
