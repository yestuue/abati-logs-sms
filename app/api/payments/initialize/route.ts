import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeFlutterwavePayment } from "@/lib/flutterwave";
import { buyFiveSimNumber } from "@/lib/sms-provider";
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
  providerPurchase: z.boolean().optional(),
  country: z.string().optional(),
});

function normalizeInitError(message: string): { error: string; status: number } {
  if (!message) return { error: "Payment initialization failed. Please try again.", status: 500 };

  if (message.includes("Missing secret key") || message.includes("FLW_SECRET_KEY") || message.includes("FLUTTERWAVE_SECRET_KEY")) {
    return {
      error: "Payment gateway is not configured yet. Please contact support.",
      status: 500,
    };
  }

  if (message.toLowerCase().includes("invalid key") || message.toLowerCase().includes("unauthorized")) {
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

    const amount = Math.round(parsed.data.amount);
    const { type, numberId, carrier: carrierRaw, areaCodes: areaCodesRaw, serviceKey } = parsed.data;
    const userId = session.user.id;
    const email = session.user.email;

    // ── NUMBER_PURCHASE: debit wallet directly ──────────────────
    if (type === "NUMBER_PURCHASE" && (numberId || (parsed.data.providerPurchase && serviceKey))) {
      const { providerPurchase, country: countrySlug } = parsed.data;
      
      let targetNumber: { 
        id: string; 
        number: string; 
        priceNGN: number; 
        priceUSD: number; 
        server: "SERVER1" | "SERVER2"; 
        country: string;
        dialCode: string;
      } | null = null;

      if (numberId) {
        const row = await prisma.virtualNumber.findUnique({ where: { id: numberId, status: "AVAILABLE" } });
        if (row) {
          targetNumber = {
            id: row.id,
            number: row.number,
            priceNGN: row.priceNGN,
            priceUSD: row.priceUSD,
            server: row.server as "SERVER1" | "SERVER2",
            country: row.country,
            dialCode: row.dialCode || "",
          };
        }
      } else if (providerPurchase && serviceKey) {
        const svc = await prisma.service.findUnique({
          where: { serviceKey },
          select: { basePrice: true, basePriceServer2: true, customPrice: true, premiumRate: true }
        });
        
        targetNumber = {
          id: "TEMP_PROVIDER",
          number: "Pending...",
          priceNGN: svc?.basePriceServer2 ?? svc?.basePrice ?? (amount / 1.35),
          priceUSD: (svc?.basePriceServer2 ?? svc?.basePrice ?? (amount / 1.35)) / 1550,
          server: "SERVER2",
          country: countrySlug || "any",
          dialCode: "",
        };
      }

      if (!targetNumber) {
        return NextResponse.json({ error: "Number or service not available" }, { status: 400 });
      }

      const carrier = normalizePurchaseCarrier(carrierRaw);
      const areaCodes = areaCodesRaw ?? "";
      const settings = await prisma.globalSettings.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { smsGlobalPremiumRate: true, smsGlobalPremiumRateServer2: true, s1Margin: true, s2Margin: true },
      });
      
      const premiumRate = targetNumber.server === "SERVER2"
        ? (settings?.s2Margin != null ? settings.s2Margin / 100 : (settings?.smsGlobalPremiumRateServer2 ?? 0.35))
        : (settings?.s1Margin != null ? settings.s1Margin / 100 : (settings?.smsGlobalPremiumRate ?? 0.35));

      let chargeBase = targetNumber.priceNGN;
      if (serviceKey) {
        const svc = await prisma.service.findUnique({
          where: { serviceKey },
          select: { customPrice: true, basePrice: true, basePriceServer2: true },
        });
        if (svc?.customPrice != null) {
          chargeBase = Math.round(svc.customPrice);
        } else if (targetNumber.server === "SERVER2" && svc?.basePriceServer2 != null) {
          chargeBase = Math.round(svc.basePriceServer2);
        }
      }

      const chargeNGN = finalNumberPurchasePriceNGN(chargeBase, {
        server: targetNumber.server,
        carrier,
        areaCodesRaw: areaCodes,
        premiumRate,
      });

      if (Math.round(amount) !== chargeNGN) {
        return NextResponse.json(
          { error: `Price mismatch (Expected ₦${chargeNGN}, Got ₦${Math.round(amount)}). Refresh and try again.` },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      if ((user?.walletBalance ?? 0) < chargeNGN) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      let finalNumberId = targetNumber.id;
      let finalNumberStr = targetNumber.number;

      if (providerPurchase && serviceKey) {
        const country = countrySlug || "usa";
        const operator = "any";
        const product = serviceKey;
        
        const activation = await buyFiveSimNumber(country, operator, product);
        if (!activation || !activation.phone) {
          return NextResponse.json({ error: "Failed to get number from provider. Try again later." }, { status: 502 });
        }
        
        const expiresAt = activation.expires ? new Date(activation.expires) : new Date(Date.now() + 20 * 60 * 1000);
        const newNum = await prisma.virtualNumber.create({
          data: {
            number: activation.phone,
            providerId: String(activation.id),
            server: "SERVER2",
            status: "ASSIGNED",
            userId,
            assignedAt: new Date(),
            expiresAt,
            country: country,
            countryCode: country,
            priceNGN: chargeBase,
            priceUSD: chargeBase / 1550,
          }
        });
        finalNumberId = newNum.id;
        finalNumberStr = newNum.number;
      }

      const reference = generateReference();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (dbtx) => {
        await dbtx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: chargeNGN } },
        });
        
        if (!providerPurchase) {
          await dbtx.virtualNumber.update({
            where: { id: finalNumberId },
            data: { status: "ASSIGNED", userId, assignedAt: new Date(), expiresAt },
          });
        }
        
        await dbtx.transaction.create({
          data: {
            userId,
            amount: chargeNGN,
            currency: "NGN",
            reference,
            status: "SUCCESS",
            type: "NUMBER_PURCHASE",
            server: targetNumber!.server,
            numberId: finalNumberId,
            metadata: {
              carrier,
              areaCodes,
              basePriceNGN: targetNumber!.priceNGN,
              chargeBaseNGN: chargeBase,
              premiumRate,
              serviceKey: serviceKey ?? null,
              providerPurchase: providerPurchase ?? false,
            },
          },
        });
        await grantReferralPurchaseCommissionInTx(dbtx, userId, chargeNGN);
      });

      return NextResponse.json({ success: true, number: finalNumberStr, expiresAt });
    }

    // ── WALLET_TOPUP: initialize Flutterwave transaction ─────────────────────────
    const reference = generateReference();
    // Use the verify endpoint as callback so we can check status on redirect
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`;

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


