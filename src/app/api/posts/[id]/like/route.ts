import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { toggleLike } from "@/lib/services/likes";

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
    const result = toggleLike(userId, Number(id));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
