import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalised } });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Upsert in VerificationToken (reuse identifier pattern)
    const identifier = `password-reset:${normalised}`;
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalised)}`;

    // Attempt to send email via nodemailer if SMTP env vars are present
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nm = require("nodemailer") as { createTransport: Function };
        const transporter = nm.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        }) as { sendMail: Function };
        await transporter.sendMail({
          from: process.env.EMAIL_FROM ?? `Abati Logs <noreply@abatilogs.com>`,
          to: normalised,
          subject: "Reset your Abati Logs password",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <h2 style="margin:0 0 8px;font-size:22px">Password Reset</h2>
              <p style="color:#6b7280;margin:0 0 24px">
                Click the button below to reset your password. This link expires in 1 hour.
              </p>
              <a href="${resetUrl}"
                style="display:inline-block;background:#7C3AED;color:#ffffff;font-weight:700;
                       padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px">
                Reset Password
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px">
                If you did not request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Log but don't fail — token is still saved in DB
        console.error("[forgot-password] Email send failed:", emailErr);
      }
    } else {
      // No SMTP configured — log reset URL to console for dev/admin use
      console.log(`[forgot-password] Reset URL for ${normalised}: ${resetUrl}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
