import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.virtualNumber.findMany({
    where: { userId: session.user.id, status: "ASSIGNED" },
    orderBy: { assignedAt: "desc" },
    include: {
      smsMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, from: true },
      },
    },
  });

  const { checkOrder } = await import("@/lib/sms-provider");

  // Sync numbers that were assigned recently or have no SMS
  const now = new Date();
  const syncedRows = await Promise.all(
    rows.map(async (n) => {
      // If expiresAt is in the past, we should ideally mark it as EXPIRED
      if (n.expiresAt && n.expiresAt < now) {
        await prisma.virtualNumber.update({
          where: { id: n.id },
          data: { status: "EXPIRED" },
        });
        return null;
      }

      // If we already have an SMS or it's a Server 1 number (manual sync for now), or it's been more than 20 mins
      if (n.smsMessages.length > 0 || !n.providerId) {
        return n;
      }

      try {
        const status = await checkOrder(n.server, n.providerId);
        if (status && status.sms && status.sms.length > 0) {
          const latestSms = status.sms[status.sms.length - 1]!;
          // Save to DB
          const savedSms = await prisma.sMS.create({
            data: {
              body: latestSms.text,
              from: latestSms.from,
              to: n.number,
              userId: session.user.id,
              numberId: n.id,
              raw: latestSms as any,
            },
          });
          return {
            ...n,
            smsMessages: [{
              id: savedSms.id,
              body: savedSms.body,
              createdAt: savedSms.createdAt,
              from: savedSms.from
            }]
          };
        }
      } catch (err) {
        console.error(`[active-numbers sync] failed for ${n.number}:`, err);
      }
      return n;
    })
  );

  const numbers = syncedRows
    .filter((n): n is NonNullable<typeof n> => n !== null)
    .map(({ smsMessages, ...n }) => ({
      ...n,
      lastSms: smsMessages[0] ?? null,
    }));

  return NextResponse.json({ numbers });
}
