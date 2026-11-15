"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as engine from "@/lib/audio/engine";
import { beatPatternSchema, type BeatPattern } from "@/lib/validation/beat";

interface Preview {
  /** The card playing now, or null. */
  playingId: string | null;
  toggle: (beatId: string, pattern: BeatPattern) => void;
}

const PreviewContext = createContext<Preview | null>(null);

/**
 * One beat playing at a time across the gallery (PRD US-6: each card previews in place). It talks
 * to the audio engine directly: the engine is one per page, so a second card's Play hands it the
 * new beat instead of starting again. Audio only starts from a click (browsers require it).
 */
export function GalleryPreviewProvider({ children }: { children: ReactNode }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playingRef = useRef<string | null>(null);

  const play = useCallback((id: string | null) => {
    playingRef.current = id;
    setPlayingId(id);
  }, []);

  const toggle = useCallback(
    (beatId: string, pattern: BeatPattern) => {
      if (playingRef.current === beatId) {
        engine.stop();
        play(null);
        return;
      }
      if (playingRef.current) {
        engine.update(pattern);
        play(beatId);
        return;
      }
      play(beatId);
      engine.start(pattern, () => {}).catch((error: unknown) => {
        console.error("Couldn't start audio", error);
        if (playingRef.current === beatId) play(null);
      });
    },
    [play],
  );

  // Leaving the gallery stops the sound.
  useEffect(() => () => engine.stop(), []);

  const value = useMemo(() => ({ playingId, toggle }), [playingId, toggle]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export interface PreviewButtonProps {
  beatId: string;
  title: string;
  /** The saved pattern as stored (unvalidated JSON). */
  pattern: unknown;
}

/** A card's small Play/Stop button. Disabled if the saved pattern doesn't match the beat format. */
export function PreviewButton({ beatId, title, pattern }: PreviewButtonProps) {
  const preview = useContext(PreviewContext);
  const parsed = useMemo(() => beatPatternSchema.safeParse(pattern), [pattern]);
  const playing = preview?.playingId === beatId;
  return (
    <button
      type="button"
      aria-label={`${playing ? "Stop" : "Play"} ${title}`}
      disabled={!preview || !parsed.success}
      onClick={() => parsed.success && preview?.toggle(beatId, parsed.data)}
      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-xs font-black text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden className={playing ? "" : "translate-x-px"}>
        {playing ? "■" : "▶"}
      </span>
    </button>
  );
}
