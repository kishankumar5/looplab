import { describe, expect, it } from "vitest";
import { previewRows } from "./preview";

describe("previewRows", () => {
  it("returns 5 rows of 16 cells in kick, snare, hihat, bass, synth order", () => {
    const rows = previewRows({ tracks: { snare: { steps: [false, true] }, kick: { steps: [true] } } });
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.length === 16)).toBe(true);
    expect(rows[0][0]).toBe(true);
    expect(rows[1][1]).toBe(true);
    expect(rows[2].some(Boolean)).toBe(false);
  });

  it("treats missing or malformed data as all off", () => {
    for (const bad of [null, undefined, "x", {}, { tracks: { kick: { steps: "nope" } } }]) {
      expect(previewRows(bad).flat().some(Boolean)).toBe(false);
    }
  });

  it("ignores extra steps and non-boolean values", () => {
    const rows = previewRows({ tracks: { kick: { steps: [1, "true", true, ...Array(20).fill(true)] } } });
    expect(rows[0].slice(0, 3)).toEqual([false, false, true]);
    expect(rows[0]).toHaveLength(16);
  });
});
