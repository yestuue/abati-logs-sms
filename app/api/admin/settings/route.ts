import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const patchSchema = z.object({
  marginPct: z.number().min(0).max(500).optional(),
  siteName: z.string().trim().min(1).max(120).optional(),
  fixedProfitNGN: z.number().min(0).optional(),
});

import { isAdmin } from "@/lib/admin-access";

async function requireAdmin() {
  const session = await auth();
  return isAdmin(session);
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
      siteName: true,
      s1Margin: true,
      s2Margin: true,
      smsGlobalPremiumRate: true,
      smsGlobalPremiumRateServer2: true,
      fixedProfitNGN: true,
    },
  });

  const s1 = settings?.s1Margin ?? (settings?.smsGlobalPremiumRate ?? 0.35) * 100;
  const s2 = settings?.s2Margin ?? (settings?.smsGlobalPremiumRateServer2 ?? 0.35) * 100;

  return NextResponse.json({
    siteName: settings?.siteName ?? "Abati Digital",
    S1_MARGIN: s1,
    S2_MARGIN: s2,
    fixedProfitNGN: settings?.fixedProfitNGN ?? 0,
  });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { premiumTarget, marginPct, fixedProfitNGN } = parsed.data;
  const settingsId = await getLatestSettingsId();
  const normalizedSiteName = parsed.data.siteName?.trim();
  
  const data: any = {
    ...(normalizedSiteName ? { siteName: normalizedSiteName } : {}),
    ...(fixedProfitNGN != null ? { fixedProfitNGN } : {}),
  };

  if (premiumTarget === "SERVER2" && marginPct != null) {
    data.s2Margin = marginPct;
    data.smsGlobalPremiumRateServer2 = marginPct / 100;
  } else if (premiumTarget === "SERVER1" && marginPct != null) {
    data.s1Margin = marginPct;
    data.smsGlobalPremiumRate = marginPct / 100;
  }

  if (settingsId) {
    await prisma.globalSettings.update({ where: { id: settingsId }, data });
  } else {
    await prisma.globalSettings.create({ data: { ...data, premiumTarget: premiumTarget || "SERVER1" } as any });
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/dashboard/buy");

  return NextResponse.json({ success: true });
}
