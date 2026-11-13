"use client";

import { useReducer } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import { useSpaceShortcut } from "@/hooks/useSpaceShortcut";
import { sequencerReducer } from "@/lib/sequencer/reducer";
import { defaultPattern } from "@/lib/validation/beat";
import { StepGrid } from "./StepGrid";
import { TitleBar } from "./TitleBar";
import { Transport } from "./Transport";

/**
 * The beat editor (mockup Editor screen). Every edit goes through sequencerReducer;
 * usePlayback makes the audio follow the result.
 */
export function Editor() {
  const [pattern, dispatch] = useReducer(sequencerReducer, null, defaultPattern);
  const playback = usePlayback(pattern);
  useSpaceShortcut(playback.toggle);
  return (
    <>
      <TitleBar title="Untitled beat" bpm={pattern.bpm} />
      <Transport
        playing={playback.playing}
        onTogglePlay={playback.toggle}
        bpm={pattern.bpm}
        onTempoChange={(bpm) => dispatch({ type: "setTempo", bpm })}
        onClear={() => dispatch({ type: "clear" })}
      />
      <StepGrid
        pattern={pattern}
        playheadStep={playback.currentStep}
        onToggleStep={(track, step) => dispatch({ type: "toggleStep", track, step })}
      />
    </>
  );
}
