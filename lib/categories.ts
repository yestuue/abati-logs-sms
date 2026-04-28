export const CATEGORY_GROUPS = {
  "Delivery Logs": {
    icon: "🌐",
    categories: ["Facebook", "Instagram", "Twitter/X", "TikTok", "Snapchat", "Gmail"],
  },
  "Texting Apps": {
    icon: "💬",
    categories: ["Google Voice", "TextNow", "Talkatone", "TextPlus", "NextPlus"],
  },
  "VPN Services": {
    icon: "🔒",
    categories: ["NordVPN", "ExpressVPN", "Surfshark", "PIA", "HMA", "CyberGhost"],
  },
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

/** Flat list of every known sub-category string. */
export const ALL_SUBCATEGORIES = Object.values(CATEGORY_GROUPS).flatMap(
  (g) => g.categories
) as string[];

/** Given a product category string, return which group it belongs to. */
export function getGroup(category: string): CategoryGroup | "Other" {
  for (const [group, { categories }] of Object.entries(CATEGORY_GROUPS)) {
    if ((categories as readonly string[]).includes(category)) {
      return group as CategoryGroup;
    }
  }
  return "Other";
}
