import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPostSchema, createQuoteTweetSchema } from "@/lib/validations/post";
import { createPost, getFeedPosts } from "@/lib/services/posts";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const posts = getFeedPosts(page, userId);

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Use quote-tweet schema if repostOfId is present, otherwise standard schema
    const isQuote = body.repostOfId !== undefined;
    const result = isQuote
      ? createQuoteTweetSchema.safeParse(body)
      : createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userId = Number((session.user as any).id);
    const repostOfId = isQuote ? (result.data as unknown as { repostOfId: number }).repostOfId : undefined;
    const post = createPost(userId, result.data.content, repostOfId);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
