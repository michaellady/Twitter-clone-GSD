import { db } from "@/lib/db/client";
import { likes } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export function toggleLike(userId: number, postId: number): { liked: boolean; likeCount: number } {
  const existing = db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .get();

  if (existing) {
    db.delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .run();
  } else {
    db.insert(likes)
      .values({ userId, postId })
      .run();
  }

  const countResult = db
    .select({ value: sql<number>`COUNT(*)` })
    .from(likes)
    .where(eq(likes.postId, postId))
    .get();

  return {
    liked: !existing,
    likeCount: countResult?.value ?? 0,
  };
}
