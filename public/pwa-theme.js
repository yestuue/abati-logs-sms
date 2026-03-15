// ABATI SMS — PWA + Theme Toggle
const THEME_KEY = 'abati-theme';

function getTheme() {
  // Default to DARK always — only switch if user explicitly toggled
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = theme === 'dark'
      ? '<i class="ph ph-sun"></i>'
      : '<i class="ph ph-moon"></i>';
    btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// Apply immediately — always dark by default
applyTheme(getTheme());

// ---- PWA INSTALL ----
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.querySelectorAll('.pwa-install-btn').forEach(btn => {
    btn.style.display = 'flex';
  });
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.querySelectorAll('.pwa-install-btn').forEach(btn => {
    btn.style.display = 'none';
  });
});

async function installPWA() {
  if (!deferredPrompt) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    alert('Install ABATI SMS\n\n' + (isIOS
      ? 'Tap Share → "Add to Home Screen"'
      : 'Tap the 3-dot menu → "Add to Home Screen"'));
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') deferredPrompt = null;
}

// ---- SERVICE WORKER ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ---- LIGHT MODE CSS ----
const lightCSS = `
[data-theme="light"] {
  --bg: #f4f5f7 !important;
  --bg2: #ffffff !important;
  --bg3: #eef0f3 !important;
  --bg-card: #ffffff !important;
  --bg-hover: #f0f2f5 !important;
  --bg-input: #f8f9fb !important;
  --border: rgba(0,0,0,0.09) !important;
  --border2: rgba(0,0,0,0.15) !important;
  --border-hover: rgba(0,0,0,0.2) !important;
  --text: #111318 !important;
  --muted: #6b7280 !important;
  --muted2: #9ca3af !important;
  --accent: #00b37a !important;
  --accent-dim: rgba(0,179,122,0.08) !important;
  --accent-border: rgba(0,179,122,0.25) !important;
  color-scheme: light;
}
[data-theme="light"] body { background: #f4f5f7 !important; color: #111318 !important; }
[data-theme="light"] .sidebar,
[data-theme="light"] .topbar { background: rgba(255,255,255,0.95) !important; border-color: rgba(0,0,0,0.08) !important; }
[data-theme="light"] .card,
[data-theme="light"] .stat-tile,
[data-theme="light"] .num-card,
[data-theme="light"] .feature-card,
[data-theme="light"] .number-card,
[data-theme="light"] .profile-card,
[data-theme="light"] .setting-card,
[data-theme="light"] .auth-box,
[data-theme="light"] .login-box { background: #ffffff !important; }
[data-theme="light"] #auth-screen { background: #f4f5f7 !important; }
[data-theme="light"] input,
[data-theme="light"] select,
[data-theme="light"] textarea { background: #f8f9fb !important; color: #111318 !important; border-color: rgba(0,0,0,0.12) !important; }
[data-theme="light"] .tbl td,
[data-theme="light"] .tbl th { color: #111318 !important; }
[data-theme="light"] .sb-item { color: #6b7280 !important; }
[data-theme="light"] .sb-item:hover,
[data-theme="light"] .sb-item.active { color: #00b37a !important; }
`;

const styleEl = document.createElement('style');
styleEl.id = 'abati-theme-css';
styleEl.textContent = lightCSS;
document.head.appendChild(styleEl);