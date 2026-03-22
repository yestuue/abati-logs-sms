import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST — add a single number
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { number, country, countryCode, server, priceNGN, priceUSD } = await req.json();
    if (!number || !country || !countryCode || !server) {
      return NextResponse.json(
        { error: "number, country, countryCode, and server are required" },
        { status: 400 }
      );
    }
    if (!["SERVER1", "SERVER2"].includes(server)) {
      return NextResponse.json({ error: "Invalid server" }, { status: 400 });
    }

    const existing = await prisma.virtualNumber.findUnique({ where: { number } });
    if (existing) {
      return NextResponse.json({ error: "Number already exists" }, { status: 409 });
    }

    const created = await prisma.virtualNumber.create({
      data: {
        number,
        country,
        countryCode: String(countryCode).toUpperCase(),
        server,
        priceNGN: priceNGN ? parseFloat(priceNGN) : 500,
        priceUSD: priceUSD ? parseFloat(priceUSD) : 0.5,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({ number: created });
  } catch (err) {
    console.error("[admin/numbers POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove a number by id
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const num = await prisma.virtualNumber.findUnique({ where: { id } });
    if (!num) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (num.status === "ASSIGNED") {
      return NextResponse.json({ error: "Cannot delete an assigned number" }, { status: 409 });
    }

    await prisma.virtualNumber.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/numbers DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
