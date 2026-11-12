"use client";

import { useDraft } from "@/hooks/useDraft";
import { Editor } from "./Editor";

export interface NewBeatEditorProps {
  signedIn: boolean;
}

/** The editor for a new beat at "/": starts from the unsaved draft kept across sign-in, if any. */
export function NewBeatEditor({ signedIn }: NewBeatEditorProps) {
  const draft = useDraft();
  // A new key when the draft turns up remounts the editor, so the draft is the start of a fresh history.
  return (
    <Editor
      key={draft ? "draft" : "empty"}
      beatId={null}
      initialTitle={draft?.title ?? ""}
      initialPattern={draft?.pattern}
      signedIn={signedIn}
    />
  );
}
