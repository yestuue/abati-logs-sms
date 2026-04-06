/**
 * Maps service/category names to their logo file paths.
 * Place the actual image files in /public/logos/.
 * Falls back to an emoji when no logo file exists.
 */

export const SERVICE_LOGO_MAP: Record<string, string> = {
  // Social
  "Facebook":    "/logos/facebook.png",
  "Instagram":   "/logos/instagram.png",
  "Twitter":     "/logos/twitter.png",
  "Twitter/X":   "/logos/twitter.png",
  "TikTok":      "/logos/tiktok.png",
  "Snapchat":    "/logos/snapchat.png",
  "Gmail":       "/logos/gmail.png",
  "LinkedIn":    "/logos/linkedin.png",
  // Texting apps
  "Google Voice": "/logos/google-voice.png",
  "TextNow":      "/logos/textnow.png",
  "Talkatone":    "/logos/talkatone.png",
  "TextPlus":     "/logos/textplus.png",
  "NextPlus":     "/logos/nextplus.png",
  // VPN
  "NordVPN":      "/logos/nordvpn.png",
  "Nord VPN":     "/logos/nordvpn.png",
  "ExpressVPN":   "/logos/expressvpn.png",
  "Express VPN":  "/logos/expressvpn.png",
  "Surfshark":    "/logos/surfshark.png",
  "PIA":          "/logos/pia.png",
  "HMA":          "/logos/hma.png",
  "HMA VPN":      "/logos/hma.png",
  "CyberGhost":   "/logos/cyberghost.png",
  // Messaging
  "WhatsApp":     "/logos/whatsapp.png",
  "Telegram":     "/logos/telegram.png",
};

export const SERVICE_EMOJI_FALLBACK: Record<string, string> = {
  "Facebook": "📘", "Instagram": "📸", "Twitter": "🐦", "Twitter/X": "🐦",
  "TikTok": "🎵", "Snapchat": "👻", "Gmail": "📧", "LinkedIn": "💼",
  "Google Voice": "📞", "TextNow": "💬", "Talkatone": "📱", "TextPlus": "💬",
  "NextPlus": "📲", "WhatsApp": "🟢", "Telegram": "✈️",
  "NordVPN": "🔒", "Nord VPN": "🔒", "ExpressVPN": "🛡️", "Express VPN": "🛡️",
  "Surfshark": "🦈", "PIA": "🔐", "HMA": "🐴", "HMA VPN": "🐴",
  "CyberGhost": "👻",
};

export function getServiceLogo(name: string): string | null {
  return SERVICE_LOGO_MAP[name] ?? null;
}

export function getServiceEmoji(name: string): string {
  return SERVICE_EMOJI_FALLBACK[name] ?? "🔗";
}
