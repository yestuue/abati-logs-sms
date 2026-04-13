import type { PrismaClient } from "@prisma/client";

/** SMS services (keys align with typical 5SIM product names). Base prices are starter NGN values for the Admin panel. */
export const seedServices: { key: string; serviceKey: string; name: string; basePrice: number }[] = [
  { key: "whatsapp", serviceKey: "whatsapp", name: "WhatsApp", basePrice: 2_400 },
  { key: "telegram", serviceKey: "telegram", name: "Telegram", basePrice: 1_800 },
  { key: "instagram", serviceKey: "instagram", name: "Instagram", basePrice: 2_100 },
  { key: "google", serviceKey: "google", name: "Google", basePrice: 1_600 },
  { key: "gmail", serviceKey: "gmail", name: "Gmail", basePrice: 1_600 },
  { key: "facebook", serviceKey: "facebook", name: "Facebook", basePrice: 1_900 },
  { key: "tiktok", serviceKey: "tiktok", name: "TikTok", basePrice: 2_200 },
  { key: "discord", serviceKey: "discord", name: "Discord", basePrice: 1_700 },
  { key: "twitter", serviceKey: "twitter", name: "Twitter / X", basePrice: 2_000 },
  { key: "openai", serviceKey: "openai", name: "OpenAI", basePrice: 2_800 },
  { key: "microsoft", serviceKey: "microsoft", name: "Microsoft", basePrice: 1_750 },
  { key: "snapchat", serviceKey: "snapchat", name: "Snapchat", basePrice: 2_050 },
  { key: "uber", serviceKey: "uber", name: "Uber", basePrice: 2_300 },
  { key: "netflix", serviceKey: "netflix", name: "Netflix", basePrice: 2_500 },
];

/** Server 2 countries (slugs align with common 5SIM guest country codes). */
export const seedCountries: { slug: string; name: string; samplePrice?: number }[] = [
  { slug: "usa", name: "United States", samplePrice: 2_200 },
  { slug: "canada", name: "Canada", samplePrice: 2_000 },
  { slug: "nigeria", name: "Nigeria", samplePrice: 1_800 },
  { slug: "ghana", name: "Ghana", samplePrice: 1_700 },
  { slug: "kenya", name: "Kenya", samplePrice: 1_750 },
  { slug: "india", name: "India", samplePrice: 1_400 },
  { slug: "philippines", name: "Philippines", samplePrice: 1_350 },
  { slug: "indonesia", name: "Indonesia", samplePrice: 1_300 },
  { slug: "england", name: "United Kingdom", samplePrice: 2_100 },
  { slug: "germany", name: "Germany", samplePrice: 2_050 },
  { slug: "france", name: "France", samplePrice: 2_000 },
  { slug: "spain", name: "Spain", samplePrice: 1_950 },
  { slug: "italy", name: "Italy", samplePrice: 1_950 },
  { slug: "brazil", name: "Brazil", samplePrice: 1_600 },
  { slug: "mexico", name: "Mexico", samplePrice: 1_550 },
  { slug: "netherlands", name: "Netherlands", samplePrice: 2_000 },
  { slug: "poland", name: "Poland", samplePrice: 1_700 },
  { slug: "turkey", name: "Turkey", samplePrice: 1_500 },
  { slug: "ukraine", name: "Ukraine", samplePrice: 1_450 },
  { slug: "australia", name: "Australia", samplePrice: 2_300 },
];

const DEFAULT_PREMIUM = 0.35;

/**
 * Upsert Service and Country rows for the Admin panel (idempotent).
 * Re-runs update service `name` only (not basePrice). Country updates `name`/`server` only (not samplePrice).
 */
export async function seedAdminLists(prisma: PrismaClient): Promise<void> {
  for (const s of seedServices) {
    await prisma.service.upsert({
      where: { serviceKey: s.serviceKey },
      update: { name: s.name },
      create: {
        key: s.key,
        serviceKey: s.serviceKey,
        name: s.name,
        basePrice: s.basePrice,
        basePriceServer2: s.basePrice,
        premiumRate: DEFAULT_PREMIUM,
      },
    });
  }

  for (const c of seedCountries) {
    await prisma.country.upsert({
      where: { slug: c.slug },
      update: { name: c.name, server: "SERVER2" },
      create: {
        slug: c.slug,
        name: c.name,
        enabled: true,
        server: "SERVER2",
        samplePrice: c.samplePrice ?? 0,
      },
    });
  }
}
