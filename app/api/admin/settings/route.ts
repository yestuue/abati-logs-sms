import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const patchSchema = z.object({
  premiumTarget: z.enum(["SERVER1", "SERVER2"]),
  marginPct: z.number().min(0).max(500),
});

async function requireAdmin() {
  const session = await auth();
  return !!session && session.user.role === "ADMIN";
}

async function getLatestSettingsId() {
  const row = await prisma.globalSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.globalSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      s1Margin: true,
      s2Margin: true,
      smsGlobalPremiumRate: true,
      smsGlobalPremiumRateServer2: true,
    },
  });

  const s1 = settings?.s1Margin ?? (settings?.smsGlobalPremiumRate ?? 0.35) * 100;
  const s2 = settings?.s2Margin ?? (settings?.smsGlobalPremiumRateServer2 ?? 0.35) * 100;

  return NextResponse.json({
    S1_MARGIN: s1,
    S2_MARGIN: s2,
  });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { premiumTarget, marginPct } = parsed.data;
  const settingsId = await getLatestSettingsId();
  const data =
    premiumTarget === "SERVER2"
      ? { s2Margin: marginPct, smsGlobalPremiumRateServer2: marginPct / 100 }
      : { s1Margin: marginPct, smsGlobalPremiumRate: marginPct / 100 };

  if (settingsId) {
    await prisma.globalSettings.update({ where: { id: settingsId }, data });
  } else {
    await prisma.globalSettings.create({ data });
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/dashboard/buy");

  return NextResponse.json({ success: true });
}
