import { z } from "zod";

// Stub for the red step: real exports and types, no rules yet.
export const galleryQuerySchema = z.object({
  sort: z.string(),
  page: z.number(),
});

export type GalleryQuery = { sort: "new" | "likes"; page: number };
export const GALLERY_PAGE_SIZE = 20;
