(() => {
  'use strict';

  const SUPABASE_URL = 'https://ojhaeccyulyrwoxgeurf.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_JZH6Ker5-yZoNY6sQFhVTA_YKnImI3z';
  const SESSION_KEY = 'nadena_games_session_v1';
  const PUBLISHED_GAMES = new Set(['hofhain', 'orvuno']);
  const FALLBACK_GAMES = [
    {slug:'hofhain',title:'Hofhain',description:'Baue deinen eigenen Hof auf, bewirtschafte Äcker, halte Tiere und entwickle deinen Bauernhof.',launch_url:'https://www.hofhain.de/',cover_emoji:'🌾',active:true,sso_ready:false,sort_order:10},
    {slug:'futnaro',title:'Futnaro',description:'Übernimm deinen Fußballverein und führe ihn sportlich und wirtschaftlich nach oben.',launch_url:'https://www.futnaro.de/',cover_emoji:'⚽',active:true,sso_ready:false,sort_order:20},
    {slug:'orvuno',title:'Orvuno',description:'Eine wachsende Online-Welt mit Wirtschaft, Gemeinschaft und langfristiger Entwicklung.',launch_url:'https://www.orvuno.de/',cover_emoji:'🌍',active:true,sso_ready:false,sort_order:30},
    {slug:'astrawelle',title:'AstraWelle',description:'Entdecke AstraWelle und entwickle deinen Fortschritt in einer neuen Spielwelt.',launch_url:'https://astrawelle.vercel.app/',cover_emoji:'✨',active:true,sso_ready:false,sort_order:40},
  ];

  const $ = (id) => document.getElementById(id);
  const state = { session: loadSession(), user: null, profile: null, links: [], games: [], pendingGameSlug: null };
  let toastTimer = 0;

  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
  }

  function saveSession(session) {
    state.session = session || null;
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  function headers({ auth = false, json = true, prefer = '' } = {}) {
    const h = { apikey: PUBLISHABLE_KEY };
    if (json) h['Content-Type'] = 'application/json';
    if (auth && state.session?.access_token) h.Authorization = `Bearer ${state.session.access_token}`;
    if (prefer) h.Prefer = prefer;
    return h;
  }

  async function parseResponse(response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.msg || body?.message || body?.error_description || body?.error || `HTTP ${response.status}`;
      const error = new Error(String(message));
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  function toast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  async function refreshSession() {
    if (!state.session?.refresh_token) return null;
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: state.session.refresh_token }), cache: 'no-store'
    });
    const next = await parseResponse(response);
    saveSession(next);
    return next;
  }

  async function ensureAccessToken() {
    if (!state.session?.access_token) return null;
    const exp = Number(state.session.expires_at || 0);
    if (!exp || exp - 60 > Math.floor(Date.now() / 1000)) return state.session.access_token;
    try {
      await refreshSession();
      return state.session?.access_token || null;
    } catch (_) {
      saveSession(null);
      return null;
    }
  }

  async function authUser() {
    if (!await ensureAccessToken()) return null;
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: headers({ auth: true, json: false }), cache: 'no-store' });
    return parseResponse(response);
  }

  function captureSessionFromHash() {
    const raw = String(location.hash || '').replace(/^#/, '');
    if (!raw) return false;
    const params = new URLSearchParams(raw);
    const accessToken = params.get('access_token');
    if (!accessToken) return false;
    const expiresIn = Number(params.get('expires_in') || 3600);
    saveSession({
      access_token: accessToken,
      refresh_token: params.get('refresh_token') || '',
      token_type: params.get('token_type') || 'bearer',
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
    history.replaceState(null, document.title, `${location.pathname}${location.search}`);
    return true;
  }

  async function loadGames() {
    const query = 'nadena_games?active=eq.true&select=slug,title,description,launch_url,cover_emoji,active,sso_ready,sort_order&order=sort_order.asc,slug.asc';
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, { headers: headers({ json: false }), cache: 'no-store' });
      const games = await parseResponse(response);
      state.games = Array.isArray(games) && games.length ? games : FALLBACK_GAMES;
      $('gamesMessage').textContent = '';
    } catch (error) {
      console.warn('[Nadena] Spieleverzeichnis konnte nicht geladen werden', error);
      state.games = FALLBACK_GAMES;
      $('gamesMessage').textContent = 'Das zentrale Spieleverzeichnis ist gerade nicht erreichbar. Die bekannten Nadena-Spiele werden angezeigt.';
    }
    renderGames();
  }

  async function loadAccount() {
    state.user = null;
    state.profile = null;
    state.links = [];
    if (!state.session) { renderAccount(); return; }
    try {
      const user = await authUser();
      if (!user) throw new Error('session_expired');
      state.user = user;
      const profileUrl = `${SUPABASE_URL}/rest/v1/nadena_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,display_name,avatar_url,language_code&limit=1`;
      const linksUrl = `${SUPABASE_URL}/rest/v1/nadena_game_links?nadena_user_id=eq.${encodeURIComponent(user.id)}&select=game_slug,external_user_id,linked_at,last_login_at`;
      const [profileRes, linksRes] = await Promise.all([
        fetch(profileUrl, { headers: headers({ auth: true, json: false }), cache: 'no-store' }),
        fetch(linksUrl, { headers: headers({ auth: true, json: false }), cache: 'no-store' }),
      ]);
      const [profiles, links] = await Promise.all([parseResponse(profileRes), parseResponse(linksRes)]);
      state.profile = Array.isArray(profiles) ? profiles[0] || null : null;
      state.links = Array.isArray(links) ? links : [];
    } catch (error) {
      console.warn('[Nadena] Sitzung konnte nicht geladen werden', error);
      saveSession(null);
      state.user = null;
    }
    renderAccount();
  }

  function renderAccount() {
    const loggedIn = Boolean(state.user && state.session?.access_token);
    $('accountGuest')?.classList.toggle('hidden', loggedIn);
    $('accountUser')?.classList.toggle('hidden', !loggedIn);
    $('headerAuthButton').textContent = loggedIn ? 'Mein Konto' : 'Anmelden';
    $('heroAuthButton').textContent = loggedIn ? 'Mein Konto' : 'Nadena ID erstellen';

    if (!loggedIn) {
      $('identityTitle').textContent = 'Noch nicht angemeldet';
      $('identityText').textContent = 'Einmal registrieren, danach alle verbundenen Spiele mit derselben Identität starten.';
      $('identityAction').textContent = 'Anmelden oder registrieren';
      return;
    }

    const displayName = state.profile?.display_name || state.user?.user_metadata?.display_name || state.user?.email?.split('@')[0] || 'Spieler';
    $('identityTitle').textContent = `Hallo, ${displayName}`;
    $('identityText').textContent = 'Deine Nadena ID ist aktiv. Beim Start eines verbundenen Spiels übernimmt Nadena die Anmeldung automatisch.';
    $('identityAction').textContent = 'Zu meinen Spielen';
    $('userName').textContent = displayName;
    $('userEmail').textContent = state.user?.email || '';
    $('userInitial').textContent = String(displayName).trim().charAt(0).toUpperCase() || 'N';
    $('displayName').value = displayName;

    const linked = new Map(state.links.map((link) => [link.game_slug, link]));
    $('linkedGames').innerHTML = state.games.map((game) => {
      const isPublished = PUBLISHED_GAMES.has(game.slug);
      const isLinked = linked.has(game.slug);
      const status = !isPublished ? 'Kommt bald' : (isLinked ? 'Verbunden' : (game.sso_ready ? 'Bereit zur ersten Anmeldung' : 'Spiel verfügbar'));
      return `<div class="linked-game"><span>${escapeHtml(game.cover_emoji || '🎮')} ${escapeHtml(game.title)}</span><strong>${escapeHtml(status)}</strong></div>`;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function renderGames() {
    const grid = $('gamesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const game of state.games) {
      const isPublished = PUBLISHED_GAMES.has(game.slug);
      const article = document.createElement('article');
      article.className = `card game-card${isPublished ? '' : ' is-coming-soon'}`;
      article.innerHTML = `
        <span class="game-icon" aria-hidden="true">${escapeHtml(game.cover_emoji || '🎮')}</span>
        <h3>${escapeHtml(game.title)}</h3>
        <p>${escapeHtml(game.description || '')}</p>
        <div class="game-meta">
          ${isPublished ? '<span class="pill ready">Jetzt spielbar</span>' : '<span class="pill">Kommt bald</span>'}
          ${isPublished && game.sso_ready ? '<span class="pill ready">Nadena ID verbunden</span>' : ''}
        </div>
        <button class="button play-button${isPublished ? '' : ' coming-soon'}" type="button"${isPublished ? '' : ' disabled aria-disabled="true"'}>${isPublished ? (game.sso_ready ? 'Mit Nadena ID spielen' : 'Jetzt spielen') : 'Kommt bald'}</button>`;
      if (isPublished) article.querySelector('button').addEventListener('click', () => startGame(game));
      grid.appendChild(article);
    }
    renderAccount();
  }

  async function startGame(game) {
    if (!PUBLISHED_GAMES.has(game.slug)) {
      toast(`${game.title} kommt bald.`);
      return;
    }

    if (!state.user || !state.session?.access_token) {
      state.pendingGameSlug = game.slug;
      openAuth('login');
      $('authMessage').textContent = `Melde dich an, um ${game.title} über deine Nadena ID zu starten.`;
      return;
    }

    if (!game.sso_ready) {
      toast(`${game.title}: Die Nadena-ID-Direktanmeldung wird noch mit dem Spiel verbunden. Das Spiel wird normal geöffnet.`);
      window.location.href = game.launch_url;
      return;
    }

    try {
      const token = await ensureAccessToken();
      if (!token) throw new Error('not_authenticated');
      toast(`${game.title} wird mit deiner Nadena ID gestartet …`);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/nadena-sso-issue`, {
        method: 'POST',
        headers: { ...headers({ auth: true }), Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game_slug: game.slug }),
        cache: 'no-store',
      });
      const result = await parseResponse(response);
      if (!result?.launch_url) throw new Error('launch_url_missing');
      window.location.href = result.launch_url;
    } catch (error) {
      console.error('[Nadena] SSO-Start fehlgeschlagen', error);
      if (error.status === 409 && error.body?.launch_url) {
        toast('Die Direktanmeldung ist für dieses Spiel noch nicht freigeschaltet. Das Spiel wird normal geöffnet.');
        window.location.href = error.body.launch_url;
        return;
      }
      toast('Der automatische Spielstart ist gerade nicht möglich. Bitte versuche es erneut.');
    }
  }

  function openAuth(mode = 'login') {
    switchAuth(mode);
    const dialog = $('authDialog');
    if (dialog?.showModal && !dialog.open) dialog.showModal();
  }

  function closeAuth() {
    $('authDialog')?.close();
    $('authMessage').textContent = '';
  }

  function switchAuth(mode) {
    const login = mode !== 'register';
    $('loginTab').classList.toggle('active', login);
    $('registerTab').classList.toggle('active', !login);
    $('loginPane').classList.toggle('hidden', !login);
    $('registerPane').classList.toggle('hidden', login);
    $('authMessage').textContent = '';
  }

  async function login(form) {
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ email, password }), cache: 'no-store'
    });
    const session = await parseResponse(response);
    saveSession(session);
    await loadAccount();
    closeAuth();
    toast('Du bist mit deiner Nadena ID angemeldet.');
    await resumePendingGame();
  }

  async function register(form) {
    const data = new FormData(form);
    const displayName = String(data.get('displayName') || '').trim();
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    if (!displayName) throw new Error('Bitte gib einen Anzeigenamen ein.');
    if (password.length < 10) throw new Error('Das Passwort muss mindestens 10 Zeichen haben.');
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST', headers: headers(), body: JSON.stringify({
        email, password,
        data: { display_name: displayName, language_code: 'de', account_origin: 'nadena-games' }
      }), cache: 'no-store'
    });
    const result = await parseResponse(response);
    if (result?.access_token) {
      saveSession(result);
      await loadAccount();
      closeAuth();
      toast('Deine Nadena ID wurde erstellt.');
      await resumePendingGame();
      return;
    }
    $('authMessage').textContent = 'Fast geschafft: Bitte bestätige jetzt die E-Mail, die wir dir gesendet haben. Danach kannst du dich anmelden.';
    form.reset();
  }

  async function resumePendingGame() {
    const slug = state.pendingGameSlug;
    state.pendingGameSlug = null;
    if (!slug) return;
    const game = state.games.find((item) => item.slug === slug);
    if (game && PUBLISHED_GAMES.has(game.slug)) await startGame(game);
  }

  async function logout() {
    try {
      if (state.session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers({ auth: true }), cache: 'no-store' });
      }
    } catch (_) {
    } finally {
      saveSession(null);
      state.user = null; state.profile = null; state.links = [];
      renderAccount();
      toast('Du bist abgemeldet.');
    }
  }

  async function saveProfile(form) {
    if (!state.user || !await ensureAccessToken()) return;
    const displayName = String(new FormData(form).get('displayName') || '').trim().slice(0, 40);
    if (!displayName) { toast('Bitte gib einen Anzeigenamen ein.'); return; }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/nadena_profiles?user_id=eq.${encodeURIComponent(state.user.id)}`, {
      method: 'PATCH',
      headers: headers({ auth: true, prefer: 'return=representation' }),
      body: JSON.stringify({ display_name: displayName }),
      cache: 'no-store',
    });
    const rows = await parseResponse(response);
    state.profile = Array.isArray(rows) ? rows[0] || state.profile : state.profile;
    renderAccount();
    toast('Dein Nadena-Profil wurde gespeichert.');
  }

  function bindEvents() {
    $('headerAuthButton').addEventListener('click', () => state.user ? $('konto').scrollIntoView({ behavior: 'smooth' }) : openAuth('login'));
    $('heroAuthButton').addEventListener('click', () => state.user ? $('konto').scrollIntoView({ behavior: 'smooth' }) : openAuth('register'));
    $('identityAction').addEventListener('click', () => state.user ? $('spiele').scrollIntoView({ behavior: 'smooth' }) : openAuth('login'));
    document.querySelectorAll('[data-open-auth]').forEach((button) => button.addEventListener('click', () => openAuth(button.dataset.openAuth)));
    $('closeAuth').addEventListener('click', closeAuth);
    $('loginTab').addEventListener('click', () => switchAuth('login'));
    $('registerTab').addEventListener('click', () => switchAuth('register'));
    $('logoutButton').addEventListener('click', logout);
    $('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault(); $('authMessage').textContent = 'Anmeldung wird geprüft …';
      try { await login(event.currentTarget); } catch (error) { $('authMessage').textContent = error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort ist nicht korrekt.' : String(error.message || 'Anmeldung fehlgeschlagen.'); }
    });
    $('registerForm').addEventListener('submit', async (event) => {
      event.preventDefault(); $('authMessage').textContent = 'Nadena ID wird erstellt …';
      try { await register(event.currentTarget); } catch (error) { $('authMessage').textContent = String(error.message || 'Registrierung fehlgeschlagen.'); }
    });
    $('profileForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await saveProfile(event.currentTarget); } catch (error) { console.error(error); toast('Profil konnte nicht gespeichert werden.'); }
    });
    $('authDialog').addEventListener('click', (event) => {
      if (event.target === $('authDialog')) closeAuth();
    });
  }

  async function boot() {
    $('year').textContent = String(new Date().getFullYear());
    captureSessionFromHash();
    bindEvents();
    await Promise.all([loadGames(), loadAccount()]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
