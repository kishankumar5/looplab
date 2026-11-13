import type * as Tone from "tone";
import { STEPS_PER_BAR, TRACK_IDS, defaultPattern, type BeatPattern } from "@/lib/validation/beat";
import { createVoices, type Voices } from "./voices";

/** Called with the 0-based step being heard, in time with the sound, while the loop plays. */
export type StepListener = (step: number) => void;

/** Built on the first Play and kept for the life of the page: one long-lived engine. */
interface Rig {
  tone: typeof Tone;
  voices: Voices;
}

/** Headroom so every row hitting at once doesn't clip. */
const MASTER_DB = -4;

let rig: Rig | null = null;
let pattern: BeatPattern = defaultPattern();
let listener: StepListener = () => {};
let playing = false;
/** Bumped by every start and stop, so a start still unlocking audio can't outlive a later stop. */
let session = 0;
let nextStep = 0;

/** Unlocks audio (call it from a click), then loops `next` from step 1. */
export async function start(next: BeatPattern, onStep: StepListener): Promise<void> {
  pattern = next;
  listener = onStep;
  if (playing) return;
  playing = true;
  const id = ++session;
  try {
    const { tone } = await loadRig();
    if (id !== session) return;
    nextStep = 0;
    tone.getTransport().bpm.value = pattern.bpm;
    tone.getTransport().start();
  } catch (error) {
    if (id !== session) return; // a later start or stop has taken over
    playing = false;
    throw error;
  }
}

/** Hands the engine the latest pattern and tempo; a playing loop picks them up without restarting. */
export function update(next: BeatPattern): void {
  pattern = next;
  if (rig) rig.tone.getTransport().bpm.value = next.bpm;
}

/** Stops the loop and the playhead. */
export function stop(): void {
  session++;
  playing = false;
  if (!rig) return;
  rig.tone.getTransport().stop();
  rig.tone.getDraw().cancel(0);
}

/**
 * Tone.js is imported here rather than at the top of the file: importing it creates an
 * AudioContext, and browsers only let audio start after the user clicks.
 */
async function loadRig(): Promise<Rig> {
  const tone = await import("tone");
  await tone.start();
  rig ??= buildRig(tone);
  return rig;
}

function buildRig(tone: typeof Tone): Rig {
  // TODO(#7): muffle and vinyl crackle go between the instruments and this master volume.
  const master = new tone.Volume(MASTER_DB).toDestination();
  const transport = tone.getTransport();
  transport.cancel(0); // drop a schedule left behind by a hot-reloaded copy of this module
  transport.scheduleRepeat(tick, "16n");
  return { tone, voices: createVoices(tone, master) };
}

/**
 * Tone calls this every 16th note, slightly ahead of time; `time` is when the step should sound.
 * It reads the pattern fresh each time, so edits made while playing are heard on the next pass.
 */
function tick(time: number): void {
  if (!rig) return;
  const step = nextStep;
  nextStep = (step + 1) % STEPS_PER_BAR;
  // TODO(#11): per-row volume and mute.
  for (const track of TRACK_IDS) {
    if (pattern.tracks[track].steps[step]) rig.voices[track](time);
  }
  // Move the playhead when the step is heard, not when it is scheduled.
  rig.tone.getDraw().schedule(() => {
    if (playing) listener(step);
  }, time);
}
