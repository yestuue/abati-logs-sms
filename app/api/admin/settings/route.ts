import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const patchSchema = z.object({
  premiumTarget: z.enum(["SERVER1", "SERVER2"]),
  marginPct: z.number().min(0).max(500),
  siteName: z.string().trim().min(1).max(120).optional(),
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
    },
  });

  const s1 = settings?.s1Margin ?? (settings?.smsGlobalPremiumRate ?? 0.35) * 100;
  const s2 = settings?.s2Margin ?? (settings?.smsGlobalPremiumRateServer2 ?? 0.35) * 100;

  return NextResponse.json({
    siteName: settings?.siteName ?? "Abati Digital",
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
  const normalizedSiteName = parsed.data.siteName?.trim();
  const data =
    premiumTarget === "SERVER2"
      ? {
          s2Margin: marginPct,
          smsGlobalPremiumRateServer2: marginPct / 100,
          ...(normalizedSiteName ? { siteName: normalizedSiteName } : {}),
        }
      : {
          s1Margin: marginPct,
          smsGlobalPremiumRate: marginPct / 100,
          ...(normalizedSiteName ? { siteName: normalizedSiteName } : {}),
        };

  if (settingsId) {
    await prisma.globalSettings.update({ where: { id: settingsId }, data });
  } else {
    await prisma.globalSettings.create({ data });
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/dashboard/buy");

  return NextResponse.json({ success: true });
}
