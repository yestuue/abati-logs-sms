import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.virtualNumber.findMany({
    where: { userId: session.user.id, status: "ASSIGNED" },
    orderBy: { assignedAt: "desc" },
    include: {
      smsMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, from: true },
      },
    },
  });

  const numbers = rows.map(({ smsMessages, ...n }) => ({
    ...n,
    lastSms: smsMessages[0] ?? null,
  }));

  return NextResponse.json({ numbers });
}
