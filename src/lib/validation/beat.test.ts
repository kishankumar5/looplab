import { describe, expect, it } from "vitest";
import { beatPatternSchema, createBeatSchema, defaultPattern, TRACK_IDS, updateBeatSchema } from "./beat";

describe("defaultPattern", () => {
  it("is an empty beat with the PRD defaults", () => {
    const p = defaultPattern();
    expect(p).toMatchObject({ version: 1, bpm: 82, swing: 0, effects: { muffle: 0, crackle: 0 } });
    expect(Object.keys(p.tracks)).toEqual([...TRACK_IDS]);
    for (const id of TRACK_IDS) {
      expect(p.tracks[id]).toEqual({ steps: Array(16).fill(false), volume: 80, muted: false });
    }
  });

  it("returns a fresh copy each time", () => {
    const a = defaultPattern();
    a.tracks.kick.steps[0] = true;
    expect(defaultPattern().tracks.kick.steps[0]).toBe(false);
  });
});

describe("beatPatternSchema", () => {
  it("accepts the default pattern", () => {
    expect(beatPatternSchema.parse(defaultPattern())).toEqual(defaultPattern());
  });

  it("enforces the PRD ranges", () => {
    const bad = (patch: (p: ReturnType<typeof defaultPattern>) => void) => {
      const p = defaultPattern();
      patch(p);
      return beatPatternSchema.safeParse(p).success;
    };
    expect(bad((p) => (p.bpm = 59))).toBe(false);
    expect(bad((p) => (p.bpm = 141))).toBe(false);
    expect(bad((p) => (p.swing = 61))).toBe(false);
    expect(bad((p) => (p.tracks.kick.volume = 101))).toBe(false);
    expect(bad((p) => (p.effects.crackle = -1))).toBe(false);
    expect(bad((p) => (p.tracks.snare.steps = Array(15).fill(false)))).toBe(false);
  });

  it("requires all five tracks", () => {
    const p = defaultPattern() as Record<string, unknown>;
    delete (p.tracks as Record<string, unknown>).synth;
    expect(beatPatternSchema.safeParse(p).success).toBe(false);
  });
});

describe("createBeatSchema and updateBeatSchema", () => {
  it("defaults the title and trims it", () => {
    expect(createBeatSchema.parse({ pattern: defaultPattern() }).title).toBe("Untitled beat");
    expect(createBeatSchema.parse({ title: "  rainy window ", pattern: defaultPattern() }).title).toBe("rainy window");
  });

  it("rejects an empty or too-long title", () => {
    expect(updateBeatSchema.safeParse({ title: "  " }).success).toBe(false);
    expect(updateBeatSchema.safeParse({ title: "x".repeat(81) }).success).toBe(false);
  });

  it("lets an update change any subset, but not nothing", () => {
    expect(updateBeatSchema.parse({ isPublic: true })).toEqual({ isPublic: true });
    expect(updateBeatSchema.safeParse({}).success).toBe(false);
  });
});
