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
  });
});
