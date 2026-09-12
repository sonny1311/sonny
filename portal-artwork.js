(() => {
  'use strict';
  const GAME = {
    hofhain: { image: 'assets/hofhain.webp?v=5', fallback: 'assets/hofhain.jpg', available: true, label: 'Jetzt spielen', launch: 'https://www.hofhain.de/' },
    orvuno: { image: 'assets/orvuno.webp?v=5', fallback: 'assets/orvuno.jpg', available: true, label: 'Jetzt spielen', launch: 'https://www.orvuno.de/' },
    futnaro: { image: 'assets/futnaro.webp?v=5', fallback: 'assets/futnaro.jpg', available: false, label: 'Kommt bald', launch: 'https://www.futnaro.de/' },
    astrawelle: { image: 'assets/astrawelle.webp?v=5', fallback: 'assets/astrawelle.jpg', available: false, label: 'Kommt bald', launch: 'https://www.astrawelle.de/' }
  };
  const slugFor = (card) => {
    const title = (card.querySelector('h3')?.textContent || '').trim().toLowerCase();
    if (title.includes('hofhain')) return 'hofhain';
    if (title.includes('orvuno')) return 'orvuno';
    if (title.includes('futnaro')) return 'futnaro';
    if (title.includes('astrawelle')) return 'astrawelle';
    return '';
  };
  function safeImage(src, fallback) {
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    img.onerror = () => {
      if (fallback && img.dataset.fallback !== '1') {
        img.dataset.fallback = '1';
        img.src = fallback;
      } else {
        img.closest('.game-art')?.classList.add('image-failed');
      }
    };
    return img;
  }
  function upgradeCards() {
    document.querySelectorAll('#gamesGrid .game-card').forEach((card) => {
      const slug = slugFor(card), cfg = GAME[slug];
      if (!cfg || card.dataset.artworkReady === '1') return;
      card.dataset.artworkReady = '1';
      card.dataset.game = slug;
      const icon = card.querySelector('.game-icon');
      if (icon) {
        const art = document.createElement('div');
        art.className = 'game-art';
        art.appendChild(safeImage(cfg.image, cfg.fallback));
        const badge = document.createElement('span');
        badge.className = `availability ${cfg.available ? 'live' : 'soon'}`;
        badge.textContent = cfg.available ? 'Spielbar' : 'Kommt bald';
        art.appendChild(badge);
        icon.replaceWith(art);
      }
      const button = card.querySelector('.play-button');
      if (!button) return;
      if (!cfg.available) {
        const clone = button.cloneNode(true);
        clone.textContent = 'Kommt bald';
        clone.disabled = true;
        clone.setAttribute('aria-disabled', 'true');
        clone.classList.add('coming-soon');
        button.replaceWith(clone);
        card.classList.add('is-coming-soon');
        return;
      }

      const nadenaSsoReady = /Nadena ID/i.test(button.textContent || '');
      if (nadenaSsoReady) {
        button.textContent = 'Mit Nadena ID spielen';
        return;
      }

      // Noch kein SSO-Adapter: den vorhandenen Portal-Login-Handler entfernen.
      // So meldet sich der Spieler nur einmal im eigentlichen Spiel an.
      const directButton = button.cloneNode(true);
      directButton.textContent = cfg.label;
      directButton.addEventListener('click', () => {
        window.location.href = cfg.launch;
      });
      button.replaceWith(directButton);
    });
  }
  function upgradeBrand() {
    document.querySelectorAll('.brand span, .footer-brand > span').forEach((el) => {
      if (el.querySelector('img')) return;
      el.textContent = '';
      el.classList.add('real-brandmark');
      el.innerHTML = '<img src="assets/nadena-games-logo.jpg?v=5" alt="">';
    });
    const core = document.querySelector('.core-logo');
    if (core && !core.querySelector('img')) core.innerHTML = '<img src="assets/nadena-games-logo.jpg?v=5" alt="Nadena Games"><small>NADENA ID</small>';
    document.querySelectorAll('.hero-stage .world').forEach((world) => {
      const text = (world.textContent || '').toLowerCase();
      const slug = Object.keys(GAME).find((key) => text.includes(key));
      if (!slug) return;
      const cfg = GAME[slug];
      world.innerHTML = `<img src="${cfg.image}" alt=""><span>${slug === 'astrawelle' ? 'AstraWelle' : slug.charAt(0).toUpperCase()+slug.slice(1)}</span>${cfg.available ? '' : '<em>Kommt bald</em>'}`;
      if (!cfg.available) world.classList.add('world-soon');
    });
  }
  const observer = new MutationObserver(upgradeCards);
  function init() {
    upgradeBrand();
    upgradeCards();
    const grid = document.getElementById('gamesGrid');
    if (grid) observer.observe(grid, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
