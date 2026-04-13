import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const batchSchema = z
  .object({
    services: z
      .array(
        z
          .object({
            serviceId: z.string().min(1),
            basePrice: z.number().positive().optional(),
            basePriceServer2: z.number().positive().optional(),
          })
          .refine((row) => typeof row.basePrice === "number" || typeof row.basePriceServer2 === "number", {
            message: "Each service row must include basePrice and/or basePriceServer2",
          })
      )
      .optional()
      .default([]),
    countries: z
      .array(
        z.object({
          countrySlug: z.string().min(1),
          basePrice: z.number().positive(),
        })
      )
      .optional()
      .default([]),
  })
  .refine((d) => d.services.length + d.countries.length > 0, {
    message: "At least one service or country update is required",
  });

/**
 * POST /api/admin/pricing/batch — apply multiple service and/or country base prices in one transaction.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = batchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { services, countries } = parsed.data;

    await prisma.$transaction([
      ...services.map((s) =>
        prisma.service.update({
          where: { id: s.serviceId },
          data: {
            ...(typeof s.basePrice === "number" ? { basePrice: s.basePrice } : {}),
            ...(typeof s.basePriceServer2 === "number"
              ? { basePriceServer2: s.basePriceServer2 }
              : {}),
          },
        })
      ),
      ...countries.map((c) =>
        prisma.country.update({
          where: { slug: c.countrySlug },
          data: { basePrice: c.basePrice },
        })
      ),
    ]);

    const [serviceRows, countryRows] = await Promise.all([
      services.length
        ? prisma.service.findMany({
            where: { id: { in: services.map((s) => s.serviceId) } },
          })
        : Promise.resolve([]),
      countries.length
        ? prisma.country.findMany({
            where: { slug: { in: countries.map((c) => c.countrySlug) } },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      updatedServices: serviceRows.length,
      updatedCountries: countryRows.length,
      services: serviceRows,
      countries: countryRows,
    });
  } catch (e) {
    console.error("[admin/pricing/batch]", e);
    return NextResponse.json({ error: "Batch update failed" }, { status: 500 });
  }
}
