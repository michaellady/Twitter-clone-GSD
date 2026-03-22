import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deletePost } from "@/lib/services/posts";

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
    const deleted = deletePost(Number(id), userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Post not found or not authorized" },
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
