export interface ToastProps {
  /** The message to show, or null for none (see useToast). */
  message: string | null;
}

/**
 * A bottom-centre confirmation such as "Link copied" (mockup toast). The status region stays in
 * the page while empty, so screen readers announce each message when it appears.
 */
export function Toast({ message }: ToastProps) {
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-4">
      {message && <p className="rounded-lg bg-accent-2 px-4 py-2.5 font-bold text-on-accent-2 shadow-lg">{message}</p>}
    </div>
  );
}
