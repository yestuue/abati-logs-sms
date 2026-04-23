import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const request = await prisma.manualFundingRequest.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Funding request not found" }, { status: 404 });
  }

  if (request.status === "PENDING") {
    await prisma.manualFundingRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  await prisma.manualFundingRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
