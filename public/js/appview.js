const params = new URLSearchParams(location.search);
const appId = params.get('id');

let blocksMod = null;
const state = { pages: [], theme: null, data: null };

async function initAppPage(id) {
  if (!id) {
    document.getElementById('v-root').innerHTML = '<div class="v-error">Falta el identificador de la app.<br><a href="index.html">Ir a AppForge</a></div>';
    return;
  }

  try {
    const [firestore, authMod, utilMod, blkMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
      import('./auth.js?v=2'),
      import('./util.js?v=1'),
      import('./blocks.js?v=8')
    ]);
    const { doc, getDoc } = firestore;
    const { db } = authMod;
    const { escapeHtml } = utilMod;
    const { renderBlocks, defaultTheme, initHls, loadFont } = blkMod;
    const { loadIconFont } = await import('./icons.js?v=1');
    blocksMod = blkMod;

    const snap = await getDoc(doc(db, 'apps', id));
    if (!snap.exists()) {
      document.getElementById('v-root').innerHTML = '<div class="v-error">Esta app no existe o fue eliminada.<br><a href="index.html">Ir a AppForge</a></div>';
      return;
    }

    const data = snap.data();
    if (!data.published) {
      document.getElementById('v-root').innerHTML = '<div class="v-error">Esta app aun no ha sido publicada.<br><a href="index.html">Ir a AppForge</a></div>';
      return;
    }

    state.data = data;
    state.theme = { ...defaultTheme(), ...(data.theme || {}) };
    state.pages = (Array.isArray(data.pages) && data.pages.length)
      ? data.pages.map(p => ({ ...p, blocks: p.blocks || [] }))
      : [{ id: 'p-home', name: 'Inicio', blocks: data.blocks || [] }];
    state.pages.forEach(p => migrateLinks(p.blocks));
    await loadFont(state.theme.font || 'Poppins');
    loadIconFont();

    await setupShell(data, id);
    renderCurrentPage(true);
    await setupSw();
    setupInstallBar(data);
  } catch (e) {
    console.error(e);
    document.getElementById('v-root').innerHTML = '<div class="v-error">No se pudo cargar la app.<br><a href="index.html">Ir a AppForge</a></div>';
  }
}

function migrateLinks(blocks) {
  (blocks || []).forEach(b => {
    if (b.type === 'button' && !b.linkTarget && !b.linkUrl && b.url && b.url !== '#') {
      b.linkUrl = b.url;
    }
  });
}

function currentPageId() {
  const req = params.get('page');
  if (req && state.pages.some(p => p.id === req)) return req;
  return state.pages[0].id;
}

function renderCurrentPage(isInit) {
  const page = state.pages.find(p => p.id === currentPageId()) || state.pages[0];
  const t = state.theme;
  const root = document.getElementById('v-root');
  root.innerHTML = `
    <div class="v-stage">
      <div class="ab-phone-root" style="--t-font:${t.font},system-ui,sans-serif;--t-bg:${t.bg};--t-text:${t.text};--t-accent:${t.accent};--t-radius:${t.radius || 16}px;min-height:100dvh;padding:24px 20px 88px;">
        ${renderBlocks(page.blocks, t)}
      </div>
      <div class="v-brand" id="v-home-link" style="cursor:pointer;"><span class="v-dot"></span><span>Creada con AppForge</span></div>
    </div>`;

  root.querySelectorAll('[data-af-page]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = state.pages.find(p => p.id === a.dataset.afPage);
    if (target) {
      params.set('page', target.id);
      history.replaceState(null, '', './view.html?id=' + encodeURIComponent(appId) + '&page=' + encodeURIComponent(target.id));
      renderCurrentPage();
      window.scrollTo(0, 0);
    }
  }));

  const home = document.getElementById('v-home-link');
  if (home) home.addEventListener('click', () => {
    params.delete('page');
    history.replaceState(null, '', './view.html?id=' + encodeURIComponent(appId));
    renderCurrentPage();
    window.scrollTo(0, 0);
  });

  if (isInit) {
    document.title = (state.data.name || 'App') + ' - AppForge';
  }

  if (blocksMod && blocksMod.initHls) blocksMod.initHls(root);
}

async function setupShell(data, id) {
  const t = state.theme;
  const font = (t.font || 'Poppins').replace(/ /g, '+');
  if (font) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + font + ':wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
  const name = data.name || 'App';
  document.title = name + ' - AppForge';
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.remove();
  const mt = document.createElement('meta');
  mt.name = 'apple-mobile-web-app-title';
  mt.content = name;
  document.head.appendChild(mt);

  const icon = data.logoUrl;
  if (icon) {
    const li = document.createElement('link');
    li.rel = 'apple-touch-icon';
    li.href = icon;
    document.head.appendChild(li);
  }

  try {
    const manifest = {
      name,
      short_name: (name || 'App').slice(0, 12),
      start_url: './view.html?id=' + encodeURIComponent(id),
      scope: './',
      display: 'standalone',
      background_color: data.theme && data.theme.bg ? data.theme.bg : '#0a0a0a',
      theme_color: data.theme && data.theme.accent ? data.theme.accent : '#ffffff',
      icons: icon ? [
        { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: icon, sizes: '512x512', type: 'image/png', purpose: 'any' }
      ] : []
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);
  } catch (e) {
    console.warn('manifest fallo', e);
  }
}

async function setupSw() {
  try {
    if (!('serviceWorker' in navigator)) return;
    await navigator.serviceWorker.register('./sw.js');
  } catch (e) {
    console.warn('SW no disponible', e);
  }
}

let deferredPrompt = null;
function setupInstallBar(data) {
  const bar = document.getElementById('v-install');
  const btn = document.getElementById('v-install-btn');
  if (data.logoUrl) document.getElementById('v-install-icon').src = data.logoUrl;
  document.getElementById('v-install-name').textContent = data.name || 'App';
  document.getElementById('v-install-sub').textContent = (data.version || '1.0.0') + ' \u00B7 App instalable';
  const show = () => { bar.style.display = 'flex'; };
  const hide = () => { bar.style.display = 'none'; };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    show();
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        document.getElementById('v-install-sub').textContent = 'Ya esta instalada en tu dispositivo';
        return;
      }
      document.getElementById('v-install-sub').textContent = 'Usa el menu del navegador: "Agregar a pantalla de inicio"';
      return;
    }
    deferredPrompt.prompt();
    const res = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (res && res.outcome === 'dismissed') hide();
  });

  window.addEventListener('appinstalled', () => {
    hide();
  });
}

export { initAppPage };