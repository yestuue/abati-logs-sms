import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeFlutterwavePayment } from "@/lib/flutterwave";
import { finalNumberPurchasePriceNGN, normalizePurchaseCarrier } from "@/lib/number-purchase-price";
import { generateReference } from "@/lib/utils";
import { grantReferralPurchaseCommissionInTx } from "@/lib/referral-reward";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["WALLET_TOPUP", "NUMBER_PURCHASE"]),
  amount: z.number().positive(),
  numberId: z.string().optional(),
  carrier: z.enum(["any", "att", "tmobile"]).optional(),
  areaCodes: z.string().max(200).optional(),
  /** When provided, per-service customPrice / premiumRate apply to the charge calculation. */
  serviceKey: z.string().max(120).optional(),
});

function normalizeInitError(message: string): { error: string; status: number } {
  if (!message) return { error: "Payment initialization failed. Please try again.", status: 500 };

  if (message.includes("Missing secret key") || message.includes("FLUTTERWAVE_SECRET_KEY") || message.includes("FLW_SECRET_KEY")) {
    return {
      error: "Payment gateway is not configured yet. Please contact support.",
      status: 500,
    };
  }

  if (message.toLowerCase().includes("invalid key")) {
    return { error: "Payment gateway key is invalid. Please contact support.", status: 502 };
  }

  return { error: "Payment initialization failed. Please try again.", status: 500 };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { type, amount, numberId, carrier: carrierRaw, areaCodes: areaCodesRaw, serviceKey } = parsed.data;
    const userId = session.user.id;
    const email = session.user.email;

    // ── NUMBER_PURCHASE: debit wallet directly ──────────────────
    if (type === "NUMBER_PURCHASE" && numberId) {
      const [user, number] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } }),
        prisma.virtualNumber.findUnique({ where: { id: numberId, status: "AVAILABLE" } }),
      ]);

      if (!number) {
        return NextResponse.json({ error: "Number not available" }, { status: 400 });
      }

      const carrier = normalizePurchaseCarrier(carrierRaw);
      const areaCodes = areaCodesRaw ?? "";
      const settings = await prisma.globalSettings.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { smsGlobalPremiumRate: true, smsGlobalPremiumRateServer2: true },
      });
      const premiumRate =
        number.server === "SERVER2"
          ? (settings?.smsGlobalPremiumRateServer2 ?? 0.35)
          : (settings?.smsGlobalPremiumRate ?? 0.35);

      let chargeBase = number.priceNGN;
      if (serviceKey) {
        const svc = await prisma.service.findUnique({
          where: { serviceKey },
          select: { customPrice: true, basePrice: true },
        });
        if (svc?.customPrice != null) {
          chargeBase = Math.round(svc.customPrice);
        }
      }

      const chargeNGN = finalNumberPurchasePriceNGN(chargeBase, {
        server: number.server,
        carrier,
        areaCodesRaw: areaCodes,
        premiumRate,
      });

      if (Math.round(amount) !== chargeNGN) {
        return NextResponse.json(
          { error: "Price mismatch. Refresh and try again." },
          { status: 400 }
        );
      }

      if ((user?.walletBalance ?? 0) < chargeNGN) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      const reference = generateReference();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (dbtx) => {
        await dbtx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: chargeNGN } },
        });
        await dbtx.virtualNumber.update({
          where: { id: numberId },
          data: { status: "ASSIGNED", userId, assignedAt: new Date(), expiresAt },
        });
        await dbtx.transaction.create({
          data: {
            userId,
            amount: chargeNGN,
            currency: "NGN",
            reference,
            status: "SUCCESS",
            type: "NUMBER_PURCHASE",
            server: number.server,
            numberId,
            metadata: {
              carrier,
              areaCodes,
              basePriceNGN: number.priceNGN,
              chargeBaseNGN: chargeBase,
              premiumRate,
              serviceKey: serviceKey ?? null,
            },
          },
        });
        await grantReferralPurchaseCommissionInTx(dbtx, userId, chargeNGN);
      });

      return NextResponse.json({ success: true, number: number.number, expiresAt });
    }

    // ── WALLET_TOPUP: initialize Flutterwave transaction ─────────────────────────
    const reference = generateReference();

    // Flutterwave uses the actual amount, not kobo/cents
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`;

    const paymentRes = await initializeFlutterwavePayment({
      tx_ref: reference,
      amount: amount,
      currency: "NGN",
      redirect_url: callbackUrl,
      customer: {
        email: email,
        name: session.user.name || email.split("@")[0],
      },
      customizations: {
        title: process.env.NEXT_PUBLIC_APP_NAME || "Wallet Topup",
        description: `Funding wallet with ₦${amount.toLocaleString()}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
    });

    if (paymentRes.status !== "success") {
      console.error("[payments/initialize] Flutterwave rejected:", paymentRes.message);
      return NextResponse.json(
        { error: "Payment initialization failed", detail: paymentRes.message },
        { status: 502 }
      );
    }

    await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: "NGN",
        reference,
        status: "PENDING",
        type: "WALLET_TOPUP",
        metadata: {
          provider: "Flutterwave",
        },
      },
    });

    return NextResponse.json({ url: paymentRes.data.link, reference });
  } catch (err) {
    const error = err as { response?: { data?: unknown }; message?: string };
    const message = error.message ?? "";
    const normalized = normalizeInitError(message);
    console.error("PAYMENT_INIT_ERROR:", error.response?.data || message || err);
    return NextResponse.json(
      { error: normalized.error, detail: message || undefined },
      { status: normalized.status }
    );
  }
}

