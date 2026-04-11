import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  serviceId: z.string().min(1),
  basePrice: z.number().positive(),
});

/**
 * POST /api/admin/pricing/update — update one Service row's catalog basePrice (admin only).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { serviceId, basePrice } = parsed.data;
    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { basePrice },
    });

    return NextResponse.json({ service: updated });
  } catch (e) {
    console.error("[admin/pricing/update]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
