import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z
  .object({
    serviceId: z.string().min(1).optional(),
    countrySlug: z.string().min(1).optional(),
    basePrice: z.number().positive(),
  })
  .refine(
    (d) =>
      Boolean(d.serviceId && !d.countrySlug) || Boolean(!d.serviceId && d.countrySlug),
    { message: "Send exactly one of serviceId or countrySlug" }
  );

/**
 * POST /api/admin/pricing/update — update one Service.basePrice or one Country.basePrice (admin only).
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

    const { serviceId, countrySlug, basePrice } = parsed.data;

    if (serviceId) {
      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: { basePrice },
      });
      return NextResponse.json({ service: updated });
    }

    const existing = await prisma.country.findUnique({ where: { slug: countrySlug! } });
    if (!existing) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }
    const updated = await prisma.country.update({
      where: { slug: countrySlug! },
      data: { basePrice },
    });
    return NextResponse.json({ country: updated });
  } catch (e) {
    console.error("[admin/pricing/update]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
