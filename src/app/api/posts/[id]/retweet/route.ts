import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createRetweet, deleteRetweet } from "@/lib/services/retweets";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const result = createRetweet(userId, Number(id));

    if (!result.success) {
      return NextResponse.json(
        { error: "Cannot retweet this post" },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const deleted = deleteRetweet(userId, Number(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Retweet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
