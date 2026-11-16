import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { beatPatternSchema, type BeatPattern } from "@/lib/validation/beat";
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

/** The original a remix credits (PRD US-6). */
export interface RemixOriginal {
  id: string;
  title: string;
  creator: { displayName: string };
}

/** A beat as its page shows it: the editor (owner) or the listen-only share page. */
export interface BeatDetail {
  id: string;
  title: string;
  pattern: BeatPattern;
  isPublic: boolean;
  isOwner: boolean;
  creator: { displayName: string };
  /** True for remixes, even when the original is gone (then remixedFrom is null). */
  isRemix: boolean;
  /** The original, if the viewer may still see it. */
  remixedFrom: RemixOriginal | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A row on My Beats (PRD US-4). */
export interface MyBeat {
  id: string;
  title: string;
  bpm: number;
  isPublic: boolean;
  updatedAt: Date;
  isRemix: boolean;
  remixedFrom: RemixOriginal | null;
}

export interface BeatChanges {
  title?: string;
  pattern?: BeatPattern;
  isPublic?: boolean;
}

const originalSelect = {
  select: { id: true, title: true, isPublic: true, ownerId: true, owner: { select: { displayName: true } } },
} as const;

type OriginalRow = Prisma.BeatGetPayload<{ select: (typeof originalSelect)["select"] }>;

/** Credit only originals the viewer may still see: public ones, or their own (PRD US-6). */
function credit(original: OriginalRow | null, viewerId: string | null): RemixOriginal | null {
  if (!original || (!original.isPublic && original.ownerId !== viewerId)) return null;
  return { id: original.id, title: original.title, creator: { displayName: original.owner.displayName } };
}

const detailSelect = {
  id: true,
  title: true,
  pattern: true,
  isPublic: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { displayName: true } },
  isRemix: true,
  remixedFrom: originalSelect,
} as const;

type DetailRow = Prisma.BeatGetPayload<{ select: typeof detailSelect }>;

function toDetail(row: DetailRow, viewerId: string | null): BeatDetail {
  return {
    id: row.id,
    title: row.title,
    // Validated on the way in; parse again so old or hand-edited rows can't reach the editor malformed.
    pattern: beatPatternSchema.parse(row.pattern),
    isPublic: row.isPublic,
    isOwner: row.ownerId === viewerId,
    isRemix: row.isRemix,
    creator: { displayName: row.owner.displayName },
    remixedFrom: credit(row.remixedFrom, viewerId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Throws BeatNotFoundError unless the user owns the beat. */
async function assertOwner(ownerId: string, beatId: string, db: PrismaClient) {
  const beat = await db.beat.findUnique({ where: { id: beatId }, select: { ownerId: true } });
  if (!beat || beat.ownerId !== ownerId) throw new BeatNotFoundError();
}

/** Saves a new private beat for the owner. */
export async function createBeat(
  ownerId: string,
  data: { title?: string; pattern: BeatPattern },
  db: PrismaClient = prisma,
): Promise<BeatDetail> {
  const row = await db.beat.create({
    data: { ownerId, title: data.title, pattern: data.pattern },
    select: detailSelect,
  });
  return toDetail(row, ownerId);
}

/** The owner's beats, most recently edited first. */
export async function listMyBeats(ownerId: string, db: PrismaClient = prisma): Promise<MyBeat[]> {
  const rows = await db.beat.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, pattern: true, isPublic: true, updatedAt: true, isRemix: true, remixedFrom: originalSelect },
  });
  return rows.map(({ pattern, remixedFrom, ...row }) => ({ ...row, remixedFrom: credit(remixedFrom, ownerId), bpm: beatPatternSchema.shape.bpm.catch(82).parse((pattern as { bpm?: unknown })?.bpm) }));
}

/** A beat the viewer may see (public, or their own). Throws BeatNotFoundError otherwise. */
export async function getBeat(viewerId: string | null, beatId: string, db: PrismaClient = prisma): Promise<BeatDetail> {
  const row = await db.beat.findUnique({ where: { id: beatId }, select: detailSelect });
  if (!row || (!row.isPublic && row.ownerId !== viewerId)) throw new BeatNotFoundError();
  return toDetail(row, viewerId);
}

/** Like getBeat, but null instead of BeatNotFoundError: for pages that show the 404 page then. */
export async function findBeat(
  viewerId: string | null,
  beatId: string,
  db: PrismaClient = prisma,
): Promise<BeatDetail | null> {
  try {
    return await getBeat(viewerId, beatId, db);
  } catch (error) {
    if (error instanceof BeatNotFoundError) return null;
    throw error;
  }
}

/** Updates the owner's beat. Throws BeatNotFoundError for anyone else. */
export async function updateBeat(
  ownerId: string,
  beatId: string,
  changes: BeatChanges,
  db: PrismaClient = prisma,
): Promise<BeatDetail> {
  await assertOwner(ownerId, beatId, db);
  const row = await db.beat.update({ where: { id: beatId }, data: changes, select: detailSelect });
  return toDetail(row, ownerId);
}

/** Deletes the owner's beat. Throws BeatNotFoundError for anyone else. */
export async function deleteBeat(ownerId: string, beatId: string, db: PrismaClient = prisma): Promise<void> {
  await assertOwner(ownerId, beatId, db);
  await db.beat.delete({ where: { id: beatId } });
}

/** Copies a beat the user can see into a new private beat they own, crediting the original (PRD US-6). */
export async function remixBeat(userId: string, beatId: string, db: PrismaClient = prisma): Promise<BeatDetail> {
  const original = await db.beat.findUnique({
    where: { id: beatId },
    select: { id: true, title: true, pattern: true, isPublic: true, ownerId: true },
  });
  if (!original || (!original.isPublic && original.ownerId !== userId)) throw new BeatNotFoundError();

  const row = await db.beat.create({
    data: {
      ownerId: userId,
      title: remixTitle(original.title),
      pattern: original.pattern ?? {},
      isPublic: false,
      isRemix: true,
      remixedFromId: original.id,
    },
    select: detailSelect,
  });
  return toDetail(row, userId);
}

const REMIX_SUFFIX = " (remix)";
const MAX_TITLE = 80;

/** "{title} (remix)", shortening the original title so the result stays a valid title. */
function remixTitle(title: string): string {
  return `${title.slice(0, MAX_TITLE - REMIX_SUFFIX.length).trimEnd()}${REMIX_SUFFIX}`;
}
