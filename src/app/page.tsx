import type { Metadata } from "next";
import { Editor } from "@/components/sequencer/Editor";

export const metadata: Metadata = { title: "New beat · LoopLab" };

/** Editor for a new, unsaved beat (PRD US-2). */
export default function NewBeatPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <Editor />
    </main>
  );
}
