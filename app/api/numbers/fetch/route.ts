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
  if (q.length >= 2) {
    where.OR = [
      { country: { contains: q, mode: "insensitive" } },
      { number: { contains: q } },
      { countryCode: { contains: q, mode: "insensitive" } },
    ];
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
