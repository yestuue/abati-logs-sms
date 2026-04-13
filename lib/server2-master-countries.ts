import type { PrismaClient } from "@prisma/client";
import {
  computeSmsDisplayPriceNgn,
  fiveSimFetch,
  getFiveSimApiBase,
} from "@/lib/sms-provider";

/** Canonical slug for Australia (5SIM + master list). */
export const SERVER2_AUSTRALIA_SLUG = "australia";

export type Server2MasterCountry = {
  slug: string;
  name: string;
  iso2: string;
  /** E.164-style country calling code, e.g. "+61". */
  dialCode: string;
};

/**
 * Master Server 2 country catalog: ensures AU/US/UK/CA and broad EU/Asia/Africa coverage
 * even when the provider API omits rows. Slugs align with common 5SIM guest codes where known.
 */
export const SERVER2_MASTER_COUNTRIES: Server2MasterCountry[] = [
  { slug: "australia", name: "Australia", iso2: "AU", dialCode: "+61" },
  { slug: "usa", name: "United States", iso2: "US", dialCode: "+1" },
  { slug: "canada", name: "Canada", iso2: "CA", dialCode: "+1" },
  { slug: "england", name: "United Kingdom", iso2: "GB", dialCode: "+44" },
  { slug: "france", name: "France", iso2: "FR", dialCode: "+33" },
  { slug: "germany", name: "Germany", iso2: "DE", dialCode: "+49" },
  { slug: "spain", name: "Spain", iso2: "ES", dialCode: "+34" },
  { slug: "italy", name: "Italy", iso2: "IT", dialCode: "+39" },
  { slug: "netherlands", name: "Netherlands", iso2: "NL", dialCode: "+31" },
  { slug: "belgium", name: "Belgium", iso2: "BE", dialCode: "+32" },
  { slug: "portugal", name: "Portugal", iso2: "PT", dialCode: "+351" },
  { slug: "poland", name: "Poland", iso2: "PL", dialCode: "+48" },
  { slug: "sweden", name: "Sweden", iso2: "SE", dialCode: "+46" },
  { slug: "norway", name: "Norway", iso2: "NO", dialCode: "+47" },
  { slug: "denmark", name: "Denmark", iso2: "DK", dialCode: "+45" },
  { slug: "finland", name: "Finland", iso2: "FI", dialCode: "+358" },
  { slug: "ireland", name: "Ireland", iso2: "IE", dialCode: "+353" },
  { slug: "austria", name: "Austria", iso2: "AT", dialCode: "+43" },
  { slug: "switzerland", name: "Switzerland", iso2: "CH", dialCode: "+41" },
  { slug: "czech", name: "Czech Republic", iso2: "CZ", dialCode: "+420" },
  { slug: "hungary", name: "Hungary", iso2: "HU", dialCode: "+36" },
  { slug: "romania", name: "Romania", iso2: "RO", dialCode: "+40" },
  { slug: "greece", name: "Greece", iso2: "GR", dialCode: "+30" },
  { slug: "bulgaria", name: "Bulgaria", iso2: "BG", dialCode: "+359" },
  { slug: "croatia", name: "Croatia", iso2: "HR", dialCode: "+385" },
  { slug: "slovakia", name: "Slovakia", iso2: "SK", dialCode: "+421" },
  { slug: "slovenia", name: "Slovenia", iso2: "SI", dialCode: "+386" },
  { slug: "serbia", name: "Serbia", iso2: "RS", dialCode: "+381" },
  { slug: "bosnia", name: "Bosnia and Herzegovina", iso2: "BA", dialCode: "+387" },
  { slug: "albania", name: "Albania", iso2: "AL", dialCode: "+355" },
  { slug: "northmacedonia", name: "North Macedonia", iso2: "MK", dialCode: "+389" },
  { slug: "estonia", name: "Estonia", iso2: "EE", dialCode: "+372" },
  { slug: "latvia", name: "Latvia", iso2: "LV", dialCode: "+371" },
  { slug: "lithuania", name: "Lithuania", iso2: "LT", dialCode: "+370" },
  { slug: "luxembourg", name: "Luxembourg", iso2: "LU", dialCode: "+352" },
  { slug: "malta", name: "Malta", iso2: "MT", dialCode: "+356" },
  { slug: "cyprus", name: "Cyprus", iso2: "CY", dialCode: "+357" },
  { slug: "iceland", name: "Iceland", iso2: "IS", dialCode: "+354" },
  { slug: "moldova", name: "Moldova", iso2: "MD", dialCode: "+373" },
  { slug: "ukraine", name: "Ukraine", iso2: "UA", dialCode: "+380" },
  { slug: "russia", name: "Russia", iso2: "RU", dialCode: "+7" },
  { slug: "belarus", name: "Belarus", iso2: "BY", dialCode: "+375" },
  { slug: "turkey", name: "Turkey", iso2: "TR", dialCode: "+90" },
  { slug: "israel", name: "Israel", iso2: "IL", dialCode: "+972" },
  { slug: "uae", name: "United Arab Emirates", iso2: "AE", dialCode: "+971" },
  { slug: "saudi", name: "Saudi Arabia", iso2: "SA", dialCode: "+966" },
  { slug: "kuwait", name: "Kuwait", iso2: "KW", dialCode: "+965" },
  { slug: "qatar", name: "Qatar", iso2: "QA", dialCode: "+974" },
  { slug: "bahrain", name: "Bahrain", iso2: "BH", dialCode: "+973" },
  { slug: "oman", name: "Oman", iso2: "OM", dialCode: "+968" },
  { slug: "jordan", name: "Jordan", iso2: "JO", dialCode: "+962" },
  { slug: "lebanon", name: "Lebanon", iso2: "LB", dialCode: "+961" },
  { slug: "iraq", name: "Iraq", iso2: "IQ", dialCode: "+964" },
  { slug: "iran", name: "Iran", iso2: "IR", dialCode: "+98" },
  { slug: "egypt", name: "Egypt", iso2: "EG", dialCode: "+20" },
  { slug: "morocco", name: "Morocco", iso2: "MA", dialCode: "+212" },
  { slug: "algeria", name: "Algeria", iso2: "DZ", dialCode: "+213" },
  { slug: "tunisia", name: "Tunisia", iso2: "TN", dialCode: "+216" },
  { slug: "southafrica", name: "South Africa", iso2: "ZA", dialCode: "+27" },
  { slug: "nigeria", name: "Nigeria", iso2: "NG", dialCode: "+234" },
  { slug: "ghana", name: "Ghana", iso2: "GH", dialCode: "+233" },
  { slug: "kenya", name: "Kenya", iso2: "KE", dialCode: "+254" },
  { slug: "uganda", name: "Uganda", iso2: "UG", dialCode: "+256" },
  { slug: "tanzania", name: "Tanzania", iso2: "TZ", dialCode: "+255" },
  { slug: "ethiopia", name: "Ethiopia", iso2: "ET", dialCode: "+251" },
  { slug: "rwanda", name: "Rwanda", iso2: "RW", dialCode: "+250" },
  { slug: "zambia", name: "Zambia", iso2: "ZM", dialCode: "+260" },
  { slug: "zimbabwe", name: "Zimbabwe", iso2: "ZW", dialCode: "+263" },
  { slug: "mozambique", name: "Mozambique", iso2: "MZ", dialCode: "+258" },
  { slug: "angola", name: "Angola", iso2: "AO", dialCode: "+244" },
  { slug: "cameroon", name: "Cameroon", iso2: "CM", dialCode: "+237" },
  { slug: "ivorycoast", name: "Côte d'Ivoire", iso2: "CI", dialCode: "+225" },
  { slug: "senegal", name: "Senegal", iso2: "SN", dialCode: "+221" },
  { slug: "india", name: "India", iso2: "IN", dialCode: "+91" },
  { slug: "pakistan", name: "Pakistan", iso2: "PK", dialCode: "+92" },
  { slug: "bangladesh", name: "Bangladesh", iso2: "BD", dialCode: "+880" },
  { slug: "srilanka", name: "Sri Lanka", iso2: "LK", dialCode: "+94" },
  { slug: "nepal", name: "Nepal", iso2: "NP", dialCode: "+977" },
  { slug: "indonesia", name: "Indonesia", iso2: "ID", dialCode: "+62" },
  { slug: "philippines", name: "Philippines", iso2: "PH", dialCode: "+63" },
  { slug: "thailand", name: "Thailand", iso2: "TH", dialCode: "+66" },
  { slug: "vietnam", name: "Vietnam", iso2: "VN", dialCode: "+84" },
  { slug: "malaysia", name: "Malaysia", iso2: "MY", dialCode: "+60" },
  { slug: "singapore", name: "Singapore", iso2: "SG", dialCode: "+65" },
  { slug: "japan", name: "Japan", iso2: "JP", dialCode: "+81" },
  { slug: "southkorea", name: "South Korea", iso2: "KR", dialCode: "+82" },
  { slug: "china", name: "China", iso2: "CN", dialCode: "+86" },
  { slug: "hongkong", name: "Hong Kong", iso2: "HK", dialCode: "+852" },
  { slug: "taiwan", name: "Taiwan", iso2: "TW", dialCode: "+886" },
  { slug: "newzealand", name: "New Zealand", iso2: "NZ", dialCode: "+64" },
  { slug: "kazakhstan", name: "Kazakhstan", iso2: "KZ", dialCode: "+7" },
  { slug: "uzbekistan", name: "Uzbekistan", iso2: "UZ", dialCode: "+998" },
  { slug: "kyrgyzstan", name: "Kyrgyzstan", iso2: "KG", dialCode: "+996" },
  { slug: "tajikistan", name: "Tajikistan", iso2: "TJ", dialCode: "+992" },
  { slug: "mongolia", name: "Mongolia", iso2: "MN", dialCode: "+976" },
  { slug: "myanmar", name: "Myanmar", iso2: "MM", dialCode: "+95" },
  { slug: "cambodia", name: "Cambodia", iso2: "KH", dialCode: "+855" },
  { slug: "laos", name: "Laos", iso2: "LA", dialCode: "+856" },
  { slug: "afghanistan", name: "Afghanistan", iso2: "AF", dialCode: "+93" },
  { slug: "brazil", name: "Brazil", iso2: "BR", dialCode: "+55" },
  { slug: "mexico", name: "Mexico", iso2: "MX", dialCode: "+52" },
  { slug: "argentina", name: "Argentina", iso2: "AR", dialCode: "+54" },
  { slug: "chile", name: "Chile", iso2: "CL", dialCode: "+56" },
  { slug: "colombia", name: "Colombia", iso2: "CO", dialCode: "+57" },
  { slug: "peru", name: "Peru", iso2: "PE", dialCode: "+51" },
  { slug: "venezuela", name: "Venezuela", iso2: "VE", dialCode: "+58" },
  { slug: "ecuador", name: "Ecuador", iso2: "EC", dialCode: "+593" },
  { slug: "panama", name: "Panama", iso2: "PA", dialCode: "+507" },
  { slug: "costarica", name: "Costa Rica", iso2: "CR", dialCode: "+506" },
  { slug: "guatemala", name: "Guatemala", iso2: "GT", dialCode: "+502" },
  { slug: "honduras", name: "Honduras", iso2: "HN", dialCode: "+504" },
  { slug: "elsalvador", name: "El Salvador", iso2: "SV", dialCode: "+503" },
  { slug: "nicaragua", name: "Nicaragua", iso2: "NI", dialCode: "+505" },
  { slug: "dominican", name: "Dominican Republic", iso2: "DO", dialCode: "+1" },
  { slug: "jamaica", name: "Jamaica", iso2: "JM", dialCode: "+1" },
  { slug: "trinidad", name: "Trinidad and Tobago", iso2: "TT", dialCode: "+1" },
];

const MASTER_SLUG_SET = new Set(SERVER2_MASTER_COUNTRIES.map((c) => c.slug));

export async function upsertServer2MasterCountries(prisma: PrismaClient): Promise<void> {
  for (const m of SERVER2_MASTER_COUNTRIES) {
    await prisma.country.upsert({
      where: { slug: m.slug },
      update: { name: m.name, iso2: m.iso2, dialCode: m.dialCode },
      create: {
        slug: m.slug,
        name: m.name,
        enabled: true,
        iso2: m.iso2,
        dialCode: m.dialCode,
      },
    });
  }
}

/**
 * Ordered slugs for sample-price enrichment: Australia first, then other masters, then extras.
 */
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

/**
 * Fetches guest/products for up to `limit` country slugs and writes basePrice (sample NGN).
 */
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
    const ngn = computeSmsDisplayPriceNgn(min);
    await prisma.country.updateMany({ where: { slug }, data: { basePrice: ngn } });
  }
}
