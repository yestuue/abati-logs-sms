import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const countries = await prisma.country.findMany({
      where: { enabled: true },
      select: {
        id: true,
        slug: true,
        name: true,
        iso2: true,
        samplePrice: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { countries },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[numbers/countries]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
