import { describe, expect, it } from "vitest";
import { trackGain } from "./mix";

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
