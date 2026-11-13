"use client";

import Link from "next/link";
import { PlayButton } from "@/components/sequencer/PlayButton";
import { StepGrid } from "@/components/sequencer/StepGrid";
import { usePlayback } from "@/hooks/usePlayback";
import { useSpaceShortcut } from "@/hooks/useSpaceShortcut";
import type { BeatPattern } from "@/lib/validation/beat";

export interface ListenOnlyBeatProps {
  id: string;
  title: string;
  /** The creator's display name. */
  creator: string;
  pattern: BeatPattern;
  /** The viewer owns the beat: show an Edit link back to the editor. */
  isOwner: boolean;
  isPublic: boolean;
}

/**
 * The listen-only beat at /b/{id} (mockup Shared link screen, PRD US-5): title, creator, tempo,
 * Play/Stop, and the grid, read-only. No editing controls. Playback uses the same engine as the
 * editor, with the saved pattern as it is.
 */
export function ListenOnlyBeat({ id, title, creator, pattern, isOwner, isPublic }: ListenOnlyBeatProps) {
  const playback = usePlayback(pattern);
  useSpaceShortcut(playback.toggle);
  return (
    <>
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h1 className="min-w-0 flex-1 text-[22px] font-bold">{title}</h1>
        <p className="text-sm text-muted">
          by <b className="text-text">{creator}</b> · {pattern.bpm} BPM
          {pattern.swing > 0 && ` · swing ${pattern.swing}%`}
        </p>
      </div>
      {isOwner && !isPublic && (
        <p className="mb-3.5 rounded-r-lg border-l-3 border-accent-2 bg-panel px-2.5 py-1.5 text-[13px] text-muted">
          Only you can see this page while the beat is private. Make it public in the editor to share it.
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-4 rounded-[10px] bg-panel px-3.5 py-3">
        <PlayButton playing={playback.playing} onToggle={playback.toggle} />
        <span className="flex-1" />
        {isOwner && (
          <Link
            href={`/beats/${id}`}
            className="rounded-lg border border-line px-3.5 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
          >
            Edit
          </Link>
        )}
      </div>
      <StepGrid pattern={pattern} playheadStep={playback.currentStep} />
    </>
  );
}
