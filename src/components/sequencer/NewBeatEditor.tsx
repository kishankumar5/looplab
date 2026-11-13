"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDraft } from "@/hooks/useDraft";
import { Editor } from "./Editor";

export interface NewBeatEditorProps {
  signedIn: boolean;
}

const isBeatAddress = (path: string) => path.startsWith("/beats/");

/**
 * The editor for a new beat at "/": starts from the unsaved draft kept across sign-in, if any.
 * The first save only changes the address to /beats/{id} (see SaveBar), so this "/" page stays on
 * screen there, and Next keeps it alive for Back. So:
 * - a link back to "/" after saving starts a new beat (unsaved work is kept, as on any page)
 * - Back onto a /beats/{id} address this editor isn't showing loads that beat's own page
 */
export function NewBeatEditor({ signedIn }: NewBeatEditorProps) {
  const newBeats = useNewBeatCount();
  return <NewBeat key={newBeats} signedIn={signedIn} />;
}

/** Goes up each time a link leads back to "/" after the beat here got its own address. */
function useNewBeatCount(): number {
  const pathname = usePathname();
  const [seen, setSeen] = useState({ pathname, count: 0, saved: isBeatAddress(pathname) });
  if (pathname !== seen.pathname) {
    const startOver = pathname === "/" && seen.saved;
    setSeen({
      pathname,
      count: startOver ? seen.count + 1 : seen.count,
      saved: !startOver && (seen.saved || isBeatAddress(pathname)),
    });
  }
  return seen.count;
}

function NewBeat({ signedIn }: NewBeatEditorProps) {
  const draft = useDraft();
  const pathname = usePathname();
  const router = useRouter();
  // The /beats/{id} address this editor's first save moved to.
  const ownAddress = useRef<string | null>(null);

  useEffect(() => {
    // Saved, started a new beat, then pressed Back: the old address, but not its beat.
    if (isBeatAddress(pathname) && pathname !== ownAddress.current) router.refresh();
  }, [pathname, router]);

  // A new key when the draft turns up remounts the editor, so the draft is the start of a fresh history.
  return (
    <Editor
      key={draft ? "draft" : "empty"}
      beatId={null}
      initialTitle={draft?.title ?? ""}
      initialPattern={draft?.pattern}
      signedIn={signedIn}
      onCreated={(id) => {
        ownAddress.current = `/beats/${id}`;
      }}
    />
  );
}
