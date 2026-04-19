import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["createCategory", "updateCategory", "deleteCategory", "updateItemPrice", "bulkAdjust"]),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  enabled: z.boolean().optional(),
  logId: z.string().optional(),
  percent: z.number().optional(),
});

async function isAdmin() {
  const session = await auth();
  return !!session && session.user.role === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [categories, logs] = await Promise.all([
    prisma.logCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.log.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, category: true, subCategory: true, username: true, price: true, status: true, categoryId: true, createdAt: true },
    }),
  ]);
  return NextResponse.json({ categories, logs });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const body = parsed.data;

    if (body.action === "createCategory") {
      if (!body.categoryName || typeof body.price !== "number") {
        return NextResponse.json({ error: "categoryName and price required" }, { status: 400 });
      }
      const created = await prisma.logCategory.create({
        data: {
          name: body.categoryName.trim(),
          description: body.description?.trim() || null,
          price: body.price,
          enabled: body.enabled ?? true,
        },
      });
      return NextResponse.json({ category: created });
    }

    if (body.action === "updateCategory") {
      if (!body.categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });
      const updated = await prisma.logCategory.update({
        where: { id: body.categoryId },
        data: {
          ...(body.categoryName ? { name: body.categoryName.trim() } : {}),
          ...(typeof body.description === "string" ? { description: body.description.trim() || null } : {}),
          ...(typeof body.price === "number" ? { price: body.price } : {}),
          ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
        },
      });
      return NextResponse.json({ category: updated });
    }

    if (body.action === "deleteCategory") {
      if (!body.categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });
      await prisma.$transaction([
        prisma.log.updateMany({
          where: { categoryId: body.categoryId },
          data: { categoryId: null },
        }),
        prisma.logCategory.delete({ where: { id: body.categoryId } }),
      ]);
      return NextResponse.json({ success: true });
    }

    if (body.action === "updateItemPrice") {
      if (!body.logId || typeof body.price !== "number") {
        return NextResponse.json({ error: "logId and price required" }, { status: 400 });
      }
      const updated = await prisma.log.update({
        where: { id: body.logId },
        data: { price: body.price },
      });
      return NextResponse.json({ log: updated });
    }

    const percent = body.percent ?? 0;
    const factor = 1 + percent / 100;
    if (factor <= 0) return NextResponse.json({ error: "Invalid percent" }, { status: 400 });
    await prisma.$transaction([
      prisma.logCategory.updateMany({
        data: { price: { multiply: factor } },
      }),
      prisma.log.updateMany({
        data: { price: { multiply: factor } },
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
