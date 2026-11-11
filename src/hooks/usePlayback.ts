import type { BeatPattern } from "@/lib/validation/beat";

export interface Playback {
  playing: boolean;
  /** 0-based step under the playhead, or null when stopped. */
  currentStep: number | null;
  play: () => Promise<void>;
  stop: () => void;
  toggle: () => void;
}

/** Connects the editor's pattern to the audio engine (one way: state to audio). */
export function usePlayback(pattern: BeatPattern): Playback {
  void pattern;
  throw new Error("not implemented");
}
