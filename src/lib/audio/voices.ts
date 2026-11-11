import type * as Tone from "tone";
import type { TrackId } from "@/lib/validation/beat";

/** Plays one row's sound at an exact time on the audio clock (seconds). */
export type Voice = (time: number) => void;
export type Voices = Record<TrackId, Voice>;

type ToneModule = typeof Tone;

/**
 * Builds one synthesized instrument per row, all routed into `output`.
 * Each row plays one fixed sound (PRD: no melody editing), and LoopLab ships no audio files.
 * The sounds are soft and warm on purpose: rounded waveforms, short decays, quiet hats.
 */
export function createVoices(tone: ToneModule, output: Tone.InputNode): Voices {
  return {
    kick: kick(tone, output),
    snare: snare(tone, output),
    hihat: hihat(tone, output),
    bass: bass(tone, output),
    synth: keys(tone, output),
  };
}

function kick(tone: ToneModule, output: Tone.InputNode): Voice {
  const drum = new tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.1 },
    volume: -2,
  }).connect(output);
  return (time) => drum.triggerAttackRelease("C1", "8n", time);
}

/** Pink noise with the low end cut: a soft, brushed snare. */
function snare(tone: ToneModule, output: Tone.InputNode): Voice {
  const noise = new tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    volume: -10,
  }).chain(new tone.Filter(1200, "highpass"), output);
  return (time) => noise.triggerAttackRelease("16n", time);
}

function hihat(tone: ToneModule, output: Tone.InputNode): Voice {
  const metal = new tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
    volume: -26,
  }).connect(output);
  return (time) => metal.triggerAttackRelease(300, "32n", time);
}

function bass(tone: ToneModule, output: Tone.InputNode): Voice {
  const synth = new tone.MonoSynth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 150, octaves: 2 },
    volume: -6,
  }).connect(output);
  return (time) => synth.triggerAttackRelease("C2", "8n", time);
}

/** E-G-B-D over the C bass: a Cmaj9 colour, the classic lo-fi chord. */
const CHORD = ["E3", "G3", "B3", "D4"];

function keys(tone: ToneModule, output: Tone.InputNode): Voice {
  const poly = new tone.PolySynth({
    voice: tone.Synth,
    // Room for a 1s release on every 16th at 140 BPM without dropping notes.
    maxPolyphony: 64,
    options: { oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.5, sustain: 0.2, release: 1 } },
    volume: -16,
  }).connect(output);
  return (time) => poly.triggerAttackRelease(CHORD, "8n", time);
}
