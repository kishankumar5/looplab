import { describe, expect, it } from "vitest";
import { compressorMakeupDb, crackleGain, crackleSamples, muffleCutoffHz, swingDelaySeconds, trackGain } from "./mix";

describe("trackGain", () => {
  it("plays a row at full volume at the instrument's own level", () => {
    expect(trackGain({ volume: 100, muted: false })).toBe(1);
  });

  it("is silent at volume 0", () => {
    expect(trackGain({ volume: 0, muted: false })).toBe(0);
  });

  it("follows a squared curve, so the slider sounds even: 80 (the default) is about -4 dB, 50 is -12 dB", () => {
    expect(trackGain({ volume: 80, muted: false })).toBeCloseTo(0.64);
    expect(trackGain({ volume: 50, muted: false })).toBeCloseTo(0.25);
  });

  it("gets louder as the volume goes up", () => {
    const gains = [0, 10, 25, 50, 75, 90, 100].map((volume) => trackGain({ volume, muted: false }));
    expect(gains).toEqual([...gains].sort((a, b) => a - b));
    expect(new Set(gains).size).toBe(gains.length);
  });

  it("is silent when muted, whatever the volume", () => {
    for (const volume of [0, 50, 80, 100]) expect(trackGain({ volume, muted: true })).toBe(0);
  });
});

describe("compressorMakeupDb", () => {
  // Web Audio spec, DynamicsCompressorNode processing: makeup = (1 / fullRangeGain) ^ 0.6, where
  // fullRangeGain is where a 0 dBFS input comes out. With a hard knee that's threshold * (1 - 1/ratio).
  it("matches the Web Audio formula for a hard-knee compressor", () => {
    expect(compressorMakeupDb(-1, 20)).toBeCloseTo(0.57, 10);
    expect(compressorMakeupDb(-6, 4)).toBeCloseTo(2.7, 10);
  });

  it("adds nothing when the threshold is at full scale", () => {
    expect(compressorMakeupDb(0, 20)).toBeCloseTo(0, 10);
  });
});

describe("swingDelaySeconds (#10)", () => {
  /** One 16th note at `bpm`: a quarter of a beat. */
  const sixteenth = (bpm: number) => 60 / bpm / 4;

  it("never delays the on-beat 16ths (steps 1, 3, 5, ... are 0-based even)", () => {
    for (const step of [0, 2, 4, 14]) expect(swingDelaySeconds(step, 60, 82)).toBe(0);
  });

  it("plays straight at 0% swing", () => {
    for (const step of [1, 3, 15]) expect(swingDelaySeconds(step, 0, 120)).toBe(0);
  });

  it.each([60, 82, 120, 140])("at 50%% swing and %i BPM, delays every second 16th by half a 16th", (bpm) => {
    expect(swingDelaySeconds(1, 50, bpm)).toBeCloseTo(sixteenth(bpm) / 2, 10);
    expect(swingDelaySeconds(7, 50, bpm)).toBeCloseTo(sixteenth(bpm) / 2, 10);
  });

  it.each([60, 82, 140])("at the 60%% maximum and %i BPM, delays by 0.6 of a 16th", (bpm) => {
    expect(swingDelaySeconds(3, 60, bpm)).toBeCloseTo(sixteenth(bpm) * 0.6, 10);
  });

  it("clamps swing to 0..60", () => {
    expect(swingDelaySeconds(1, 90, 120)).toBe(swingDelaySeconds(1, 60, 120));
    expect(swingDelaySeconds(1, -5, 120)).toBe(0);
  });
});

describe("muffleCutoffHz (#7)", () => {
  it("is wide open at 0 and very muffled at 100", () => {
    expect(muffleCutoffHz(0)).toBe(20_000);
    expect(muffleCutoffHz(100)).toBe(400);
  });

  it("gets steadily darker as muffle goes up, clamped to 0..100", () => {
    const cutoffs = [0, 25, 50, 75, 100].map(muffleCutoffHz);
    for (let i = 1; i < cutoffs.length; i++) expect(cutoffs[i]).toBeLessThan(cutoffs[i - 1]);
    // Even steps in muffle are even steps in pitch (octaves), so the middle is the geometric mean.
    expect(muffleCutoffHz(50)).toBeCloseTo(Math.sqrt(20_000 * 400), 6);
    expect(muffleCutoffHz(-10)).toBe(20_000);
    expect(muffleCutoffHz(140)).toBe(400);
  });
});

describe("crackleGain (#7)", () => {
  it("is silent at 0 and gets louder up to its maximum at 100", () => {
    expect(crackleGain(0)).toBe(0);
    const gains = [0, 20, 50, 80, 100].map(crackleGain);
    for (let i = 1; i < gains.length; i++) expect(gains[i]).toBeGreaterThan(gains[i - 1]);
    expect(crackleGain(100)).toBeLessThanOrEqual(0.5);
    expect(crackleGain(130)).toBe(crackleGain(100));
  });
});

describe("crackleSamples (#7)", () => {
  /** A repeatable stand-in for Math.random. */
  function seeded(seed: number) {
    return () => ((seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648);
  }

  it("makes the requested number of samples, all within -1..1", () => {
    const samples = crackleSamples(44_100, seeded(1));
    expect(samples).toHaveLength(44_100);
    for (const sample of samples) expect(Math.abs(sample)).toBeLessThanOrEqual(1);
  });

  it("is a quiet hiss with occasional loud pops", () => {
    const samples = crackleSamples(44_100, seeded(7));
    const loud = samples.filter((sample) => Math.abs(sample) > 0.2).length;
    const quiet = samples.filter((sample) => Math.abs(sample) < 0.05).length;
    expect(loud).toBeGreaterThan(0);
    expect(loud / samples.length).toBeLessThan(0.02);
    expect(quiet / samples.length).toBeGreaterThan(0.9);
  });
});
