import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as Tone from "tone";
import { createEffects } from "./effects";
import { crackleGain, muffleCutoffHz } from "./mix";

// A stand-in for the parts of Tone.js the effects use. These tests check how the effects are wired
// and what levels they are set to, never what comes out of the speakers.
class FakeNode {
  outputs: unknown[] = [];
  connect(node: unknown) {
    this.outputs.push(node);
    return this;
  }
}

class FakeParam {
  constructor(public value: number) {}
  rampTo(next: number) {
    this.value = next;
  }
}

class FakeFilter extends FakeNode {
  frequency: FakeParam;
  type: string;
  constructor(options: { frequency: number; type: string }) {
    super();
    this.frequency = new FakeParam(options.frequency);
    this.type = options.type;
  }
}

class FakeGain extends FakeNode {
  gain: FakeParam;
  constructor(value = 1) {
    super();
    this.gain = new FakeParam(value);
  }
}

class FakePlayer extends FakeNode {
  state: "started" | "stopped" = "stopped";
  loop = false;
  buffer: unknown;
  constructor(buffer: unknown) {
    super();
    this.buffer = buffer;
  }
  start = vi.fn(() => {
    this.state = "started";
  });
  stop = vi.fn(() => {
    this.state = "stopped";
  });
}

let made: { filter?: FakeFilter; gain?: FakeGain; player?: FakePlayer; samples?: Float32Array };

const fakeTone = {
  Filter: class extends FakeFilter {
    constructor(options: { frequency: number; type: string }) {
      super(options);
      made.filter = this;
    }
  },
  Gain: class extends FakeGain {
    constructor(value?: number) {
      super(value);
      made.gain = this;
    }
  },
  Player: class extends FakePlayer {
    constructor(buffer: unknown) {
      super(buffer);
      made.player = this;
    }
  },
  ToneAudioBuffer: {
    fromArray: (samples: Float32Array) => {
      made.samples = samples;
      return { samples };
    },
  },
  getContext: () => ({ sampleRate: 48_000 }),
} as unknown as typeof Tone;

const output = new FakeNode();
const effectsOf = (muffle: number, crackle: number) => ({ muffle, crackle });

beforeEach(() => {
  made = {};
  output.outputs = [];
});

describe("lo-fi effects (#7)", () => {
  it("routes the rows through a low-pass filter into the output", () => {
    const effects = createEffects(fakeTone, output as unknown as Tone.InputNode, effectsOf(30, 20));
    expect(effects.input).toBe(made.filter);
    expect(made.filter?.type).toBe("lowpass");
    expect(made.filter?.outputs).toEqual([output]);
    expect(made.filter?.frequency.value).toBe(muffleCutoffHz(30));
  });

  it("loops a generated crackle sample through its own level into the output, unfiltered", () => {
    createEffects(fakeTone, output as unknown as Tone.InputNode, effectsOf(30, 20));
    expect(made.player?.loop).toBe(true);
    expect(made.player?.outputs).toEqual([made.gain]);
    expect(made.gain?.outputs).toEqual([output]);
    expect(made.gain?.gain.value).toBe(crackleGain(20));
    // A couple of seconds of audio at the context's sample rate, so the loop doesn't sound repetitive.
    expect(made.samples?.length).toBe(2 * 48_000);
  });

  it("changes muffle and crackle live", () => {
    const effects = createEffects(fakeTone, output as unknown as Tone.InputNode, effectsOf(0, 0));
    effects.set(effectsOf(100, 60));
    expect(made.filter?.frequency.value).toBe(muffleCutoffHz(100));
    expect(made.gain?.gain.value).toBe(crackleGain(60));
  });

  it("crackles only while the loop plays", () => {
    const effects = createEffects(fakeTone, output as unknown as Tone.InputNode, effectsOf(0, 50));
    expect(made.player?.start).not.toHaveBeenCalled();
    effects.start();
    effects.start();
    expect(made.player?.start).toHaveBeenCalledOnce();
    effects.stop();
    expect(made.player?.stop).toHaveBeenCalledOnce();
    effects.stop();
    expect(made.player?.stop).toHaveBeenCalledOnce();
  });
});
