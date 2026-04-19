import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function toPreviewUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v.replace(/^@/, "")}`;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const categories = await prisma.logCategory.findMany({
    where: { enabled: true },
    select: { name: true },
  });
  const category = categories.find((c) => slugify(c.name) === slug);
  if (!category) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const logs = await prisma.log.findMany({
    where: { status: "AVAILABLE", category: category.name },
    orderBy: { createdAt: "asc" },
    take: 120,
    select: { id: true, username: true, email: true, twoFA: true, price: true },
  });

  const items = logs.map((l) => {
    const source = l.username || l.email || l.twoFA || "";
    return {
      id: l.id,
      data: source,
      url: toPreviewUrl(source),
      price: Math.ceil(l.price || 0),
    };
  });

  return NextResponse.json({ category: category.name, available: items.length, items });
}
