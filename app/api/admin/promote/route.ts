import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const promoteSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = promoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({
        success: true,
        message: "User is already an admin",
        user,
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    return NextResponse.json({
      success: true,
      message: "User promoted to ADMIN",
      user: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Promotion failed", detail: message },
      { status: 500 }
    );
  }
}
