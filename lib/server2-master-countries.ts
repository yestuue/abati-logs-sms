import type { PrismaClient } from "@prisma/client";

/** Canonical slug for Australia. */
export const SERVER2_AUSTRALIA_SLUG = "australia";

const SERVER2 = "SERVER2";

export type Server2MasterCountry = { slug: string; name: string; iso2: string };

/** Master catalog: AU/US/UK/CA plus broad EU/Asia/Africa/LatAm. */
const MASTER_PAIRS: [string, string, string][] = [
  ["australia", "Australia", "AU"],
  ["usa", "United States", "US"],
  ["canada", "Canada", "CA"],
  ["england", "United Kingdom", "GB"],
  ["france", "France", "FR"],
  ["germany", "Germany", "DE"],
  ["spain", "Spain", "ES"],
  ["italy", "Italy", "IT"],
  ["netherlands", "Netherlands", "NL"],
  ["belgium", "Belgium", "BE"],
  ["portugal", "Portugal", "PT"],
  ["poland", "Poland", "PL"],
  ["sweden", "Sweden", "SE"],
  ["norway", "Norway", "NO"],
  ["denmark", "Denmark", "DK"],
  ["finland", "Finland", "FI"],
  ["ireland", "Ireland", "IE"],
  ["austria", "Austria", "AT"],
  ["switzerland", "Switzerland", "CH"],
  ["czech", "Czech Republic", "CZ"],
  ["hungary", "Hungary", "HU"],
  ["romania", "Romania", "RO"],
  ["greece", "Greece", "GR"],
  ["bulgaria", "Bulgaria", "BG"],
  ["croatia", "Croatia", "HR"],
  ["slovakia", "Slovakia", "SK"],
  ["slovenia", "Slovenia", "SI"],
  ["serbia", "Serbia", "RS"],
  ["bosnia", "Bosnia and Herzegovina", "BA"],
  ["albania", "Albania", "AL"],
  ["northmacedonia", "North Macedonia", "MK"],
  ["estonia", "Estonia", "EE"],
  ["latvia", "Latvia", "LV"],
  ["lithuania", "Lithuania", "LT"],
  ["luxembourg", "Luxembourg", "LU"],
  ["malta", "Malta", "MT"],
  ["cyprus", "Cyprus", "CY"],
  ["iceland", "Iceland", "IS"],
  ["moldova", "Moldova", "MD"],
  ["ukraine", "Ukraine", "UA"],
  ["russia", "Russia", "RU"],
  ["belarus", "Belarus", "BY"],
  ["turkey", "Turkey", "TR"],
  ["israel", "Israel", "IL"],
  ["uae", "United Arab Emirates", "AE"],
  ["saudi", "Saudi Arabia", "SA"],
  ["kuwait", "Kuwait", "KW"],
  ["qatar", "Qatar", "QA"],
  ["bahrain", "Bahrain", "BH"],
  ["oman", "Oman", "OM"],
  ["jordan", "Jordan", "JO"],
  ["lebanon", "Lebanon", "LB"],
  ["iraq", "Iraq", "IQ"],
  ["iran", "Iran", "IR"],
  ["egypt", "Egypt", "EG"],
  ["morocco", "Morocco", "MA"],
  ["algeria", "Algeria", "DZ"],
  ["tunisia", "Tunisia", "TN"],
  ["southafrica", "South Africa", "ZA"],
  ["nigeria", "Nigeria", "NG"],
  ["ghana", "Ghana", "GH"],
  ["kenya", "Kenya", "KE"],
  ["uganda", "Uganda", "UG"],
  ["tanzania", "Tanzania", "TZ"],
  ["ethiopia", "Ethiopia", "ET"],
  ["rwanda", "Rwanda", "RW"],
  ["zambia", "Zambia", "ZM"],
  ["zimbabwe", "Zimbabwe", "ZW"],
  ["mozambique", "Mozambique", "MZ"],
  ["angola", "Angola", "AO"],
  ["cameroon", "Cameroon", "CM"],
  ["ivorycoast", "Côte d'Ivoire", "CI"],
  ["senegal", "Senegal", "SN"],
  ["india", "India", "IN"],
  ["pakistan", "Pakistan", "PK"],
  ["bangladesh", "Bangladesh", "BD"],
  ["srilanka", "Sri Lanka", "LK"],
  ["nepal", "Nepal", "NP"],
  ["indonesia", "Indonesia", "ID"],
  ["philippines", "Philippines", "PH"],
  ["thailand", "Thailand", "TH"],
  ["vietnam", "Vietnam", "VN"],
  ["malaysia", "Malaysia", "MY"],
  ["singapore", "Singapore", "SG"],
  ["japan", "Japan", "JP"],
  ["southkorea", "South Korea", "KR"],
  ["china", "China", "CN"],
  ["hongkong", "Hong Kong", "HK"],
  ["taiwan", "Taiwan", "TW"],
  ["newzealand", "New Zealand", "NZ"],
  ["kazakhstan", "Kazakhstan", "KZ"],
  ["uzbekistan", "Uzbekistan", "UZ"],
  ["kyrgyzstan", "Kyrgyzstan", "KG"],
  ["tajikistan", "Tajikistan", "TJ"],
  ["mongolia", "Mongolia", "MN"],
  ["myanmar", "Myanmar", "MM"],
  ["cambodia", "Cambodia", "KH"],
  ["laos", "Laos", "LA"],
  ["afghanistan", "Afghanistan", "AF"],
  ["brazil", "Brazil", "BR"],
  ["mexico", "Mexico", "MX"],
  ["argentina", "Argentina", "AR"],
  ["chile", "Chile", "CL"],
  ["colombia", "Colombia", "CO"],
  ["peru", "Peru", "PE"],
  ["venezuela", "Venezuela", "VE"],
  ["ecuador", "Ecuador", "EC"],
  ["panama", "Panama", "PA"],
  ["costarica", "Costa Rica", "CR"],
  ["guatemala", "Guatemala", "GT"],
  ["honduras", "Honduras", "HN"],
  ["elsalvador", "El Salvador", "SV"],
  ["nicaragua", "Nicaragua", "NI"],
  ["dominican", "Dominican Republic", "DO"],
  ["jamaica", "Jamaica", "JM"],
  ["trinidad", "Trinidad and Tobago", "TT"],
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
