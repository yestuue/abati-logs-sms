import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/numbers/fetch?server=SERVER1|SERVER2
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") as "SERVER1" | "SERVER2" | null;

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

  const numbers = await prisma.virtualNumber.findMany({
    where: { server, status: "AVAILABLE" },
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
