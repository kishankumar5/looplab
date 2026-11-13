import type * as Tone from "tone";
import { STEPS_PER_BAR, TRACK_IDS, defaultPattern, type BeatPattern, type TrackId } from "@/lib/validation/beat";
import { compressorMakeupDb, swingDelaySeconds, trackGain } from "./mix";
import { createVoices, type Voices } from "./voices";

/** Called with the 0-based step being heard, in time with the sound, while the loop plays. */
export type StepListener = (step: number) => void;

/** Built on the first Play and kept for the life of the page: one long-lived engine. */
interface Rig {
  tone: typeof Tone;
  voices: Voices;
  /** One per row, between its instrument and the master: where volume and mute apply (PRD US-3). */
  channels: Record<TrackId, Tone.Gain>;
}

/**
 * How loud a row at the default volume (80) plays: -4 dB, the level every row had before per-row
 * volume, which leaves headroom for every row hitting at once.
 */
const DEFAULT_ROW_DB = -4;
/**
 * The master's level, so that the default row's channel (trackGain 0.64, about -3.9 dB) plus the
 * master comes out at DEFAULT_ROW_DB. That puts the master at about -0.1 dB. Rows turned up past 80
 * can push the mix over full scale; the limiter after the master stops it clipping.
 */
const MASTER_DB = DEFAULT_ROW_DB - 20 * Math.log10(trackGain(defaultPattern().tracks.kick));

/**
 * A limiter on the master output: a compressor at 20:1 with a hard knee (Tone.Limiter keeps a 30 dB
 * soft knee, which barely limits near full scale), just under 0 dBFS. It reacts at once and holds
 * for 250 ms, so the gain is still down when the next 16th note lands. Measured in Chromium, the
 * loudest beat the grid allows (every row on every step, all at 100) then peaks at about -0.5 dBFS
 * instead of +2.9, at 82 and 140 BPM. At the default volumes the same beat only just reaches the
 * threshold, and anything quieter passes through untouched.
 */
const LIMITER = { threshold: -1, ratio: 20, knee: 0, attack: 0, release: 0.25 };
/** Takes off the make-up gain the browser's compressor adds to everything, so the level stays put. */
const LIMITER_TRIM = 10 ** (-compressorMakeupDb(LIMITER.threshold, LIMITER.ratio) / 20);
/** How quickly a channel reaches a new volume: fast, but a ramp, so the change doesn't click. */
const LEVEL_RAMP_SECONDS = 0.02;

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
    const loaded = await loadRig();
    if (id !== session) return;
    const { tone } = loaded;
    setLevels(loaded, pattern);
    nextStep = 0;
    tone.getTransport().bpm.value = pattern.bpm;
    tone.getTransport().start();
  } catch (error) {
    if (id !== session) return; // a later start or stop has taken over
    playing = false;
    throw error;
  }
}

/**
 * Hands the engine the latest pattern: tempo, volume, and mute change at once, and steps from the
 * next pass, all without restarting the loop.
 */
export function update(next: BeatPattern): void {
  pattern = next;
  if (!rig) return;
  rig.tone.getTransport().bpm.value = next.bpm;
  setLevels(rig, next);
}

/** Each row's channel follows its volume and mute; a muted row is silent, ringing notes included. */
function setLevels({ channels }: Rig, beat: BeatPattern): void {
  for (const track of TRACK_IDS) channels[track].gain.rampTo(trackGain(beat.tracks[track]), LEVEL_RAMP_SECONDS);
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
  // Row channels -> master -> limiter -> make-up trim -> speakers.
  // TODO(#7): muffle and vinyl crackle go between the row channels and the master.
  const output = new tone.Gain(LIMITER_TRIM).toDestination();
  const limiter = new tone.Compressor(LIMITER).connect(output);
  const master = new tone.Volume(MASTER_DB).connect(limiter);
  const channels = Object.fromEntries(
    TRACK_IDS.map((track) => [track, new tone.Gain(trackGain(pattern.tracks[track])).connect(master)]),
  ) as Record<TrackId, Tone.Gain>;
  const transport = tone.getTransport();
  transport.cancel(0); // drop a schedule left behind by a hot-reloaded copy of this module
  transport.scheduleRepeat(tick, "16n");
  return { tone, voices: createVoices(tone, channels), channels };
}

/**
 * Tone calls this every 16th note, slightly ahead of time; `time` is when the step should sound.
 * It reads the pattern fresh each time, so edits made while playing are heard on the next pass.
 */
function tick(time: number): void {
  if (!rig) return;
  const step = nextStep;
  nextStep = (step + 1) % STEPS_PER_BAR;
  // Swing (PRD US-3) pushes every second 16th a little late; the playhead moves with the sound.
  const at = time + swingDelaySeconds(step, pattern.swing, pattern.bpm);
  // Muted rows still trigger; their channel is silent (see setLevels).
  for (const track of TRACK_IDS) {
    if (pattern.tracks[track].steps[step]) rig.voices[track](at);
  }
  // Move the playhead when the step is heard, not when it is scheduled.
  rig.tone.getDraw().schedule(() => {
    if (playing) listener(step);
  }, at);
}
