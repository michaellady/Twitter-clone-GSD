import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export function createRetweet(userId: number, originalPostId: number): { success: boolean } {
  // Prevent self-retweet (per D-14)
  const original = db
    .select({ userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, originalPostId))
    .get();

  if (!original || original.userId === userId) {
    return { success: false };
  }

  // Prevent duplicate retweet
  const existing = db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        eq(posts.repostOfId, originalPostId),
        isNull(posts.content),
      ),
    )
    .get();

  if (existing) {
    return { success: false };
  }

  db.insert(posts)
    .values({ userId, repostOfId: originalPostId, content: null })
    .run();

  return { success: true };
}

export function deleteRetweet(userId: number, originalPostId: number): boolean {
  const result = db
    .delete(posts)
    .where(
      and(
        eq(posts.userId, userId),
        eq(posts.repostOfId, originalPostId),
        isNull(posts.content),
      ),
    )
    .run();
  return result.changes > 0;
}
