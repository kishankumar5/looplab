import { describe, expect, it } from "vitest";
import { TRACK_IDS, defaultPattern, type BeatPattern } from "@/lib/validation/beat";
import { sequencerReducer } from "./reducer";

/** A default pattern with a few steps on in different tracks, and non-default settings. */
function busyPattern(): BeatPattern {
  const pattern = defaultPattern();
  pattern.bpm = 96;
  pattern.swing = 30;
  pattern.tracks.kick.steps[0] = true;
  pattern.tracks.snare.steps[4] = true;
  pattern.tracks.hihat.steps[15] = true;
  pattern.tracks.bass.volume = 55;
  pattern.tracks.synth.muted = true;
  pattern.effects = { muffle: 35, crackle: 25 };
  return pattern;
}

describe("sequencerReducer", () => {
  describe("toggleStep", () => {
    it("turns an off step on", () => {
      const next = sequencerReducer(defaultPattern(), { type: "toggleStep", track: "kick", step: 4 });
      expect(next.tracks.kick.steps[4]).toBe(true);
    });

    it("turns an on step off", () => {
      const next = sequencerReducer(busyPattern(), { type: "toggleStep", track: "snare", step: 4 });
      expect(next.tracks.snare.steps[4]).toBe(false);
    });

    it("changes only the toggled step", () => {
      const next = sequencerReducer(busyPattern(), { type: "toggleStep", track: "bass", step: 8 });
      const expected = busyPattern();
      expected.tracks.bass.steps[8] = true;
      expect(next).toEqual(expected);
    });

    it("does not mutate the previous state", () => {
      const state = busyPattern();
      sequencerReducer(state, { type: "toggleStep", track: "kick", step: 0 });
      expect(state).toEqual(busyPattern());
    });

    it("ignores a step outside the bar", () => {
      const state = busyPattern();
      for (const step of [-1, 16, 2.5]) {
        expect(sequencerReducer(state, { type: "toggleStep", track: "kick", step })).toBe(state);
      }
    });
  });

  describe("clear", () => {
    it("turns every step off on every track", () => {
      const next = sequencerReducer(busyPattern(), { type: "clear" });
      for (const track of TRACK_IDS) {
        expect(next.tracks[track].steps).toEqual(defaultPattern().tracks[track].steps);
      }
    });

    it("keeps tempo, swing, volume, mute, and effects", () => {
      const next = sequencerReducer(busyPattern(), { type: "clear" });
      expect(next.bpm).toBe(96);
      expect(next.swing).toBe(30);
      expect(next.tracks.bass.volume).toBe(55);
      expect(next.tracks.synth.muted).toBe(true);
      expect(next.effects).toEqual({ muffle: 35, crackle: 25 });
    });

    it("does not mutate the previous state", () => {
      const state = busyPattern();
      sequencerReducer(state, { type: "clear" });
      expect(state).toEqual(busyPattern());
    });

    it("returns the same state when every step is already off, so history gets no empty entries", () => {
      const state = sequencerReducer(busyPattern(), { type: "clear" });
      expect(sequencerReducer(state, { type: "clear" })).toBe(state);
    });
  });

  describe("setTempo", () => {
    it("sets the tempo and changes nothing else", () => {
      const next = sequencerReducer(busyPattern(), { type: "setTempo", bpm: 120 });
      expect(next).toEqual({ ...busyPattern(), bpm: 120 });
    });

    it("accepts both ends of the 60 to 140 BPM range", () => {
      expect(sequencerReducer(busyPattern(), { type: "setTempo", bpm: 60 }).bpm).toBe(60);
      expect(sequencerReducer(busyPattern(), { type: "setTempo", bpm: 140 }).bpm).toBe(140);
    });

    it("keeps the tempo inside 60 to 140 BPM", () => {
      expect(sequencerReducer(busyPattern(), { type: "setTempo", bpm: 59 }).bpm).toBe(60);
      expect(sequencerReducer(busyPattern(), { type: "setTempo", bpm: 300 }).bpm).toBe(140);
    });

    it("rounds to a whole BPM, which is what a saved beat stores", () => {
      expect(sequencerReducer(busyPattern(), { type: "setTempo", bpm: 90.6 }).bpm).toBe(91);
    });

    it("ignores a tempo that is not a number", () => {
      const state = busyPattern();
      expect(sequencerReducer(state, { type: "setTempo", bpm: Number.NaN })).toBe(state);
    });

    it("returns the same state when the tempo does not change, so history gets no empty entries", () => {
      const state = busyPattern();
      expect(sequencerReducer(state, { type: "setTempo", bpm: 96 })).toBe(state);
    });

    it("does not mutate the previous state", () => {
      const state = busyPattern();
      sequencerReducer(state, { type: "setTempo", bpm: 70 });
      expect(state).toEqual(busyPattern());
    });
  });

  describe("setVolume", () => {
    it("sets one row's volume and changes nothing else", () => {
      const next = sequencerReducer(busyPattern(), { type: "setVolume", track: "snare", volume: 40 });
      const expected = busyPattern();
      expected.tracks.snare.volume = 40;
      expect(next).toEqual(expected);
    });

    it("accepts both ends of the 0 to 100 range", () => {
      expect(sequencerReducer(busyPattern(), { type: "setVolume", track: "kick", volume: 0 }).tracks.kick.volume).toBe(0);
      expect(sequencerReducer(busyPattern(), { type: "setVolume", track: "kick", volume: 100 }).tracks.kick.volume).toBe(100);
    });

    it("keeps the volume inside 0 to 100", () => {
      expect(sequencerReducer(busyPattern(), { type: "setVolume", track: "hihat", volume: -5 }).tracks.hihat.volume).toBe(0);
      expect(sequencerReducer(busyPattern(), { type: "setVolume", track: "hihat", volume: 140 }).tracks.hihat.volume).toBe(100);
    });

    it("rounds to a whole number, which is what a saved beat stores", () => {
      expect(sequencerReducer(busyPattern(), { type: "setVolume", track: "bass", volume: 61.6 }).tracks.bass.volume).toBe(62);
    });

    it("ignores a volume that is not a number", () => {
      const state = busyPattern();
      expect(sequencerReducer(state, { type: "setVolume", track: "kick", volume: Number.NaN })).toBe(state);
    });

    it("returns the same state when the volume does not change, so history gets no empty entries", () => {
      const state = busyPattern();
      expect(sequencerReducer(state, { type: "setVolume", track: "bass", volume: 55 })).toBe(state);
    });

    it("does not mutate the previous state", () => {
      const state = busyPattern();
      sequencerReducer(state, { type: "setVolume", track: "kick", volume: 10 });
      expect(state).toEqual(busyPattern());
    });
  });

  describe("toggleMute", () => {
    it("mutes an unmuted row and changes nothing else", () => {
      const next = sequencerReducer(busyPattern(), { type: "toggleMute", track: "kick" });
      const expected = busyPattern();
      expected.tracks.kick.muted = true;
      expect(next).toEqual(expected);
    });

    it("unmutes a muted row, keeping its volume and steps", () => {
      const next = sequencerReducer(busyPattern(), { type: "toggleMute", track: "synth" });
      expect(next.tracks.synth).toEqual({ ...busyPattern().tracks.synth, muted: false });
    });

    it("does not mutate the previous state", () => {
      const state = busyPattern();
      sequencerReducer(state, { type: "toggleMute", track: "kick" });
      expect(state).toEqual(busyPattern());
    });
  });
});

describe("setEffect (#7)", () => {
  it("sets muffle and crackle, leaving everything else alone", () => {
    const start = defaultPattern();
    const muffled = sequencerReducer(start, { type: "setEffect", effect: "muffle", value: 70 });
    expect(muffled.effects).toEqual({ ...start.effects, muffle: 70 });
    expect(muffled.tracks).toBe(start.tracks);
    expect(muffled.bpm).toBe(start.bpm);
    const crackly = sequencerReducer(muffled, { type: "setEffect", effect: "crackle", value: 5 });
    expect(crackly.effects).toEqual({ muffle: 70, crackle: 5 });
  });

  it("clamps to 0..100 and rounds to whole numbers, like a saved beat stores", () => {
    const start = defaultPattern();
    expect(sequencerReducer(start, { type: "setEffect", effect: "muffle", value: 250 }).effects.muffle).toBe(100);
    expect(sequencerReducer(start, { type: "setEffect", effect: "crackle", value: -3 }).effects.crackle).toBe(0);
    expect(sequencerReducer(start, { type: "setEffect", effect: "muffle", value: 41.6 }).effects.muffle).toBe(42);
  });

  it("returns the same state for no change or a non-number, so history gets no empty step", () => {
    const start = defaultPattern();
    expect(sequencerReducer(start, { type: "setEffect", effect: "muffle", value: start.effects.muffle })).toBe(start);
    expect(sequencerReducer(start, { type: "setEffect", effect: "crackle", value: Number.NaN })).toBe(start);
  });

  it("Clear leaves the effects alone", () => {
    const start = sequencerReducer(defaultPattern(), { type: "setEffect", effect: "muffle", value: 90 });
    const withStep = sequencerReducer(start, { type: "toggleStep", track: "kick", step: 0 });
    expect(sequencerReducer(withStep, { type: "clear" }).effects.muffle).toBe(90);
  });
});
