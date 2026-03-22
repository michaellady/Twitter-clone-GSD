import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(280, "Post must be 280 characters or less"),
});

export const createQuoteTweetSchema = createPostSchema.extend({
  repostOfId: z.number().int().positive(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateQuoteTweetInput = z.infer<typeof createQuoteTweetSchema>;
