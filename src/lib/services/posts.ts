import { db } from "@/lib/db/client";
import { posts, users, likes } from "@/lib/db/schema";
import { eq, desc, isNull, and, count, sql } from "drizzle-orm";

export const POSTS_PER_PAGE = 20;

export type FeedPost = {
  id: number;
  content: string | null;
  createdAt: string;
  userId: number;
  parentId: number | null;
  repostOfId: number | null;
  authorUsername: string;
  authorDisplayName: string | null;
  // Interaction counts (derived, not stored)
  likeCount: number;
  replyCount: number;
  repostCount: number;
  // Current user interaction state
  likedByMe: boolean;
  repostedByMe: boolean;
  // Retweet resolution fields (for displaying original post content)
  originalPostId: number | null;
  originalContent: string | null;
  originalAuthorUsername: string | null;
  originalAuthorDisplayName: string | null;
  originalCreatedAt: string | null;
};

function enrichedPostSelect(currentUserId: number) {
  return {
    id: posts.id,
    content: posts.content,
    createdAt: posts.createdAt,
    userId: posts.userId,
    parentId: posts.parentId,
    repostOfId: posts.repostOfId,
    authorUsername: users.username,
    authorDisplayName: users.displayName,
    likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id})`,
    replyCount: sql<number>`(SELECT COUNT(*) FROM posts p2 WHERE p2.parent_id = ${posts.id})`,
    repostCount: sql<number>`(SELECT COUNT(*) FROM posts p3 WHERE p3.repost_of_id = ${posts.id} AND p3.content IS NULL)`,
    likedByMe: sql<number>`(SELECT CASE WHEN EXISTS(SELECT 1 FROM likes WHERE likes.user_id = ${currentUserId} AND likes.post_id = ${posts.id}) THEN 1 ELSE 0 END)`,
    repostedByMe: sql<number>`(SELECT CASE WHEN EXISTS(SELECT 1 FROM posts p4 WHERE p4.repost_of_id = ${posts.id} AND p4.user_id = ${currentUserId} AND p4.content IS NULL) THEN 1 ELSE 0 END)`,
    // Retweet resolution via raw SQL for self-join
    originalPostId: sql<number | null>`(SELECT op.id FROM posts op WHERE op.id = ${posts.repostOfId})`,
    originalContent: sql<string | null>`(SELECT op.content FROM posts op WHERE op.id = ${posts.repostOfId})`,
    originalAuthorUsername: sql<string | null>`(SELECT u.username FROM posts op JOIN users u ON op.user_id = u.id WHERE op.id = ${posts.repostOfId})`,
    originalAuthorDisplayName: sql<string | null>`(SELECT u.display_name FROM posts op JOIN users u ON op.user_id = u.id WHERE op.id = ${posts.repostOfId})`,
    originalCreatedAt: sql<string | null>`(SELECT op.created_at FROM posts op WHERE op.id = ${posts.repostOfId})`,
  };
}

function mapRow(row: Record<string, unknown>): FeedPost {
  return {
    id: row.id as number,
    content: row.content as string | null,
    createdAt: row.createdAt as string,
    userId: row.userId as number,
    parentId: row.parentId as number | null,
    repostOfId: row.repostOfId as number | null,
    authorUsername: row.authorUsername as string,
    authorDisplayName: row.authorDisplayName as string | null,
    likeCount: Number(row.likeCount) || 0,
    replyCount: Number(row.replyCount) || 0,
    repostCount: Number(row.repostCount) || 0,
    likedByMe: !!(row.likedByMe),
    repostedByMe: !!(row.repostedByMe),
    originalPostId: row.originalPostId as number | null,
    originalContent: row.originalContent as string | null,
    originalAuthorUsername: row.originalAuthorUsername as string | null,
    originalAuthorDisplayName: row.originalAuthorDisplayName as string | null,
    originalCreatedAt: row.originalCreatedAt as string | null,
  };
}

export function getFeedPosts(page: number = 1, currentUserId?: number): FeedPost[] {
  const uid = currentUserId ?? 0;
  const rows = db
    .select(enrichedPostSelect(uid))
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(isNull(posts.parentId))
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PER_PAGE)
    .offset((page - 1) * POSTS_PER_PAGE)
    .all();
  return rows.map(mapRow);
}

export function getUserPosts(username: string, page: number = 1, currentUserId?: number): FeedPost[] {
  const uid = currentUserId ?? 0;
  const rows = db
    .select(enrichedPostSelect(uid))
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(and(eq(users.username, username), isNull(posts.parentId)))
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PER_PAGE)
    .offset((page - 1) * POSTS_PER_PAGE)
    .all();
  return rows.map(mapRow);
}

export function getUserPostCount(username: string): number {
  const result = db
    .select({ value: count() })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(and(eq(users.username, username), isNull(posts.parentId)))
    .get();
  return result?.value ?? 0;
}

export function getUserByUsername(username: string) {
  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .get();
}

export function createPost(userId: number, content: string, repostOfId?: number) {
  return db.insert(posts).values({ userId, content, repostOfId: repostOfId ?? null }).returning().get();
}

export function deletePost(postId: number, userId: number): boolean {
  const result = db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .run();
  return result.changes > 0;
}

export function createReply(userId: number, parentPostId: number, content: string) {
  return db.insert(posts).values({ userId, parentId: parentPostId, content }).returning().get();
}

export function getReplies(postId: number, currentUserId?: number): FeedPost[] {
  const uid = currentUserId ?? 0;
  const rows = db
    .select(enrichedPostSelect(uid))
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.parentId, postId))
    .orderBy(posts.createdAt)
    .all();
  return rows.map(mapRow);
}
