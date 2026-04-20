import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [categories, availableLogs] = await Promise.all([
    prisma.logCategory.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, price: true },
    }),
    prisma.log.findMany({
      where: { status: "AVAILABLE" },
      select: { category: true, price: true, subCategory: true },
    }),
  ]);

  const byCategory = new Map<string, { count: number; minPrice: number; rules: string | null }>();
  for (const row of availableLogs) {
    const key = row.category?.trim() || "Other";
    const prev = byCategory.get(key) ?? { count: 0, minPrice: Number.POSITIVE_INFINITY, rules: null };
    prev.count += 1;
    prev.minPrice = Math.min(prev.minPrice, Math.ceil(row.price || 0));
    if (!prev.rules && row.subCategory?.trim()) prev.rules = row.subCategory.trim();
    byCategory.set(key, prev);
  }

  const products = categories
    .map((cat) => {
      const agg = byCategory.get(cat.name) ?? { count: 0, minPrice: Math.ceil(cat.price), rules: null };
      const basePrice = Number.isFinite(agg.minPrice) ? agg.minPrice : Math.ceil(cat.price || 0);
      return {
        id: cat.id,
        category: cat.name,
        slug: slugify(cat.name),
        title: cat.name,
        description:
          cat.description?.trim() ||
          agg.rules ||
          "Do not change password or security settings for 24 hours after purchase.",
        price: Math.ceil(basePrice),
        available: agg.count,
        status: agg.count > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      };
    })
    .filter((p) => p.available > 0)
    .sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));

  return NextResponse.json({ products });
}
