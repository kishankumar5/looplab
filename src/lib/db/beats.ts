import type { PrismaClient } from "@/generated/prisma/client";
import type { GalleryQuery } from "@/lib/validation/gallery";
import { prisma } from "./prisma";

/** A public beat as the gallery shows it (PRD US-6). */
export interface GalleryBeat {
  id: string;
  title: string;
  pattern: unknown;
  createdAt: Date;
  creator: { displayName: string };
  likeCount: number;
  likedByMe: boolean;
}

export interface GalleryPage {
  beats: GalleryBeat[];
  page: number;
  totalPages: number;
}

export interface LikeState {
  liked: boolean;
  likeCount: number;
}

export class BeatNotFoundError extends Error {
  constructor() {
    super("Beat not found");
    this.name = "BeatNotFoundError";
  }
}

/** Lists public beats, newest or most liked first, 20 per page. */
export async function listPublicBeats(
  query: GalleryQuery,
  viewerId: string | null,
  db: PrismaClient = prisma,
): Promise<GalleryPage> {
  void query;
  void viewerId;
  void db;
  throw new Error("not implemented");
}

/** Likes a public beat (or the viewer's own beat). Liking twice keeps one like. */
export async function likeBeat(userId: string, beatId: string, db: PrismaClient = prisma): Promise<LikeState> {
  void userId;
  void beatId;
  void db;
  throw new Error("not implemented");
}

/** Removes the user's like. Unliking a beat you haven't liked is fine. */
export async function unlikeBeat(userId: string, beatId: string, db: PrismaClient = prisma): Promise<LikeState> {
  void userId;
  void beatId;
  void db;
  throw new Error("not implemented");
}
