import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ countries }, { headers: { "Cache-Control": "no-store" } });
}
