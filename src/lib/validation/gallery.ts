import { z } from "zod";

/** GET /api/beats query string (PRD US-6). Values arrive as strings. */
export const galleryQuerySchema = z.object({
  sort: z.enum(["new", "likes"]).default("new"),
  page: z.coerce.number().int().min(1, "Page must be 1 or more").default(1),
});

export type GalleryQuery = z.infer<typeof galleryQuerySchema>;
export const GALLERY_PAGE_SIZE = 20;
