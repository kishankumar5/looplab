import { useCallback, useEffect, useRef, useState } from "react";
import * as engine from "@/lib/audio/engine";
import type { BeatPattern } from "@/lib/validation/beat";

export interface Playback {
  playing: boolean;
  /** 0-based step under the playhead, or null when stopped. */
  currentStep: number | null;
  play: () => Promise<void>;
  stop: () => void;
  toggle: () => void;
}

/**
 * Connects the editor's pattern to the audio engine (one way: state to audio) and reports the
 * step being heard for the playhead. Nothing touches audio until play() runs from a click.
 */
export function usePlayback(pattern: BeatPattern): Playback {
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  // Refs, so play/stop/toggle stay stable and always see the latest values.
  const playingRef = useRef(false);
  const patternRef = useRef(pattern);

  // Every edit while playing goes straight to the engine, which hears it on the next pass.
  useEffect(() => {
    patternRef.current = pattern;
    if (playingRef.current) engine.update(pattern);
  }, [pattern]);

  // Leaving the editor stops the sound.
  useEffect(() => () => engine.stop(), []);

  const stop = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    setCurrentStep(null);
    engine.stop();
  }, []);

  const play = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    try {
      await engine.start(patternRef.current, setCurrentStep);
    } catch (error) {
      console.error("Couldn't start audio", error);
      stop();
    }
  }, [stop]);

  const toggle = useCallback(() => {
    if (playingRef.current) stop();
    else void play();
  }, [play, stop]);

  return { playing, currentStep, play, stop, toggle };
}
