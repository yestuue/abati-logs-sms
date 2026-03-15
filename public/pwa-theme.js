// ============================================================
// ABATI SMS — PWA + Theme Toggle
// Include this script in ALL pages: <script src="/pwa-theme.js"></script>
// ============================================================

// ---- THEME ----
const THEME_KEY = 'abati-theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  // Update all toggle buttons
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

// Apply immediately to avoid flash
applyTheme(getTheme());

// ---- PWA INSTALL ----
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button if it exists
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
    // Already installed or not supported — show instructions
    showInstallInstructions();
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    deferredPrompt = null;
  }
}

function showInstallInstructions() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const msg = isIOS
    ? 'On iPhone/iPad: tap the Share button → "Add to Home Screen"'
    : 'In Chrome: tap the 3-dot menu → "Add to Home Screen" or "Install App"';
  alert('📱 Install ABATI SMS\n\n' + msg);
}

// ---- SERVICE WORKER ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.log('[SW] Failed:', err));
  });
}

// ---- LIGHT MODE CSS VARIABLES ----
// Injected into <head> so light mode overrides work globally
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
  --accent-glow: 0 0 30px rgba(0,179,122,0.12) !important;
  color-scheme: light;
}
[data-theme="light"] body { background: #f4f5f7 !important; color: #111318 !important; }
[data-theme="light"] .sidebar,
[data-theme="light"] #navbar,
[data-theme="light"] .topbar { background: rgba(255,255,255,0.95) !important; }
[data-theme="light"] .sb-item:hover,
[data-theme="light"] .bg-hover { background: #f0f2f5 !important; }
[data-theme="light"] .card,
[data-theme="light"] .stat,
[data-theme="light"] .num-card,
[data-theme="light"] .feature-card,
[data-theme="light"] .number-card,
[data-theme="light"] .price-card,
[data-theme="light"] .profile-card,
[data-theme="light"] .setting-card,
[data-theme="light"] .waitlist-box { background: #ffffff !important; }
[data-theme="light"] .hero { background: #f4f5f7 !important; }
[data-theme="light"] #auth-screen,
[data-theme="light"] .auth-box,
[data-theme="light"] .modal,
[data-theme="light"] .login-box { background: #ffffff !important; }
[data-theme="light"] input,
[data-theme="light"] select,
[data-theme="light"] textarea { background: #f8f9fb !important; color: #111318 !important; border-color: rgba(0,0,0,0.12) !important; }
[data-theme="light"] .tbl td,
[data-theme="light"] .tbl th { color: #111318 !important; }
[data-theme="light"] .hero::before { background: radial-gradient(circle, rgba(0,179,122,.05) 0%, transparent 70%) !important; }
[data-theme="light"] .theme-toggle { color: #111318 !important; }
`;

const styleEl = document.createElement('style');
styleEl.id = 'abati-theme-css';
styleEl.textContent = lightCSS;
document.head.appendChild(styleEl);