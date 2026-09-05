const params = new URLSearchParams(location.search);
const appId = params.get('id');

async function initAppPage(id) {
  if (!id) {
    document.getElementById('v-root').innerHTML = '<div class="v-error">Falta el identificador de la app.<br><a href="index.html">Ir a AppForge</a></div>';
    return;
  }

  try {
    const [firestore, authMod, utilMod, blocksMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
      import('./auth.js?v=1'),
      import('./util.js?v=1'),
      import('./blocks.js?v=1')
    ]);
    const { doc, getDoc } = firestore;
    const { db } = authMod;
    const { escapeHtml } = utilMod;
    const { renderBlocks, defaultTheme } = blocksMod;

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

    await render(data, appId);
  } catch (e) {
    console.error(e);
    document.getElementById('v-root').innerHTML = '<div class="v-error">No se pudo cargar la app.<br><a href="index.html">Ir a AppForge</a></div>';
  }
}

async function render(data, id) {
  const t = { ...defaultTheme(), ...(data.theme || {}) };
  const bg = t.bg || '#0a0a0a';
  const tc = t.text || '#fafafa';
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

  const root = document.getElementById('v-root');
  root.innerHTML = `
    <div class="v-stage">
      <div class="ab-phone-root" style="--t-font:${t.font},system-ui,sans-serif;--t-bg:${bg};--t-text:${tc};--t-accent:${t.accent};--t-radius:${(t.radius || 16)}px;min-height:100dvh;">
        ${renderBlocks(data.blocks, t)}
      </div>
      <div class="v-brand"><span class="v-dot"></span><a href="index.html">Creada con AppForge</a></div>
    </div>`;

  // manifest dinamico para instalarlo como PWA
  await setupManifest(data, icon, name);
  await setupSw();
  setupInstallBar(data, name);
}

async function setupManifest(data, icon, name) {
  try {
    const manifest = {
      name,
      short_name: (name || 'App').slice(0, 12),
      start_url: './view.html?id=' + encodeURIComponent(appId),
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
function setupInstallBar(data, name) {
  const bar = document.getElementById('v-install');
  const btn = document.getElementById('v-install-btn');
  if (data.logoUrl) document.getElementById('v-install-icon').src = data.logoUrl;
  document.getElementById('v-install-name').textContent = name;
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