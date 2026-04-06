import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendSMS } from "@/lib/sms";

const schema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim().toLowerCase();

    // Explicit connect — surfaces connection errors clearly before any query
    try {
      await prisma.$connect();
    } catch (connErr) {
      const connMsg = connErr instanceof Error ? connErr.message : String(connErr);
      console.error("[register] DB CONNECTION FAILED:", connMsg);

      if (connMsg.includes("Tenant or user not found") || connMsg.includes("FATAL")) {
        console.error("[register] ❌ DATABASE_URL is wrong. Check Vercel env vars — username must be postgres.PROJECT_REF (e.g. postgres.wqplmzlwtmprgkykuhzb)");
      }

      return NextResponse.json(
        { error: "Database connection failed", detail: connMsg },
        { status: 503 }
      );
    }

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashed,
        role: "USER",
        isVerified: true,
        walletBalance: 0,
        walletCurrency: "NGN",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        walletBalance: true,
        walletCurrency: true,
      },
    });

    // Attempt to send a Welcome SMS if a phone number was provided
    if (phone) {
      try {
        const message = `Welcome to Abati, ${normalizedUsername}! Your account has been successfully created.`;
        await sendSMS(phone, message);
      } catch (smsError) {
        // Catch SMS errors (e.g., Twilio trial restrictions) so the registration doesn't fail
        console.error("[register] Non-fatal: Twilio SMS failed to send:", smsError);
      }
    }

    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] FULL ERROR:", err);
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("Tenant or user not found") || message.includes("FATAL")) {
      console.error("[register] ❌ DATABASE_URL username is wrong in Vercel. Must be: postgres.wqplmzlwtmprgkykuhzb");
    }

    return NextResponse.json(
      { error: "Registration failed", detail: message },
      { status: 500 }
    );
  }
}
