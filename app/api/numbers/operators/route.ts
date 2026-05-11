import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { computeSmsDisplayPriceNgn } from "@/lib/sms-provider";
import { prisma } from "@/lib/prisma";
import { getGlobalSmsPremiumRateForServer } from "@/lib/price-calculator";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service");
  const country = searchParams.get("country") || "usa";
  const server = (searchParams.get("server") || "SERVER1").toUpperCase() as "SERVER1" | "SERVER2";

  if (!service) {
    return NextResponse.json({ error: "Service is required" }, { status: 400 });
  }

  try {
    const settings = await prisma.globalSettings.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { smsGlobalPremiumRate: true, smsGlobalPremiumRateServer2: true, s1Margin: true, s2Margin: true, fixedProfitNGN: true, rateNGN: true },
    });

    const { getProvider } = await import("@/lib/sms-providers");
    const provider = getProvider(server);
    const operatorsData = await provider.getPrices(service, country);
    
    const globalPremiumRate = await getGlobalSmsPremiumRateForServer(server);
    const fixedProfitNGN = settings?.fixedProfitNGN ?? 0;
    const exchangeRate = settings?.rateNGN ?? Number(process.env.SMS_EXCHANGE_RATE ?? "1550");

    const operators = Object.entries(operatorsData).map(([name, info]) => {
      const basePriceNGN = computeSmsDisplayPriceNgn(info.cost, exchangeRate);
      // Final price including premium and profit
      const finalPriceNGN = Math.ceil(basePriceNGN * (1 + globalPremiumRate) + fixedProfitNGN);
      
      return {
        name,
        cost: info.cost,
        count: info.count,
        rate: info.rate, // Success rate
        priceNGN: finalPriceNGN,
      };
    }).sort((a, b) => b.rate - a.rate); // Sort by success rate

    return NextResponse.json({ operators });
  } catch (error) {
    console.error("[operators] Error fetching operators:", error);
    return NextResponse.json({ error: "Failed to fetch operators" }, { status: 500 });
  }
}
