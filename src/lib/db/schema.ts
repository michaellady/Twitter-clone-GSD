import { sqliteTable, text, integer, uniqueIndex, index, primaryKey, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex("email_idx").on(table.email),
  uniqueIndex("username_idx").on(table.username),
]);

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content"),
  parentId: integer("parent_id").references((): AnySQLiteColumn => posts.id),
  repostOfId: integer("repost_of_id").references((): AnySQLiteColumn => posts.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index("posts_user_id_idx").on(table.userId),
  index("posts_parent_id_idx").on(table.parentId),
  index("posts_created_at_idx").on(table.createdAt),
]);

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex("likes_user_post_idx").on(table.userId, table.postId),
]);

export const follows = sqliteTable("follows", {
  followerId: integer("follower_id").notNull().references(() => users.id),
  followeeId: integer("followee_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followeeId] }),
]);
