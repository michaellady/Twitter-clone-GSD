import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, username, password } = result.data;

    // Check if email or username already taken
    const existing = db
      .select({ email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .get();

    if (existing) {
      const field = existing.email === email ? "email" : "username";
      const message =
        field === "email"
          ? "This email is already taken"
          : "This username is already taken";
      return NextResponse.json(
        { error: { [field]: [message] } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.insert(users).values({ email, username, passwordHash }).run();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { _form: ["Something went wrong. Please try again."] } },
      { status: 500 }
    );
  }
}
