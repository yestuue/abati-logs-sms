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
export const seedCountries: { slug: string; name: string; basePrice?: number }[] = [
  { slug: "usa", name: "United States", basePrice: 2_200 },
  { slug: "canada", name: "Canada", basePrice: 2_000 },
  { slug: "nigeria", name: "Nigeria", basePrice: 1_800 },
  { slug: "ghana", name: "Ghana", basePrice: 1_700 },
  { slug: "kenya", name: "Kenya", basePrice: 1_750 },
  { slug: "india", name: "India", basePrice: 1_400 },
  { slug: "philippines", name: "Philippines", basePrice: 1_350 },
  { slug: "indonesia", name: "Indonesia", basePrice: 1_300 },
  { slug: "england", name: "United Kingdom", basePrice: 2_100 },
  { slug: "germany", name: "Germany", basePrice: 2_050 },
  { slug: "france", name: "France", basePrice: 2_000 },
  { slug: "spain", name: "Spain", basePrice: 1_950 },
  { slug: "italy", name: "Italy", basePrice: 1_950 },
  { slug: "brazil", name: "Brazil", basePrice: 1_600 },
  { slug: "mexico", name: "Mexico", basePrice: 1_550 },
  { slug: "netherlands", name: "Netherlands", basePrice: 2_000 },
  { slug: "poland", name: "Poland", basePrice: 1_700 },
  { slug: "turkey", name: "Turkey", basePrice: 1_500 },
  { slug: "ukraine", name: "Ukraine", basePrice: 1_450 },
  { slug: "australia", name: "Australia", basePrice: 2_300 },
];

const DEFAULT_PREMIUM = 0.35;

/**
 * Upsert Service and Country rows for the Admin panel (idempotent).
 * Re-runs update service `name` only (not basePrice). Country updates `name` only.
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
      update: { name: c.name },
      create: {
        slug: c.slug,
        name: c.name,
        enabled: true,
        basePrice: c.basePrice ?? null,
      },
    });
  }
}
