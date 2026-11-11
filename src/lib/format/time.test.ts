import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

const now = new Date("2026-11-10T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("timeAgo", () => {
  it("says just now under a minute", () => {
    expect(timeAgo(ago(20), now)).toBe("just now");
  });

  it("uses the largest whole unit", () => {
    expect(timeAgo(ago(2 * 60), now)).toBe("2 minutes ago");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3 hours ago");
    expect(timeAgo(ago(24 * 3600), now)).toBe("yesterday");
    expect(timeAgo(ago(14 * 24 * 3600), now)).toBe("2 weeks ago");
  });
});
