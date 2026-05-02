import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z
  .object({
    serviceId: z.string().min(1).optional(),
    countrySlug: z.string().min(1).optional(),
    basePrice: z.number().positive().optional(),
    basePriceServer2: z.number().positive().optional(),
  })
  .refine(
    (d) =>
      Boolean(d.serviceId && !d.countrySlug) || Boolean(!d.serviceId && d.countrySlug),
    { message: "Send exactly one of serviceId or countrySlug" }
  );

import { isAdmin } from "@/lib/admin-access";

/**
 * POST /api/admin/pricing/update — update one Service base prices or one Country.samplePrice (admin only).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { serviceId, countrySlug, basePrice, basePriceServer2 } = parsed.data;

    if (serviceId) {
      if (typeof basePrice !== "number" && typeof basePriceServer2 !== "number") {
        return NextResponse.json(
          { error: "Provide basePrice and/or basePriceServer2 for service updates" },
          { status: 400 }
        );
      }
      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: {
          ...(typeof basePrice === "number" ? { basePrice } : {}),
          ...(typeof basePriceServer2 === "number" ? { basePriceServer2 } : {}),
        },
      });
      return NextResponse.json({ service: updated });
    }

    if (typeof basePrice !== "number") {
      return NextResponse.json(
        { error: "basePrice is required for country updates (stored as samplePrice)" },
        { status: 400 }
      );
    }
    const existing = await prisma.country.findUnique({ where: { slug: countrySlug! } });
    if (!existing) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }
    const updated = await prisma.country.update({
      where: { slug: countrySlug! },
      data: { samplePrice: Math.round(basePrice) },
    });
    return NextResponse.json({ country: updated });
  } catch (e) {
    console.error("[admin/pricing/update]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
