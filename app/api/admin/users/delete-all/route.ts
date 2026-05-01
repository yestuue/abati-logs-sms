import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { confirmation?: string };
  if (body.confirmation !== "DELETE ALL") {
    return NextResponse.json({ error: "Confirmation text mismatch" }, { status: 400 });
  }

  const usersToDelete = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: { id: true },
  });
  const ids = usersToDelete.map((u) => u.id);

  if (ids.length === 0) {
    return NextResponse.json({ success: true, deletedUsers: 0 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.virtualNumber.updateMany({
      where: { userId: { in: ids } },
      data: { userId: null, status: "AVAILABLE", assignedAt: null, expiresAt: null },
    });
    await tx.sMS.deleteMany({ where: { userId: { in: ids } } });
    await tx.transaction.deleteMany({ where: { userId: { in: ids } } });
    await tx.account.deleteMany({ where: { userId: { in: ids } } });
    await tx.session.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: ids } } });
  });

  return NextResponse.json({ success: true, deletedUsers: ids.length });
}
