(() => {
  'use strict';
  const HOFHAIN_GENERATED = '__hofhain_generated__';
  const GAME = {
    hofhain: { image: HOFHAIN_GENERATED, fallback: '', available: true, label: 'Jetzt spielen', launch: 'https://www.hofhain.de/' },
    orvuno: { image: 'assets/orvuno.webp?v=5', fallback: 'assets/orvuno.jpg', available: true, label: 'Jetzt spielen', launch: 'https://www.orvuno.de/' },
    futnaro: { image: 'assets/futnaro.webp?v=5', fallback: 'assets/futnaro.jpg', available: false, label: 'Kommt bald', launch: 'https://www.futnaro.de/' },
    astrawelle: { image: 'assets/astrawelle.webp?v=5', fallback: 'assets/astrawelle.jpg', available: false, label: 'Kommt bald', launch: 'https://www.astrawelle.de/' }
  };
  const ASTRA_OLD = 'https://astrawelle.vercel.app';
  const ASTRA_NEW = 'https://www.astrawelle.de';
  const NADENA_LOGO = 'https://www.nadena-games.de/assets/nadena-games-logo.jpg';
  let hofhainArtworkPromise = null;

  function loadHofhainArtwork() {
    if (hofhainArtworkPromise) return hofhainArtworkPromise;
    hofhainArtworkPromise = Promise.all(
      [0, 1, 2, 3, 4, 5].map((part) => fetch(`assets/hofhain-eckig.b64.${part}?v=1`, { cache: 'force-cache' }).then((response) => {
        if (!response.ok) throw new Error(`hofhain_artwork_part_${part}`);
        return response.text();
      }))
    ).then((parts) => `data:image/webp;base64,${parts.join('').replace(/\s+/g, '')}`);
    return hofhainArtworkPromise;
  }

  function normalizeStructuredData() {
    const normalize = (value) => {
      if (typeof value === 'string') return value.replaceAll(ASTRA_OLD, ASTRA_NEW);
      if (Array.isArray(value)) return value.map(normalize);
      if (!value || typeof value !== 'object') return value;
      const next = {};
      for (const [key, item] of Object.entries(value)) next[key] = normalize(item);
      if (next['@type'] === 'Organization' && String(next.name || '').toLowerCase() === 'nadena games') {
        next.logo = NADENA_LOGO;
      }
      return next;
    };
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        script.textContent = JSON.stringify(normalize(JSON.parse(script.textContent || '{}')));
      } catch (_) {}
    });
  }

  function normalizePortalCopy() {
    document.querySelectorAll('.account-panel p').forEach((p) => {
      if (/Nadena-\/Orvuno-Konto/i.test(p.textContent || '')) {
        p.textContent = 'Erstelle dein zentrales Konto oder melde dich mit deiner bestehenden Nadena ID an.';
      }
    });
  }

  const slugFor = (card) => {
    const title = (card.querySelector('h3')?.textContent || '').trim().toLowerCase();
    if (title.includes('hofhain')) return 'hofhain';
    if (title.includes('orvuno')) return 'orvuno';
    if (title.includes('futnaro')) return 'futnaro';
    if (title.includes('astrawelle')) return 'astrawelle';
    return '';
  };

  function safeImage(src, fallback, eager = false) {
    const img = document.createElement('img');
    img.alt = '';
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    const fail = () => img.closest('.game-art')?.classList.add('image-failed');
    img.onerror = () => {
      if (fallback && img.dataset.fallback !== '1') {
        img.dataset.fallback = '1';
        img.src = fallback;
      } else {
        fail();
      }
    };
    if (src === HOFHAIN_GENERATED) {
      loadHofhainArtwork().then((url) => { img.src = url; }).catch(fail);
    } else {
      img.src = src;
    }
    return img;
  }

  function upgradeCards() {
    document.querySelectorAll('#gamesGrid .game-card').forEach((card) => {
      const slug = slugFor(card), cfg = GAME[slug];
      if (!cfg) return;

      card.querySelectorAll('.availability').forEach((badge) => badge.remove());
      card.querySelectorAll('.game-meta .pill').forEach((pill) => {
        if (/kommt bald/i.test(pill.textContent || '')) pill.remove();
      });

      if (card.dataset.artworkReady === '1') return;
      card.dataset.artworkReady = '1';
      card.dataset.game = slug;
      const icon = card.querySelector('.game-icon');
      if (icon) {
        const art = document.createElement('div');
        art.className = 'game-art';
        art.appendChild(safeImage(cfg.image, cfg.fallback));
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

      const directButton = button.cloneNode(true);
      directButton.textContent = cfg.label;
      directButton.addEventListener('click', () => {
        window.location.href = cfg.launch;
      });
      button.replaceWith(directButton);
    });
  }

  function worldLabel(slug) {
    return slug === 'astrawelle' ? 'AstraWelle' : slug.charAt(0).toUpperCase() + slug.slice(1);
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
      world.textContent = '';
      world.appendChild(safeImage(cfg.image, cfg.fallback, true));
      const label = document.createElement('span');
      label.textContent = worldLabel(slug);
      world.appendChild(label);
      if (!cfg.available) {
        const badge = document.createElement('em');
        badge.textContent = 'Kommt bald';
        world.appendChild(badge);
        world.classList.add('world-soon');
      }
    });
  }

  const observer = new MutationObserver(upgradeCards);
  function init() {
    normalizeStructuredData();
    normalizePortalCopy();
    upgradeBrand();
    upgradeCards();
    const grid = document.getElementById('gamesGrid');
    if (grid) observer.observe(grid, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
