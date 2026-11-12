"use client";

import { SaveBar } from "@/components/beats/SaveBar";
import { usePlayback } from "@/hooks/usePlayback";
import { useSequencer } from "@/hooks/useSequencer";
import { useSpaceShortcut } from "@/hooks/useSpaceShortcut";
import { useUndoShortcuts } from "@/hooks/useUndoShortcuts";
import type { BeatPattern } from "@/lib/validation/beat";
import { StepGrid } from "./StepGrid";
import { Transport } from "./Transport";

export interface EditorProps {
  /** null until the beat has been saved once. */
  beatId: string | null;
  /** The saved title, else the draft's, else "" (the field then shows "Untitled beat"). */
  initialTitle: string;
  /** The beat to start from: the first state of a fresh undo history. Default: an empty beat. */
  initialPattern?: BeatPattern;
  signedIn: boolean;
}

/**
 * The beat editor (mockup Editor screen). Every edit goes through useSequencer, which keeps the
 * undo/redo history; usePlayback makes the audio follow the result. Saving (SaveBar) reads the
 * pattern but never changes it, so it adds nothing to the history.
 */
export function Editor({ beatId, initialTitle, initialPattern, signedIn }: EditorProps) {
  const sequencer = useSequencer(initialPattern);
  const { pattern } = sequencer;
  const playback = usePlayback(pattern);
  useSpaceShortcut(playback.toggle);
  useUndoShortcuts(sequencer.undo, sequencer.redo);
  return (
    <>
      {/* The title bar: the beat's name (editable), its tempo, and Save. */}
      <div className="mb-3.5">
        <SaveBar beatId={beatId} initialTitle={initialTitle} pattern={pattern} signedIn={signedIn}>
          <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{pattern.bpm} BPM</span>
        </SaveBar>
      </div>
      <Transport
        playing={playback.playing}
        onTogglePlay={playback.toggle}
        bpm={pattern.bpm}
        onTempoChange={(bpm) => sequencer.preview({ type: "setTempo", bpm })}
        onTempoCommit={sequencer.commit}
        canUndo={sequencer.canUndo}
        canRedo={sequencer.canRedo}
        onUndo={sequencer.undo}
        onRedo={sequencer.redo}
        onClear={() => sequencer.edit({ type: "clear" })}
      />
      <StepGrid
        pattern={pattern}
        playheadStep={playback.currentStep}
        onToggleStep={(track, step) => sequencer.edit({ type: "toggleStep", track, step })}
      />
    </>
  );
}
