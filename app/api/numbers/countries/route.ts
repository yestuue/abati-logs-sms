import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fiveSimFetch, getFiveSimApiBase } from "@/lib/sms-provider";

type GuestCountry = {
  text_en?: string;
  iso?: Record<string, number>;
};

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIVE_SIM_API_KEY) {
    return NextResponse.json(
      { error: "FIVE_SIM_API_KEY not configured" },
      { status: 503 }
    );
  }

  const url = `${getFiveSimApiBase()}/guest/countries`;

  try {
    const res = await fiveSimFetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to load countries" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as Record<string, GuestCountry>;
    const [disabledRows, dbCountries] = await Promise.all([
      prisma.country.findMany({ where: { enabled: false }, select: { slug: true } }),
      prisma.country.findMany({ select: { id: true, slug: true, name: true } }),
    ]);
    const disabled = new Set(disabledRows.map((c) => c.slug));
    const dbBySlug = new Map(dbCountries.map((c) => [c.slug, c]));

    const countries = Object.entries(data)
      .filter(([slug]) => !disabled.has(slug))
      .map(([slug, v]) => {
        const row = dbBySlug.get(slug);
        const isoFromProvider = v?.iso ? Object.keys(v.iso)[0]?.toUpperCase() ?? null : null;
        return {
          id: row?.id ?? slug,
          slug,
          name: row?.name ?? (typeof v?.text_en === "string" ? v.text_en : slug),
          iso2: isoFromProvider,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en"));

    return NextResponse.json(
      { countries },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[numbers/countries]", e);
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
