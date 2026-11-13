"use client";

import { useReducer } from "react";
import { sequencerReducer } from "@/lib/sequencer/reducer";
import { defaultPattern } from "@/lib/validation/beat";
import { StepGrid } from "./StepGrid";
import { Transport } from "./Transport";

/** The beat editor (mockup Editor screen). Every edit goes through sequencerReducer. */
export function Editor() {
  const [pattern, dispatch] = useReducer(sequencerReducer, null, defaultPattern);
  return (
    <>
      <Transport onClear={() => dispatch({ type: "clear" })} />
      <StepGrid pattern={pattern} onToggleStep={(track, step) => dispatch({ type: "toggleStep", track, step })} />
    </>
  );
}
