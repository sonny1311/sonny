(() => {
  'use strict';
  const GAME = {
    hofhain: { image: 'assets/hofhain.jpg', available: true, label: 'Jetzt spielen' },
    orvuno: { image: 'assets/orvuno.jpg', available: true, label: 'Jetzt spielen' },
    futnaro: { image: 'assets/futnaro.jpg', available: false, label: 'Kommt bald' },
    astrawelle: { image: 'assets/astrawelle.jpg', available: false, label: 'Kommt bald' }
  };
  const slugFor = (card) => {
    const title = (card.querySelector('h3')?.textContent || '').trim().toLowerCase();
    if (title.includes('hofhain')) return 'hofhain';
    if (title.includes('orvuno')) return 'orvuno';
    if (title.includes('futnaro')) return 'futnaro';
    if (title.includes('astrawelle')) return 'astrawelle';
    return '';
  };
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
        art.innerHTML = `<img src="${cfg.image}" alt="" loading="lazy" decoding="async">${cfg.available ? '<span class="availability live">Spielbar</span>' : '<span class="availability soon">Kommt bald</span>'}`;
        icon.replaceWith(art);
      }
      const button = card.querySelector('.play-button');
      if (!button) return;
      if (!cfg.available) {
        const clone = button.cloneNode(true);
        clone.textContent = 'Kommt bald';
        clone.disabled = true;
        clone.classList.add('coming-soon');
        button.replaceWith(clone);
        card.classList.add('is-coming-soon');
        card.setAttribute('aria-label', `${card.querySelector('h3')?.textContent || 'Spiel'} – kommt bald`);
      } else {
        button.textContent = cfg.label;
      }
    });
  }
  function upgradeBrand() {
    document.querySelectorAll('.brand span, .footer-brand > span').forEach((el) => {
      if (el.querySelector('img')) return;
      el.textContent = '';
      el.classList.add('real-brandmark');
      el.innerHTML = '<img src="assets/nadena-games-logo.jpg" alt="" decoding="async">';
    });
    const core = document.querySelector('.core-logo');
    if (core && !core.querySelector('img')) core.innerHTML = '<img src="assets/nadena-games-logo.jpg" alt="Nadena Games"><small>NADENA ID</small>';
    document.querySelectorAll('.hero-stage .world').forEach((world) => {
      const text = (world.textContent || '').toLowerCase();
      const slug = Object.keys(GAME).find((key) => text.includes(key === 'astrawelle' ? 'astrawelle' : key));
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
