import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { sendSMS } from "@/lib/sms";
import { assignUniqueReferralCode } from "@/lib/referral-code";
import { isSuperAdminEmail } from "@/lib/admin-access";

/** Registration is Prisma + bcrypt only. NextAuth uses Credentials + JWT; Supabase Auth is not used here. */

const schema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  /** Referral code or referrer user id from ?ref= */
  ref: z.string().max(128).optional(),
  acceptedLegal: z.literal(true),
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

    const { username, email, password, phone, ref } = parsed.data;
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

    const usernameTaken = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (usernameTaken) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    let referredById: string | undefined;
    const refTrim = ref?.trim();
    if (refTrim) {
      const referrer = await prisma.user.findFirst({
        where: {
          OR: [
            { referralCode: { equals: refTrim, mode: "insensitive" } },
            { id: refTrim },
          ],
        },
        select: { id: true },
      });
      if (referrer) referredById = referrer.id;
    }

    let user: {
      id: string;
      username: string;
      email: string;
      role: string;
      walletBalance: number;
      walletCurrency: string;
    };

    try {
      user = await prisma.$transaction(async (tx) => {
        const existingUsersCount = await tx.user.count();
        const role = existingUsersCount === 0 || isSuperAdminEmail(normalizedEmail) ? "ADMIN" : "USER";

        await tx.verificationToken.deleteMany({
          where: { identifier: normalizedEmail },
        });

        const created = await tx.user.create({
          data: {
            username: normalizedUsername,
            name: normalizedUsername,
            email: normalizedEmail,
            password: hashed,
            role,
            isVerified: true,
            walletBalance: 0,
            walletCurrency: "NGN",
            ...(referredById ? { referredById } : {}),
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
        await assignUniqueReferralCode(tx, created.id);
        return created;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = (e.meta?.target as string[] | undefined) ?? [];
        const field = Array.isArray(target) ? target.join(",") : "";
        if (field.includes("email")) {
          return NextResponse.json(
            { error: "An account with this email already exists" },
            { status: 409 }
          );
        }
        if (field.includes("username")) {
          return NextResponse.json(
            { error: "This username is already taken" },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "Registration failed: that email or username is already in use" },
          { status: 409 }
        );
      }
      throw e;
    }

    const welcomeMessage =
      "Welcome to Abati! Your account has been successfully created.";

    if (phone?.trim()) {
      try {
        await sendSMS(phone.trim(), welcomeMessage);
      } catch (smsError) {
        console.error("[register] Non-fatal: Termii SMS failed to send:", smsError);
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
