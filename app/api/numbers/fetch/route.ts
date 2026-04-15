import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { normalizeServiceSearchQuery } from "@/lib/utils";

// GET /api/numbers/fetch?server=SERVER1|SERVER2&q=optional filter
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") as "SERVER1" | "SERVER2" | null;
  const q = normalizeServiceSearchQuery(searchParams.get("q") ?? "");
  const country = normalizeServiceSearchQuery(searchParams.get("country") ?? "");
  const countryIdParam = searchParams.get("countryId")?.trim();

  if (!server || !["SERVER1", "SERVER2"].includes(server)) {
    return NextResponse.json(
      { error: "server must be SERVER1 or SERVER2" },
      { status: 400 }
    );
  }

  // Check if server is online
  const config = await prisma.serverConfig.findUnique({ where: { server } });
  if (config && !config.isEnabled) {
    return NextResponse.json({
      numbers: [],
      serverOffline: true,
      message: `${server === "SERVER1" ? "Server 1 (USA)" : "Server 2 (Global)"} is currently offline`,
    });
  }

  const where: Prisma.VirtualNumberWhereInput = { server, status: "AVAILABLE" };
  if (server === "SERVER2") {
    const countryTerms = new Set<string>();
    if (country.length >= 2) countryTerms.add(country);

    if (countryIdParam) {
      const row = await prisma.country.findFirst({
        where: { OR: [{ id: countryIdParam }, { slug: countryIdParam }] },
        select: { slug: true, name: true },
      });
      if (row) {
        countryTerms.add(normalizeServiceSearchQuery(row.slug));
        countryTerms.add(normalizeServiceSearchQuery(row.name));
      }
    }

    if (countryTerms.size > 0) {
      where.OR = [
        ...Array.from(countryTerms).map((term) => ({
          country: { contains: term, mode: "insensitive" as const },
        })),
        ...Array.from(countryTerms).map((term) => ({
          countryCode: { contains: term, mode: "insensitive" as const },
        })),
      ];
    }
  }
  if (q.length >= 2) {
    const baseOr: Prisma.VirtualNumberWhereInput[] = [
      { country: { contains: q, mode: "insensitive" } },
      { number: { contains: q } },
      { countryCode: { contains: q, mode: "insensitive" } },
    ];
    if (where.OR && Array.isArray(where.OR)) {
      where.AND = [{ OR: where.OR }, { OR: baseOr }];
      delete where.OR;
    } else {
      where.OR = baseOr;
    }
  }

  const numbers = await prisma.virtualNumber.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      number: true,
      country: true,
      countryCode: true,
      dialCode: true,
      server: true,
      priceNGN: true,
      priceUSD: true,
    },
  });

  return NextResponse.json({ numbers, server, total: numbers.length });
}
