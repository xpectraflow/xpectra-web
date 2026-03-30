import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/schemas";
import { createUser } from "@/lib/auth/user-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid request payload.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);

    await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("register-error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user." },
      { status: 500 },
    );
  }
}
