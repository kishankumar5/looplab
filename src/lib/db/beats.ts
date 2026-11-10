import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { GALLERY_PAGE_SIZE, type GalleryQuery } from "@/lib/validation/gallery";
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
  const where = { isPublic: true } satisfies Prisma.BeatWhereInput;
  const orderBy: Prisma.BeatOrderByWithRelationInput[] =
    query.sort === "likes" ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }] : [{ createdAt: "desc" }];

  const [total, rows] = await Promise.all([
    db.beat.count({ where }),
    db.beat.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * GALLERY_PAGE_SIZE,
      take: GALLERY_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        pattern: true,
        createdAt: true,
        owner: { select: { displayName: true } },
        _count: { select: { likes: true } },
        // Only the viewer's own like, to know whether to show the heart filled in.
        likes: { where: { userId: viewerId ?? "" }, select: { userId: true } },
      },
    }),
  ]);

  return {
    beats: rows.map((row) => ({
      id: row.id,
      title: row.title,
      pattern: row.pattern,
      createdAt: row.createdAt,
      creator: { displayName: row.owner.displayName },
      likeCount: row._count.likes,
      likedByMe: row.likes.length > 0,
    })),
    page: query.page,
    totalPages: Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE)),
  };
}

/** Throws BeatNotFoundError unless the beat exists and is public or owned by the user. */
async function assertCanSee(userId: string, beatId: string, db: PrismaClient) {
  const beat = await db.beat.findUnique({ where: { id: beatId }, select: { isPublic: true, ownerId: true } });
  if (!beat || (!beat.isPublic && beat.ownerId !== userId)) throw new BeatNotFoundError();
}

async function likeState(userId: string, beatId: string, db: PrismaClient): Promise<LikeState> {
  const [likeCount, mine] = await Promise.all([
    db.like.count({ where: { beatId } }),
    db.like.count({ where: { beatId, userId } }),
  ]);
  return { liked: mine > 0, likeCount };
}

/** Likes a public beat (or the user's own beat). Liking twice keeps one like. */
export async function likeBeat(userId: string, beatId: string, db: PrismaClient = prisma): Promise<LikeState> {
  await assertCanSee(userId, beatId, db);
  await db.like.upsert({
    where: { userId_beatId: { userId, beatId } },
    create: { userId, beatId },
    update: {},
  });
  return likeState(userId, beatId, db);
}

/** Removes the user's like. Unliking a beat you haven't liked is fine. */
export async function unlikeBeat(userId: string, beatId: string, db: PrismaClient = prisma): Promise<LikeState> {
  await assertCanSee(userId, beatId, db);
  await db.like.deleteMany({ where: { userId, beatId } });
  return likeState(userId, beatId, db);
}
