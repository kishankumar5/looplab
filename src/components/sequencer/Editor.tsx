"use client";

import { SaveBar } from "@/components/beats/SaveBar";
import { ShareButton } from "@/components/beats/ShareButton";
import { VisibilityToggle } from "@/components/beats/VisibilityToggle";
import { usePlayback } from "@/hooks/usePlayback";
import { useSequencer } from "@/hooks/useSequencer";
import { useSpaceShortcut } from "@/hooks/useSpaceShortcut";
import { useUndoShortcuts } from "@/hooks/useUndoShortcuts";
import { useState } from "react";
import type { BeatPattern } from "@/lib/validation/beat";
import { LofiPanel } from "./LofiPanel";
import { StepGrid } from "./StepGrid";
import { Transport } from "./Transport";

export interface EditorProps {
  /** The saved beat's id, or null for a new beat (SaveBar keeps the id once the first save creates it). */
  beatId: string | null;
  /** The saved title, else the draft's, else "" (the field then shows "Untitled beat"). */
  initialTitle: string;
  /** The beat to start from: the first state of a fresh undo history. Default: an empty beat. */
  initialPattern?: BeatPattern;
  signedIn: boolean;
  /** Whether the saved beat is public (anyone with its /b/{id} link can listen). Default: private. */
  initialIsPublic?: boolean;
  /** Called once, when the first save creates the beat, before the address changes to /beats/{id}. */
  onCreated?: (id: string) => void;
}

/**
 * The beat editor (mockup Editor screen). Every edit goes through useSequencer, which keeps the
 * undo/redo history; usePlayback makes the audio follow the result. Saving (SaveBar) reads the
 * pattern but never changes it, so it adds nothing to the history. Visibility is saved on its own
 * (VisibilityToggle), so it isn't part of the history either.
 */
export function Editor(props: EditorProps) {
  const { beatId, initialTitle, initialPattern, signedIn, initialIsPublic = false, onCreated } = props;
  const sequencer = useSequencer(initialPattern);
  const { pattern } = sequencer;
  const playback = usePlayback(pattern);
  useSpaceShortcut(playback.toggle);
  useUndoShortcuts(sequencer.undo, sequencer.redo);
  // The id is known once the beat is saved, which for a new beat happens while the editor is open.
  const [savedId, setSavedId] = useState(beatId);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const created = (id: string) => {
    setSavedId(id);
    onCreated?.(id);
  };
  return (
    <>
      {/* The title bar: the beat's name (editable), its tempo, who can see it, and Save. */}
      <div className="mb-3.5">
        <SaveBar beatId={beatId} initialTitle={initialTitle} pattern={pattern} signedIn={signedIn} onCreated={created}>
          <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{pattern.bpm} BPM</span>
          {savedId && <VisibilityToggle beatId={savedId} isPublic={isPublic} onChange={setIsPublic} />}
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
      >
        <ShareButton beatId={savedId} isPublic={isPublic} />
      </Transport>
      <StepGrid
        pattern={pattern}
        playheadStep={playback.currentStep}
        onToggleStep={(track, step) => sequencer.edit({ type: "toggleStep", track, step })}
        onVolumeChange={(track, volume) => sequencer.preview({ type: "setVolume", track, volume })}
        onVolumeCommit={sequencer.commit}
        onToggleMute={(track) => sequencer.edit({ type: "toggleMute", track })}
      />
      <LofiPanel
        effects={pattern.effects}
        controls={{
          onChange: (effect, value) => sequencer.preview({ type: "setEffect", effect, value }),
          onCommit: sequencer.commit,
        }}
      />
    </>
  );
}
