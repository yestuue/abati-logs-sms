document.addEventListener('DOMContentLoaded', () => {

  // ---- NAVBAR SCROLL EFFECT ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ---- MOBILE MENU TOGGLE ----
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('mobile-active');
      }
    });
  }

  // ---- SCROLL ANIMATIONS ----
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    fadeEls.forEach(el => observer.observe(el));
  }

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
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">
        Loading numbers...
      </div>`;

    try {
      const url = network === 'all' ? '/api/v1/numbers' : `/api/v1/numbers?network=${network}`;
      const res  = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        renderNumbers(data.data);
      } else {
        numbersGrid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">
            No numbers available for this network right now.
          </div>`;
      }
    } catch (err) {
      console.error('Failed to fetch numbers:', err);
      numbersGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">
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

  fetchNumbers();
});

// ---- GLOBAL COPY FUNCTION ----
function copyToClipboard(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    const original = element.innerText;
    element.innerText = 'Copied!';
    element.style.color = 'var(--accent)';
    setTimeout(() => {
      element.innerText = original;
      element.style.color = '';
    }, 2000);
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