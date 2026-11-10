import { describe, expect, it } from "vitest";
import { galleryQuerySchema } from "./gallery";

describe("galleryQuerySchema", () => {
  it("defaults to newest first, page 1", () => {
    expect(galleryQuerySchema.parse({})).toEqual({ sort: "new", page: 1 });
  });

  it("reads sort and page from query-string values", () => {
    expect(galleryQuerySchema.parse({ sort: "likes", page: "3" })).toEqual({ sort: "likes", page: 3 });
  });

  it("rejects an unknown sort and a page below 1", () => {
    expect(galleryQuerySchema.safeParse({ sort: "random" }).success).toBe(false);
    expect(galleryQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(galleryQuerySchema.safeParse({ page: "abc" }).success).toBe(false);
  });
});
