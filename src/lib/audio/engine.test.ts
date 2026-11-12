import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRACK_IDS, defaultPattern, type BeatPattern, type TrackId } from "@/lib/validation/beat";

// A stand-in for Tone.js and the instruments: these tests check what the engine tells Tone to do
// (start, tempo, which row plays at which audio time), never what comes out of the speakers.
const fake = vi.hoisted(() => ({
  transport: { bpm: { value: 120 }, start: vi.fn(), stop: vi.fn(), cancel: vi.fn(), scheduleRepeat: vi.fn() },
  draw: { schedule: vi.fn(), cancel: vi.fn() },
  /** Playhead callbacks waiting for their audio time, the way Tone's Draw holds them. */
  pendingDraws: [] as Array<() => void>,
  unlockAudio: vi.fn(),
  createVoices: vi.fn(),
  voices: { kick: vi.fn(), snare: vi.fn(), hihat: vi.fn(), bass: vi.fn(), synth: vi.fn() },
}));

vi.mock("tone", () => ({
  start: fake.unlockAudio,
  getTransport: () => fake.transport,
  getDraw: () => fake.draw,
  Volume: class {
    toDestination() {
      return this;
    }
  },
  /** A row's channel: records its level (rampTo jumps straight there) and where it's connected. */
  Gain: class {
    gain: { value: number; rampTo: (value: number) => void };
    outputs: unknown[] = [];
    constructor(value = 1) {
      const gain = { value, rampTo: (next: number) => void (gain.value = next) };
      this.gain = gain;
    }
    connect(node: unknown) {
      this.outputs.push(node);
      return this;
    }
  },
}));
vi.mock("./voices", () => ({ createVoices: fake.createVoices }));

let engine: typeof import("./engine");

beforeEach(async () => {
  vi.resetAllMocks();
  fake.transport.bpm.value = 120;
  fake.pendingDraws.length = 0;
  fake.unlockAudio.mockResolvedValue(undefined);
  fake.createVoices.mockReturnValue(fake.voices);
  fake.draw.schedule.mockImplementation((callback: () => void) => fake.pendingDraws.push(callback));
  fake.draw.cancel.mockImplementation(() => (fake.pendingDraws.length = 0));
  // The engine is one long-lived instance per page, so each test loads a fresh copy.
  vi.resetModules();
  engine = await import("./engine");
});

/** Runs the engine's 16th-note callback the way Tone's Transport would, at audio time `time`. */
function tick(time: number) {
  const [callback, interval] = fake.transport.scheduleRepeat.mock.calls[0];
  expect(interval).toBe("16n");
  callback(time);
}

/** Lets the waiting playhead callbacks run, as Tone's Draw does when their audio time arrives. */
function drawFrames() {
  for (const callback of fake.pendingDraws.splice(0)) callback();
}

function pattern(edit: (p: BeatPattern) => void = () => {}): BeatPattern {
  const p = defaultPattern();
  edit(p);
  return p;
}

const ignoreSteps = () => {};

interface FakeChannel {
  gain: { value: number };
  outputs: unknown[];
}

/** The channel the engine routed a row's instrument into (what it gave createVoices). */
function channel(track: TrackId): FakeChannel | undefined {
  const outputs = fake.createVoices.mock.calls[0]?.[1] as Partial<Record<TrackId, FakeChannel>> | undefined;
  return outputs?.[track];
}

const levels = () => TRACK_IDS.map((track) => channel(track)?.gain.value);

describe("audio engine", () => {
  it("does not touch audio before start", () => {
    engine.update(pattern());
    engine.stop();
    expect(fake.unlockAudio).not.toHaveBeenCalled();
    expect(fake.createVoices).not.toHaveBeenCalled();
    expect(fake.transport.start).not.toHaveBeenCalled();
  });

  it("unlocks audio, sets the tempo, and starts the transport", async () => {
    await engine.start(pattern((p) => (p.bpm = 90)), ignoreSteps);
    expect(fake.unlockAudio).toHaveBeenCalledOnce();
    expect(fake.transport.bpm.value).toBe(90);
    expect(fake.transport.start).toHaveBeenCalledOnce();
  });

  it("plays the rows that are on at each step, at that step's audio time", async () => {
    const beat = pattern((p) => {
      p.tracks.kick.steps[0] = true;
      p.tracks.hihat.steps[0] = true;
      p.tracks.snare.steps[1] = true;
    });
    await engine.start(beat, ignoreSteps);

    tick(0.5);
    expect(fake.voices.kick).toHaveBeenCalledExactlyOnceWith(0.5);
    expect(fake.voices.hihat).toHaveBeenCalledExactlyOnceWith(0.5);
    expect(fake.voices.snare).not.toHaveBeenCalled();

    tick(0.68);
    expect(fake.voices.snare).toHaveBeenCalledExactlyOnceWith(0.68);
    expect(fake.voices.kick).toHaveBeenCalledOnce();
    expect(fake.voices.bass).not.toHaveBeenCalled();
    expect(fake.voices.synth).not.toHaveBeenCalled();
  });

  it("loops back to step 1 after step 16", async () => {
    await engine.start(pattern((p) => (p.tracks.bass.steps[0] = true)), ignoreSteps);
    for (let time = 0; time <= 16; time++) tick(time);
    expect(fake.voices.bass.mock.calls).toEqual([[0], [16]]);
  });

  it("reports each step for the playhead when it is heard, not when it is scheduled", async () => {
    const onStep = vi.fn();
    await engine.start(pattern(), onStep);
    tick(1);
    tick(1.2);
    expect(onStep).not.toHaveBeenCalled();
    expect(fake.draw.schedule).toHaveBeenNthCalledWith(1, expect.any(Function), 1);
    expect(fake.draw.schedule).toHaveBeenNthCalledWith(2, expect.any(Function), 1.2);

    drawFrames();
    expect(onStep.mock.calls).toEqual([[0], [1]]);
  });

  it("plays a step toggled while playing on the next pass, without restarting", async () => {
    await engine.start(pattern(), ignoreSteps);
    tick(0);
    engine.update(pattern((p) => (p.tracks.synth.steps[0] = true)));
    for (let time = 1; time <= 16; time++) tick(time);

    expect(fake.voices.synth).toHaveBeenCalledExactlyOnceWith(16);
    expect(fake.transport.start).toHaveBeenCalledOnce();
    expect(fake.transport.stop).not.toHaveBeenCalled();
  });

  it("changes the tempo live", async () => {
    await engine.start(pattern(), ignoreSteps);
    engine.update(pattern((p) => (p.bpm = 128)));
    expect(fake.transport.bpm.value).toBe(128);
    expect(fake.transport.start).toHaveBeenCalledOnce();
  });

  it("gives each row its own channel into the master, set from the beat's volume and mute", async () => {
    await engine.start(
      pattern((p) => {
        p.tracks.kick.volume = 100;
        p.tracks.snare.volume = 50;
        p.tracks.hihat.muted = true;
      }),
      ignoreSteps,
    );
    // kick, snare, hihat, bass, synth; 80 is the default volume.
    expect(levels()).toEqual([1, 0.25, 0, 0.64, 0.64]);
    const master = channel("kick")?.outputs;
    expect(master).toHaveLength(1);
    for (const track of TRACK_IDS) expect(channel(track)?.outputs).toEqual(master);
  });

  it("changes a row's volume and mute live while playing, without restarting", async () => {
    await engine.start(pattern(), ignoreSteps);
    engine.update(
      pattern((p) => {
        p.tracks.bass.volume = 100;
        p.tracks.kick.muted = true;
      }),
    );
    expect(levels()).toEqual([0, 0.64, 0.64, 1, 0.64]);

    engine.update(pattern((p) => (p.tracks.bass.volume = 100)));
    expect(channel("kick")?.gain.value).toBe(0.64);
    expect(fake.transport.start).toHaveBeenCalledOnce();
  });

  it("uses the latest volume and mute when it starts again", async () => {
    await engine.start(pattern(), ignoreSteps);
    engine.stop();
    engine.update(pattern((p) => (p.tracks.synth.muted = true)));
    await engine.start(pattern((p) => (p.tracks.synth.muted = true)), ignoreSteps);
    expect(channel("synth")?.gain.value).toBe(0);
  });

  it("stops the transport and drops playhead updates that were still waiting", async () => {
    const onStep = vi.fn();
    await engine.start(pattern(), onStep);
    tick(3);
    engine.stop();
    drawFrames();
    expect(fake.transport.stop).toHaveBeenCalledOnce();
    expect(onStep).not.toHaveBeenCalled();
  });

  it("starts again from step 1 after a stop", async () => {
    const onStep = vi.fn();
    await engine.start(pattern(), onStep);
    tick(0);
    tick(1);
    tick(2);
    engine.stop();

    await engine.start(pattern(), onStep);
    tick(5);
    drawFrames();
    expect(onStep.mock.calls).toEqual([[0]]);
  });

  it("builds the instruments once and reuses them", async () => {
    await engine.start(pattern(), ignoreSteps);
    engine.stop();
    await engine.start(pattern(), ignoreSteps);
    expect(fake.createVoices).toHaveBeenCalledOnce();
    expect(fake.transport.scheduleRepeat).toHaveBeenCalledOnce();
    expect(fake.transport.start).toHaveBeenCalledTimes(2);
  });

  it("stays stopped when Stop comes while audio is still unlocking", async () => {
    let unlock = () => {};
    fake.unlockAudio.mockReturnValue(new Promise<void>((resolve) => (unlock = resolve)));
    const starting = engine.start(pattern(), ignoreSteps);
    engine.stop();
    unlock();
    await starting;
    expect(fake.transport.start).not.toHaveBeenCalled();
  });

  it("rejects when audio can't be unlocked, and can try again", async () => {
    fake.unlockAudio.mockRejectedValueOnce(new Error("blocked"));
    await expect(engine.start(pattern(), ignoreSteps)).rejects.toThrow("blocked");

    await engine.start(pattern(), ignoreSteps);
    expect(fake.transport.start).toHaveBeenCalledOnce();
  });
});
