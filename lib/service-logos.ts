/**
 * Maps service/category names to icons8 CDN URLs.
 * No local files needed — icons load instantly from the CDN.
 * If a service has no entry, ServiceLogo falls back to a Lucide Globe icon.
 */

export const SERVICE_LOGO_MAP: Record<string, string> = {
  // Social
  "Facebook":      "https://img.icons8.com/color/48/facebook-new.png",
  "Instagram":     "https://img.icons8.com/color/48/instagram-new.png",
  "TikTok":        "https://img.icons8.com/color/48/tiktok.png",
  "Twitter":       "https://img.icons8.com/color/48/twitterx--v2.png",
  "Twitter/X":     "https://img.icons8.com/color/48/twitterx--v2.png",
  "Snapchat":      "https://img.icons8.com/color/48/snapchat.png",
  "Gmail":         "https://img.icons8.com/color/48/gmail-new.png",
  "LinkedIn":      "https://img.icons8.com/color/48/linkedin.png",
  // Messaging
  "WhatsApp":      "https://img.icons8.com/color/48/whatsapp.png",
  "Telegram":      "https://img.icons8.com/color/48/telegram-app.png",
  // Texting apps — use best available icon, phone as fallback for lesser-known apps
  "Google Voice":  "https://img.icons8.com/color/48/google-voice.png",
  "TextNow":       "https://img.icons8.com/color/48/phone.png",
  "Talkatone":     "https://img.icons8.com/color/48/phone.png",
  "TextPlus":      "https://img.icons8.com/color/48/phone.png",
  "NextPlus":      "https://img.icons8.com/color/48/phone.png",
  // VPN
  "NordVPN":       "https://img.icons8.com/color/48/nordvpn.png",
  "Nord VPN":      "https://img.icons8.com/color/48/nordvpn.png",
  "ExpressVPN":    "https://img.icons8.com/color/48/expressvpn.png",
  "Express VPN":   "https://img.icons8.com/color/48/expressvpn.png",
  "Surfshark":     "https://img.icons8.com/color/48/surfshark.png",
  "PIA":           "https://img.icons8.com/color/48/vpn.png",
  "HMA":           "https://img.icons8.com/color/48/vpn.png",
  "HMA VPN":       "https://img.icons8.com/color/48/vpn.png",
  "CyberGhost":    "https://img.icons8.com/color/48/vpn.png",
};

export function getServiceLogo(name: string): string | null {
  return SERVICE_LOGO_MAP[name] ?? null;
}
