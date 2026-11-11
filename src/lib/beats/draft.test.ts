import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPattern } from "@/lib/validation/beat";
import { clearDraft, DRAFT_KEY, loadDraft, saveDraft } from "./draft";

describe("unsaved draft", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round-trips the title and pattern", () => {
    const draft = { title: "rainy window", pattern: defaultPattern() };
    saveDraft(draft);
    expect(loadDraft()).toEqual(draft);
  });

  it("is null when nothing is saved, after clearing, or when the stored value is junk", () => {
    expect(loadDraft()).toBeNull();
    saveDraft({ title: "x", pattern: defaultPattern() });
    clearDraft();
    expect(loadDraft()).toBeNull();
    localStorage.setItem(DRAFT_KEY, "{not json");
    expect(loadDraft()).toBeNull();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: "x", pattern: { bpm: 999 } }));
    expect(loadDraft()).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveDraft({ title: "x", pattern: defaultPattern() })).not.toThrow();
    expect(loadDraft()).toBeNull();
  });
});
