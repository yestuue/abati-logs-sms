// ABATI SMS — PWA + Theme Toggle
const THEME_KEY = 'abati-theme';

function getTheme() {
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

// Apply on load
document.addEventListener('DOMContentLoaded', () => applyTheme(getTheme()));

// ---- PWA INSTALL ----
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.querySelectorAll('.pwa-install-btn').forEach(b => b.style.display = 'flex');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.querySelectorAll('.pwa-install-btn').forEach(b => b.style.display = 'none');
});

async function installPWA() {
  if (!deferredPrompt) {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    alert('Install ABATI SMS\n\n' + (ios
      ? 'Tap Share → "Add to Home Screen"'
      : 'Tap the 3-dot menu → "Install App"'));
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