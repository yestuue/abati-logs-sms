import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  basePrice: z.number().positive(),
  premiumRate: z.number().min(0).max(5),
  serviceName: z.string().min(1).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        basePrice: parsed.data.basePrice,
        premiumRate: parsed.data.premiumRate,
        ...(parsed.data.serviceName ? { name: parsed.data.serviceName } : {}),
      },
    });

    return NextResponse.json({ service: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
