import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  server: z.enum(["SERVER1", "SERVER2"]),
  isEnabled: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { server, isEnabled } = parsed.data;

    const config = await prisma.serverConfig.upsert({
      where: { server },
      update: { isEnabled },
      create: {
        server,
        name: server === "SERVER1" ? "Server 1 — USA Numbers" : "Server 2 — Global Numbers",
        isEnabled,
      },
    });

    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await prisma.serverConfig.findMany({ orderBy: { server: "asc" } });
  return NextResponse.json({ configs });
}
