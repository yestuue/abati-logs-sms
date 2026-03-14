document.addEventListener('DOMContentLoaded', () => {

  // ---- THEME TOGGLE ----
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  const savedTheme = localStorage.getItem('abati-theme');
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    updateToggleIcon(true);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = body.classList.toggle('light-mode');
      localStorage.setItem('abati-theme', isLight ? 'light' : 'dark');
      updateToggleIcon(isLight);
    });
  }

  function updateToggleIcon(isLight) {
    if (!themeToggle) return;
    const thumb = themeToggle.querySelector('.theme-toggle-thumb');
    if (thumb) thumb.innerHTML = isLight ? '☀️' : '🌙';
  }

  updateToggleIcon(body.classList.contains('light-mode'));

  // ---- NAVBAR SCROLL EFFECT ----
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ---- MOBILE MENU TOGGLE ----
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
    });
  }

  // ---- SCROLL ANIMATIONS ----
  const fadeEls = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.remove('hidden');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  fadeEls.forEach(el => {
    el.classList.add('hidden');
    observer.observe(el);
  });

  // ---- FILTER BUTTONS ----
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchNumbers(btn.dataset.filter);
    });
  });

  // ---- FETCH NUMBERS FROM API ----
  async function fetchNumbers(network = 'all') {
    const numbersGrid = document.getElementById('numbers-grid');
    if (!numbersGrid) return;

    numbersGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
        <div class="pulse" style="margin:0 auto 16px;width:12px;height:12px;"></div>
        Loading numbers...
      </div>`;

    try {
      const url = network === 'all' ? '/api/v1/numbers' : `/api/v1/numbers?network=${network}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        renderNumbers(data.data);
      } else {
        numbersGrid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
            No numbers available for this network right now.
          </div>`;
      }
    } catch (err) {
      console.error('Failed to fetch numbers:', err);
      numbersGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
          Could not connect to server.
        </div>`;
    }
  }

  // ---- RENDER NUMBER CARDS ----
  function renderNumbers(numbers) {
    const numbersGrid = document.getElementById('numbers-grid');
    if (!numbersGrid) return;
    numbersGrid.innerHTML = '';
    numbers.forEach(num => {
      const card = document.createElement('div');
      card.className = 'number-card';
      card.innerHTML = `
        <div class="nc-header">
          <span class="nc-network">${num.network}</span>
          <span class="nc-status">${num.status}</span>
        </div>
        <div class="nc-number">${num.number}</div>
        <button class="nc-action" onclick="copyToClipboard('${num.number}', this)">
          Copy Number
        </button>`;
      numbersGrid.appendChild(card);
    });
  }

  // ---- WAITLIST CTA ----
  document.querySelectorAll('.btn-primary').forEach(btn => {
    if (btn.textContent.trim().includes('Get Started Free')) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Joining...';
        btn.disabled = true;
        try {
          await fetch('/api/v1/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'visitor@abatisms.com' })
          });
          btn.innerHTML = "✓ You're on the list!";
          setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 3000);
        } catch {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
        }
      });
    }
  });

  fetchNumbers();
});

// ---- GLOBAL COPY FUNCTION ----
function copyToClipboard(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    const original = element.innerText;
    element.innerText = 'Copied!';
    element.style.color = 'var(--accent)';
    setTimeout(() => { element.innerText = original; element.style.color = ''; }, 2000);
  }).catch(() => {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    element.innerText = 'Copied!';
    setTimeout(() => { element.innerText = 'Copy Number'; }, 2000);
  });
}