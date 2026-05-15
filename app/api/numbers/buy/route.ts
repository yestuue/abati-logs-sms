import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSmsDisplayPriceNgn } from "@/lib/sms-provider";
import { finalNumberPurchasePriceNGN } from "@/lib/number-purchase-price";
import { generateReference } from "@/lib/utils";
import { getGlobalSmsPremiumRateForServer } from "@/lib/price-calculator";
import { grantReferralPurchaseCommissionInTx } from "@/lib/referral-reward";
import { getActiveProvider } from "@/lib/sms-providers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { service, country, operator, server } = body;

    if (!service || !country || !operator || !server) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = session.user.id;

    // Fetch service for price check
    const svc = await prisma.service.findUnique({
      where: { serviceKey: service },
    });

    // We need to get the latest 5sim price for this specific operator to ensure we don't undercharge
    // But for now, we'll use the price passed or calculate it based on 5sim-provider logic
    // Actually, it's better to calculate it here.
    
    // For simplicity, let's assume the frontend sends the expected price and we verify it.
    // Or better: we fetch the price again here to be safe.
    
    // [Implementation detail: In a production app, you'd re-verify the price from 5sim here]
    
    // For now, let's use the logic from initialize route but adapted
    const settings = await prisma.globalSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const premiumRate = await getGlobalSmsPremiumRateForServer(server);
    const fixedProfitNGN = settings?.fixedProfitNGN ?? 0;
    const exchangeRate = settings?.rateNGN ?? Number(process.env.SMS_EXCHANGE_RATE ?? "1550");

    // Get the correct provider for this server
    const provider = await getActiveProvider(server);

    let providerCountry = country;
    if (server === "SERVER2") {
      const countryRecord = await prisma.country.findFirst({
        where: { slug: country, enabled: true },
      });
      if (countryRecord?.iso2) {
        providerCountry = countryRecord.iso2;
      }
    }
    
    // Buy number from provider
    const { data: activation, error: buyError } = await provider.buyNumber(providerCountry, operator, service);
    if (buyError || !activation || !activation.phone) {
      const msg = buyError || "Gateway Error: No number returned";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // Calculate final price based on the actual cost from provider
    const basePriceNGN = computeSmsDisplayPriceNgn(activation.price, exchangeRate);
    const chargeNGN = Math.ceil(basePriceNGN * (1 + premiumRate) + fixedProfitNGN);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
    if ((user?.walletBalance ?? 0) < chargeNGN) {
      // If insufficient, we should try to cancel the order
      await provider.cancelOrder(String(activation.id));
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    const expiresAt = activation.expires ? new Date(activation.expires) : new Date(Date.now() + 20 * 60 * 1000);
    const reference = generateReference();

    const result = await prisma.$transaction(async (dbtx) => {
      // Deduct balance
      await dbtx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: chargeNGN } },
      });

      // Create VirtualNumber record
      const newNum = await dbtx.virtualNumber.create({
        data: {
          number: activation.phone,
          providerId: String(activation.id),
          orderId: String(activation.id),
          operator: activation.operator,
          server: server,
          status: "ASSIGNED",
          userId,
          assignedAt: new Date(),
          expiresAt,
          country: country,
          countryCode: country,
          priceNGN: chargeNGN,
          priceUSD: activation.price,
        }
      });

      // Create Transaction record
      await dbtx.transaction.create({
        data: {
          userId,
          amount: chargeNGN,
          currency: "NGN",
          reference,
          status: "SUCCESS",
          type: "NUMBER_PURCHASE",
          server: server,
          numberId: newNum.id,
          metadata: {
            operator,
            service,
            country,
            orderId: activation.id,
          },
        },
      });

      await grantReferralPurchaseCommissionInTx(dbtx, userId, chargeNGN);
      
      return newNum;
    });

    return NextResponse.json({ 
      success: true, 
      orderId: activation.id, 
      number: activation.phone, 
      expiresAt: result.expiresAt 
    });

  } catch (err) {
    console.error("[buy] Error:", err);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
