import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const identifier = `password-reset:${normalised}`;

    // Find and validate token
    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier, token } },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash new password and update user
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: normalised },
      data: { password: hashed },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
