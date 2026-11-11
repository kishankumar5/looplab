import type * as Tone from "tone";
import { beforeEach, describe, expect, it } from "vitest";
import { TRACK_IDS } from "@/lib/validation/beat";
import { createVoices } from "./voices";

/** Stands in for any Tone node or instrument and records what it was asked to do. */
class FakeNode {
  static created: FakeNode[] = [];
  outputs: FakeNode[] = [];
  triggers: unknown[][] = [];
  constructor() {
    FakeNode.created.push(this);
  }
  connect(node: FakeNode) {
    this.outputs.push(node);
    return this;
  }
  /** this -> nodes[0] -> nodes[1] -> ... */
  chain(...nodes: FakeNode[]) {
    [this, ...nodes].slice(0, -1).forEach((from, i) => from.connect(nodes[i]));
    return this;
  }
  triggerAttackRelease(...args: unknown[]) {
    this.triggers.push(args);
    return this;
  }
}

// Every Tone class the voices ask for (MembraneSynth, NoiseSynth, Filter, ...) becomes a FakeNode,
// so these tests don't care which synth makes which sound.
const fakeTone = new Proxy({}, { get: () => FakeNode }) as unknown as typeof Tone;

function build() {
  const output = new FakeNode();
  const voices = createVoices(fakeTone, output as unknown as Tone.InputNode);
  return { output, voices };
}

/** Plays one row and returns the instruments that were triggered. */
function play(voice: (time: number) => void, time: number) {
  for (const node of FakeNode.created) node.triggers = [];
  voice(time);
  return FakeNode.created.filter((node) => node.triggers.length > 0);
}

function reaches(from: FakeNode, target: FakeNode): boolean {
  return from === target || from.outputs.some((next) => reaches(next, target));
}

beforeEach(() => {
  FakeNode.created = [];
});

describe("createVoices", () => {
  it("gives every row its own instrument", () => {
    const { voices } = build();
    const instruments = TRACK_IDS.map((track) => play(voices[track], 1));
    for (const triggered of instruments) expect(triggered).toHaveLength(1);
    expect(new Set(instruments.flat()).size).toBe(TRACK_IDS.length);
  });

  it("plays each row once, at the exact audio time it is given", () => {
    const { voices } = build();
    for (const track of TRACK_IDS) {
      const [instrument] = play(voices[track], 2.5);
      expect(instrument.triggers, track).toHaveLength(1);
      expect(instrument.triggers[0], track).toContain(2.5);
    }
  });

  it("routes every instrument into the output, so effects on it apply to all rows", () => {
    const { output, voices } = build();
    for (const track of TRACK_IDS) {
      const [instrument] = play(voices[track], 0);
      expect(reaches(instrument, output), track).toBe(true);
    }
  });
});
