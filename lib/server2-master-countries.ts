import type { PrismaClient } from "@prisma/client";
import {
  computeSmsDisplayPriceNgn,
  fiveSimFetch,
  getFiveSimApiBase,
} from "@/lib/sms-provider";

/** Canonical slug for Australia (5SIM + master list). */
export const SERVER2_AUSTRALIA_SLUG = "australia";

const SERVER2 = "SERVER2";

export type Server2MasterCountry = { slug: string; name: string };

/** Master catalog: AU/US/UK/CA plus broad EU/Asia/Africa/LatAm (5SIM-style slugs). */
const MASTER_PAIRS: [string, string][] = [
  ["australia", "Australia"],
  ["usa", "United States"],
  ["canada", "Canada"],
  ["england", "United Kingdom"],
  ["france", "France"],
  ["germany", "Germany"],
  ["spain", "Spain"],
  ["italy", "Italy"],
  ["netherlands", "Netherlands"],
  ["belgium", "Belgium"],
  ["portugal", "Portugal"],
  ["poland", "Poland"],
  ["sweden", "Sweden"],
  ["norway", "Norway"],
  ["denmark", "Denmark"],
  ["finland", "Finland"],
  ["ireland", "Ireland"],
  ["austria", "Austria"],
  ["switzerland", "Switzerland"],
  ["czech", "Czech Republic"],
  ["hungary", "Hungary"],
  ["romania", "Romania"],
  ["greece", "Greece"],
  ["bulgaria", "Bulgaria"],
  ["croatia", "Croatia"],
  ["slovakia", "Slovakia"],
  ["slovenia", "Slovenia"],
  ["serbia", "Serbia"],
  ["bosnia", "Bosnia and Herzegovina"],
  ["albania", "Albania"],
  ["northmacedonia", "North Macedonia"],
  ["estonia", "Estonia"],
  ["latvia", "Latvia"],
  ["lithuania", "Lithuania"],
  ["luxembourg", "Luxembourg"],
  ["malta", "Malta"],
  ["cyprus", "Cyprus"],
  ["iceland", "Iceland"],
  ["moldova", "Moldova"],
  ["ukraine", "Ukraine"],
  ["russia", "Russia"],
  ["belarus", "Belarus"],
  ["turkey", "Turkey"],
  ["israel", "Israel"],
  ["uae", "United Arab Emirates"],
  ["saudi", "Saudi Arabia"],
  ["kuwait", "Kuwait"],
  ["qatar", "Qatar"],
  ["bahrain", "Bahrain"],
  ["oman", "Oman"],
  ["jordan", "Jordan"],
  ["lebanon", "Lebanon"],
  ["iraq", "Iraq"],
  ["iran", "Iran"],
  ["egypt", "Egypt"],
  ["morocco", "Morocco"],
  ["algeria", "Algeria"],
  ["tunisia", "Tunisia"],
  ["southafrica", "South Africa"],
  ["nigeria", "Nigeria"],
  ["ghana", "Ghana"],
  ["kenya", "Kenya"],
  ["uganda", "Uganda"],
  ["tanzania", "Tanzania"],
  ["ethiopia", "Ethiopia"],
  ["rwanda", "Rwanda"],
  ["zambia", "Zambia"],
  ["zimbabwe", "Zimbabwe"],
  ["mozambique", "Mozambique"],
  ["angola", "Angola"],
  ["cameroon", "Cameroon"],
  ["ivorycoast", "Côte d'Ivoire"],
  ["senegal", "Senegal"],
  ["india", "India"],
  ["pakistan", "Pakistan"],
  ["bangladesh", "Bangladesh"],
  ["srilanka", "Sri Lanka"],
  ["nepal", "Nepal"],
  ["indonesia", "Indonesia"],
  ["philippines", "Philippines"],
  ["thailand", "Thailand"],
  ["vietnam", "Vietnam"],
  ["malaysia", "Malaysia"],
  ["singapore", "Singapore"],
  ["japan", "Japan"],
  ["southkorea", "South Korea"],
  ["china", "China"],
  ["hongkong", "Hong Kong"],
  ["taiwan", "Taiwan"],
  ["newzealand", "New Zealand"],
  ["kazakhstan", "Kazakhstan"],
  ["uzbekistan", "Uzbekistan"],
  ["kyrgyzstan", "Kyrgyzstan"],
  ["tajikistan", "Tajikistan"],
  ["mongolia", "Mongolia"],
  ["myanmar", "Myanmar"],
  ["cambodia", "Cambodia"],
  ["laos", "Laos"],
  ["afghanistan", "Afghanistan"],
  ["brazil", "Brazil"],
  ["mexico", "Mexico"],
  ["argentina", "Argentina"],
  ["chile", "Chile"],
  ["colombia", "Colombia"],
  ["peru", "Peru"],
  ["venezuela", "Venezuela"],
  ["ecuador", "Ecuador"],
  ["panama", "Panama"],
  ["costarica", "Costa Rica"],
  ["guatemala", "Guatemala"],
  ["honduras", "Honduras"],
  ["elsalvador", "El Salvador"],
  ["nicaragua", "Nicaragua"],
  ["dominican", "Dominican Republic"],
  ["jamaica", "Jamaica"],
  ["trinidad", "Trinidad and Tobago"],
];

export const SERVER2_MASTER_COUNTRIES: Server2MasterCountry[] = MASTER_PAIRS.map(
  ([slug, name]) => ({ slug, name })
);

const MASTER_SLUG_SET = new Set(SERVER2_MASTER_COUNTRIES.map((c) => c.slug));

export async function upsertServer2MasterCountries(prisma: PrismaClient): Promise<void> {
  for (const m of SERVER2_MASTER_COUNTRIES) {
    await prisma.country.upsert({
      where: { slug: m.slug },
      update: { name: m.name, server: SERVER2 },
      create: {
        slug: m.slug,
        name: m.name,
        enabled: true,
        server: SERVER2,
        samplePrice: 0,
      },
    });
  }
}

export function buildCountrySamplePriceSlugOrder(providerSlugs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  push(SERVER2_AUSTRALIA_SLUG);
  for (const m of SERVER2_MASTER_COUNTRIES) {
    if (m.slug !== SERVER2_AUSTRALIA_SLUG) push(m.slug);
  }
  for (const s of providerSlugs) push(s);
  return out;
}

export function isServer2MasterSlug(slug: string): boolean {
  return MASTER_SLUG_SET.has(slug);
}

export async function enrichCountrySamplePrices(
  prisma: PrismaClient,
  slugsOrdered: string[],
  limit: number
): Promise<void> {
  const slice = slugsOrdered.slice(0, Math.max(0, limit));
  const base = getFiveSimApiBase();
  for (const slug of slice) {
    const res = await fiveSimFetch(`${base}/guest/products/${encodeURIComponent(slug)}/any`);
    if (!res.ok) continue;
    const data = (await res.json()) as Record<string, { Price?: number }>;
    let min = Number.POSITIVE_INFINITY;
    for (const v of Object.values(data)) {
      const p = typeof v?.Price === "number" ? v.Price : NaN;
      if (Number.isFinite(p) && p < min) min = p;
    }
    if (!Number.isFinite(min)) continue;
    const ngn = Math.round(computeSmsDisplayPriceNgn(min));
    await prisma.country.updateMany({ where: { slug }, data: { samplePrice: ngn } });
  }
}
