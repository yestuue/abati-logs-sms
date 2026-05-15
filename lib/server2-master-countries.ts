import type { PrismaClient } from "@prisma/client";

/** Canonical slug for Australia. */
export const SERVER2_AUSTRALIA_SLUG = "australia";

const SERVER2 = "SERVER2";

export type Server2MasterCountry = { slug: string; name: string; iso2: string };

/** Master catalog: slug, name, iso2 */
const MASTER_PAIRS: [string, string, string][] = [
  ["russia", "Russia", "RU"],
  ["ukraine", "Ukraine", "UA"],
  ["kazakhstan", "Kazakhstan", "KZ"],
  ["china", "China", "CN"],
  ["philippines", "Philippines", "PH"],
  ["myanmar", "Myanmar", "MM"],
  ["indonesia", "Indonesia", "ID"],
  ["malaysia", "Malaysia", "MY"],
  ["kenya", "Kenya", "KE"],
  ["tanzania", "Tanzania", "TZ"],
  ["vietnam", "Vietnam", "VN"],
  ["kyrgyzstan", "Kyrgyzstan", "KG"],
  ["usa", "United States", "US"],
  ["israel", "Israel", "IL"],
  ["hongkong", "Hong Kong", "HK"],
  ["poland", "Poland", "PL"],
  ["england", "United Kingdom", "GB"],
  ["madagascar", "Madagascar", "MG"],
  ["congo", "Congo", "CD"],
  ["nigeria", "Nigeria", "NG"],
  ["macau", "Macau", "MO"],
  ["egypt", "Egypt", "EG"],
  ["india", "India", "IN"],
  ["ireland", "Ireland", "IE"],
  ["cambodia", "Cambodia", "KH"],
  ["laos", "Laos", "LA"],
  ["haiti", "Haiti", "HT"],
  ["ivorycoast", "Côte d'Ivoire", "CI"],
  ["gambia", "Gambia", "GM"],
  ["serbia", "Serbia", "RS"],
  ["yemen", "Yemen", "YE"],
  ["southafrica", "South Africa", "ZA"],
  ["romania", "Romania", "RO"],
  ["colombia", "Colombia", "CO"],
  ["estonia", "Estonia", "EE"],
  ["azerbaijan", "Azerbaijan", "AZ"],
  ["canada", "Canada", "CA"],
  ["morocco", "Morocco", "MA"],
  ["ghana", "Ghana", "GH"],
  ["argentina", "Argentina", "AR"],
  ["uzbekistan", "Uzbekistan", "UZ"],
  ["cameroon", "Cameroon", "CM"],
  ["chad", "Chad", "TD"],
  ["germany", "Germany", "DE"],
  ["lithuania", "Lithuania", "LT"],
  ["croatia", "Croatia", "HR"],
  ["sweden", "Sweden", "SE"],
  ["iraq", "Iraq", "IQ"],
  ["netherlands", "Netherlands", "NL"],
  ["latvia", "Latvia", "LV"],
  ["austria", "Austria", "AT"],
  ["belarus", "Belarus", "BY"],
  ["thailand", "Thailand", "TH"],
  ["saudi", "Saudi Arabia", "SA"],
  ["mexico", "Mexico", "MX"],
  ["taiwan", "Taiwan", "TW"],
  ["spain", "Spain", "ES"],
  ["iran", "Iran", "IR"],
  ["algeria", "Algeria", "DZ"],
  ["slovenia", "Slovenia", "SI"],
  ["bangladesh", "Bangladesh", "BD"],
  ["senegal", "Senegal", "SN"],
  ["turkey", "Turkey", "TR"],
  ["srilanka", "Sri Lanka", "LK"],
  ["peru", "Peru", "PE"],
  ["pakistan", "Pakistan", "PK"],
  ["newzealand", "New Zealand", "NZ"],
  ["guinea", "Guinea", "GN"],
  ["mali", "Mali", "ML"],
  ["venezuela", "Venezuela", "VE"],
  ["ethiopia", "Ethiopia", "ET"],
  ["mongolia", "Mongolia", "MN"],
  ["brazil", "Brazil", "BR"],
  ["afghanistan", "Afghanistan", "AF"],
  ["uganda", "Uganda", "UG"],
  ["angola", "Angola", "AO"],
  ["cyprus", "Cyprus", "CY"],
  ["france", "France", "FR"],
  ["papuanewguinea", "Papua New Guinea", "PG"],
  ["greece", "Greece", "GR"],
  ["portugal", "Portugal", "PT"],
  ["belgium", "Belgium", "BE"],
  ["bulgaria", "Bulgaria", "BG"],
  ["australia", "Australia", "AU"],
  ["guyana", "Guyana", "GY"],
  ["albania", "Albania", "AL"],
  ["georgia", "Georgia", "GE"],
  ["uae", "United Arab Emirates", "AE"],
];

export const SERVER2_MASTER_COUNTRIES: Server2MasterCountry[] = MASTER_PAIRS.map(
  ([slug, name, iso2]) => ({ slug, name, iso2 })
);

const MASTER_SLUG_SET = new Set(SERVER2_MASTER_COUNTRIES.map((c) => c.slug));

export async function upsertServer2MasterCountries(prisma: PrismaClient): Promise<void> {
  for (const m of SERVER2_MASTER_COUNTRIES) {
    await prisma.country.upsert({
      where: { slug: m.slug },
      update: { name: m.name, server: SERVER2, iso2: m.iso2 },
      create: {
        slug: m.slug,
        name: m.name,
        iso2: m.iso2,
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
