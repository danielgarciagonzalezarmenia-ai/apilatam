import { escapeHtml } from './util.js?v=1';
import { iconSpan } from './icons.js?v=1';

export const BLOCK_TYPES = {
  header: 'Encabezado',
  heading: 'Titulo',
  text: 'Texto',
  image: 'Imagen',
  button: 'Boton',
  video: 'Video',
  youtube: 'YouTube',
  html: 'Bloque HTML',
  list: 'Lista',
  grid: 'Cuadricula',
  divider: 'Divisor',
  spacer: 'Espacio',
  footer: 'Pie de pagina'
};

export function defaultTheme() {
  return {
    font: 'Poppins',
    bg: '#0a0a0a',
    text: '#fafafa',
    accent: '#ffffff',
    radius: 16,
    dark: true
  };
}

export const FONTS = [
  'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Space Grotesk', 'Outfit', 'Manrope', 'Work Sans',
  'Oswald', 'Anton', 'Archivo Black', 'Bebas Neue', 'Bungee', 'Righteous',
  'Playfair Display', 'Lora', 'Merriweather', 'DM Serif Display', 'Abril Fatface',
  'JetBrains Mono', 'Caveat', 'Pacifico', 'Shadows Into Light'
];

const FONT_W = {
  'Inter': '400;500;600;700;800',
  'Poppins': '400;500;600;700;800',
  'Roboto': '400;500;700;900',
  'Montserrat': '400;600;700;800;900',
  'Space Grotesk': '400;500;600;700',
  'Outfit': '300;400;600;700;800',
  'Manrope': '400;500;600;700;800',
  'Work Sans': '400;500;600;700;800',
  'Oswald': '400;500;600;700',
  'Playfair Display': '400;500;600;700;800',
  'Lora': '400;500;600;700',
  'Merriweather': '400;700;900',
  'JetBrains Mono': '400;600;700;800',
  'Caveat': '400;600;700',
  'Anton': '400',
  'Archivo Black': '400',
  'Bebas Neue': '400',
  'Bungee': '400',
  'Righteous': '400',
  'DM Serif Display': '400',
  'Abril Fatface': '400',
  'Pacifico': '400',
  'Shadows Into Light': '400'
};

export function fontHref(name) {
  if (!name) return '';
  const w = FONT_W[name] || '400;600;700;800';
  return 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g, '+') + ':wght@' + w + '&display=swap';
}

export function loadFont(name, onApplied) {
  if (!name) return Promise.resolve();
  const href = fontHref(name);
  return new Promise((resolve) => {
    let link = document.querySelector('link[data-af-font]');
    const done = () => { link.onload = link.onerror = null; if (onApplied) onApplied(); resolve(); };
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.afFont = '';
      link.onload = done;
      link.onerror = done;
      link.href = href;
      document.head.appendChild(link);
      return;
    }
    if (link.href === href) { if (onApplied) onApplied(); resolve(); return; }
    link.onload = done;
    link.onerror = done;
    link.href = href;
  });
}

let hlsPromise = null;
export function initHls(root) {
  const vids = root.querySelectorAll('video[data-hls]');
  if (!vids.length) return Promise.resolve();
  const loadLib = () => {
    if (window.Hls) return Promise.resolve();
    if (hlsPromise) return hlsPromise;
    hlsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('hls.js no cargo'));
      document.head.appendChild(s);
    });
    return hlsPromise;
  };
  return loadLib().then(() => {
    vids.forEach(v => {
      if (v.__hls) return;
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ liveSyncDurationCount: 2 });
        hls.loadSource(v.dataset.hls);
        hls.attachMedia(v);
        hls.on(window.Hls.Events.ERROR, (ev, data) => {
          if (data && data.fatal) {
            try { v.src = v.dataset.hls; } catch (e) {}
          }
        });
        v.__hls = hls;
      } else {
        try { v.src = v.dataset.hls; } catch (e) {}
      }
    });
  }).catch(() => {
    vids.forEach(v => { try { v.src = v.dataset.hls; } catch (e) {} });
  });
}

export function defaultBlocks() {
  return [
    { id: 'b' + Date.now() + 'a', type: 'header', text: 'Mi App', subtitle: 'Creada con AppForge', showLogo: true, logo: '', align: 'center' },
    { id: 'b' + Date.now() + 'b', type: 'text', text: 'Escribe aqui la bienvenida de tu app. Personaliza este texto desde el editor.', align: 'center' },
    { id: 'b' + Date.now() + 'c', type: 'button', text: 'Empezar', url: '#', linkUrl: 'https://example.com', variant: 'solid', align: 'center' },
    { id: 'b' + Date.now() + 'd', type: 'footer', text: 'AppForge \u00A9 2026' }
  ];
}

export function renderBlock(block, theme) {
  if (!block) return '';
  const T = theme || defaultTheme();
  const css = `
    --t-bg:${T.bg};
    --t-text:${T.text};
    --t-accent:${T.accent};
    --t-radius:${T.radius}px;
    --t-font:${T.fontReady || T.font}, system-ui, sans-serif;
  `;
  switch (block.type) {
    case 'header': return blockHeader(block, css);
    case 'heading': return blockHeading(block, css);
    case 'text': return blockText(block, css);
    case 'image': return blockImage(block, css);
    case 'button': return blockButton(block, css);
    case 'video':
    case 'youtube': return blockVideo(block, css);
    case 'html': return blockHtml(block, css);
    case 'list': return blockList(block, css);
    case 'grid': return blockGrid(block, css);
    case 'divider': return blockDivider(block, css);
    case 'spacer': return blockSpacer(block, css);
    case 'footer': return blockFooter(block, css);
    default: return '';
  }
}

export function renderBlocks(blocks, theme) {
  return (blocks || []).map(b => renderBlock(b, theme)).join('');
}

function blockHeader(b, css) {
  let logo = '';
  if (b.showLogo) {
    if (b.logoIcon) {
      logo = iconSpan(b.logoIcon, { size: b.logoIconSize || 38, color: b.logoIconColor ? b.logoIconColor : 'var(--t-accent)' });
    } else if (b.logo) {
      logo = `<img class="ab-logo" src="${escapeHtml(b.logo)}" alt="" onerror="this.style.display='none'">`;
    }
  }
  return `<div class="ab-header" style="${css};text-align:${b.align || 'center'};"><div class="ab-header-inner">${logo}<div class="ab-title">${escapeHtml(b.text || '')}</div>${b.subtitle ? `<div class="ab-subtitle">${escapeHtml(b.subtitle)}</div>` : ''}</div></div>`;
}

function blockHeading(b, css) {
  return `<div class="ab-heading" style="${css};text-align:${b.align || 'left'};color:var(--t-text);font-size:${b.size || 26}px;font-weight:700;line-height:1.25;">${escapeHtml(b.text || '')}</div>`;
}

function blockText(b, css) {
  return `<div class="ab-text" style="${css};text-align:${b.align || 'left'};color:var(--t-text);font-size:${b.size || 15}px;opacity:${b.opacity ?? 0.85};line-height:1.6;white-space:pre-wrap;">${escapeHtml(b.text || '')}</div>`;
}

function blockImage(b, css) {
  const lk = b.linkTarget || b.linkUrl ? linkMarkup(b) : null;
  return `<div class="ab-image" style="${css};text-align:${b.align || 'center'};">${lk ? lk.open.replace('<a', '<a style="cursor:pointer;"') : ''}<img src="${escapeHtml(b.url || '')}" alt="" style="border-radius:var(--t-radius);${b.width ? 'width:' + b.width + '%;' : 'width:100%;'}max-width:100%;object-fit:cover;border:1px solid rgba(255,255,255,0.08);" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22220%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%2318181b%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%2352525b%22 font-family=%22Arial%22 font-size=%2216%22 text-anchor=%22middle%22%3EImagen%3C/text%3E%3C/svg%3E';">${lk ? lk.close : ''}</div>`;
}

function linkMarkup(b) {
  if (b.linkTarget) return { open: `<a data-af-page="${escapeHtml(b.linkTarget)}">`, close: '</a>' };
  if (b.linkUrl) return { open: `<a href="${escapeHtml(b.linkUrl)}" target="_blank" rel="noopener">`, close: '</a>' };
  return null;
}

function blockButton(b, css) {
  const variant = b.variant || 'solid';
  const accent = 'var(--t-accent)';
  let style = '';
  if (variant === 'solid') {
    style = `background:${b.bg || accent};color:${b.textColor || '#000'};`;
  } else if (variant === 'outline') {
    style = `border:1.5px solid ${b.bg || accent};color:${b.textColor || accent};background:transparent;`;
  } else {
    style = `color:${b.textColor || accent};background:transparent;`;
  }
  const dims = [];
  if (b.width) dims.push(`width:${b.width}px;`);
  if (b.height) dims.push(`height:${b.height}px;`);
  style = 'position:relative;display:inline-flex;gap:8px;align-items:center;justify-content:center;box-sizing:border-box;padding:13px 28px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;' + style + dims.join(' ');
  let attrs = 'href="#"';
  if (b.linkTarget) attrs = `data-af-page="${escapeHtml(b.linkTarget)}"`;
  else if (b.linkUrl) attrs = `href="${escapeHtml(b.linkUrl)}" target="_blank" rel="noopener"`;
  const iconHtml = b.icon ? iconSpan(b.icon, { size: b.iconSize || 17, color: b.iconColor ? b.iconColor : 'currentColor' }) : '';
  const txt = escapeHtml(b.text || '');
  const label = txt || (!b.icon ? 'Boton' : '');
  return `<div class="ab-button" style="${css};text-align:${b.align || 'center'};"><a style="${style}" ${attrs}>${iconHtml}${label}</a></div>`;
}

function blockVideo(b, css) {
  if (b.type === 'youtube' && b.url) {
    const id = youtubeId(b.url);
    if (id) {
      return `<div class="ab-video" style="${css};"><div class="ab-video-box" style="position:relative;width:100%;aspect-ratio:16/9;border-radius:var(--t-radius);overflow:hidden;background:#000;"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe></div></div>`;
    }
  }
  const url = b.url || '';
  if (/\.m3u8(\?|$)/i.test(url)) {
    return `<div class="ab-video" style="${css};"><video class="ab-hls" data-hls="${escapeHtml(url)}" controls playsinline preload="metadata" style="width:100%;border-radius:var(--t-radius);background:#000;aspect-ratio:16/9;"></video></div>`;
  }
  return `<div class="ab-video" style="${css};"><video controls playsinline preload="metadata" style="width:100%;border-radius:var(--t-radius);background:#000;aspect-ratio:16/9;" src="${escapeHtml(url)}"></video></div>`;
}

function blockHtml(b, css) {
  return `<div class="ab-html" style="${css};">${b.html || ''}</div>`;
}

function blockList(b, css) {
  const items = (b.items || []).filter(x => x && x.text);
  const list = items.map(x => {
    const iconHtml = x.icon ? `<span class="ab-list-icon">${iconSpan(x.icon, { size: x.iconSize || 16, color: x.iconColor ? x.iconColor : 'var(--t-accent)' })}</span>` : '';
    const content = `${iconHtml}
      <div><div class="ab-list-title">${escapeHtml(x.text)}</div>${x.desc ? `<div class="ab-list-desc">${escapeHtml(x.desc)}</div>` : ''}</div>`;
    const lk = x.linkTarget || x.linkUrl ? linkMarkup(x) : null;
    if (lk) {
      return `<a class="ab-list-item" ${lk.open.includes('data-af-page') ? `data-af-page="${escapeHtml(x.linkTarget)}"` : `href="${escapeHtml(x.linkUrl)}" target="_blank" rel="noopener"`} style="text-decoration:none;">${content}</a>`;
    }
    return `<div class="ab-list-item">${content}</div>`;
  }).join('');
  return `<div class="ab-list" style="${css};">${list}</div>`;
}

function blockGrid(b, css) {
  const cols = [2, 3, 4].includes(Number(b.cols)) ? Number(b.cols) : 2;
  const cells = (b.cells || []).filter(x => x && x.text);
  if (!cells.length) return '';
  const gap = b.gap || 12;
  const minH = b.minH || 0;
  const inner = cells.map(c => {
    const icon = c.icon ? `<span class="ab-grid-icon">${iconSpan(c.icon, { size: c.iconSize || 22, color: c.iconColor ? c.iconColor : 'var(--t-accent)' })}</span>` : '';
    const content = `${icon}${c.text ? `<div class="ab-grid-title">${escapeHtml(c.text)}</div>` : ''}${c.desc ? `<div class="ab-grid-desc">${escapeHtml(c.desc)}</div>` : ''}`;
    const cellStyle = `text-decoration:none;${minH ? 'min-height:' + minH + 'px;' : ''}`;
    const lk = c.linkTarget || c.linkUrl ? linkMarkup(c) : null;
    if (lk) {
      const attrs = lk.open.includes('data-af-page') ? `data-af-page="${escapeHtml(c.linkTarget)}"` : `href="${escapeHtml(c.linkUrl)}" target="_blank" rel="noopener"`;
      return `<a class="ab-grid-cell" style="${cellStyle}" ${attrs}>${content}</a>`;
    }
    return `<div class="ab-grid-cell" style="${cellStyle}">${content}</div>`;
  }).join('');
  return `<div class="ab-grid" style="${css};display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;">${inner}</div>`;
}

function blockDivider(b, css) {
  return `<div class="ab-divider" style="${css};"><div style="height:1px;background:var(--t-accent);opacity:0.25;"></div></div>`;
}

function blockSpacer(b, css) {
  return `<div class="ab-spacer" style="${css};height:${b.height || 24}px;"></div>`;
}

function blockFooter(b, css) {
  return `<div class="ab-footer" style="${css};text-align:center;color:var(--t-text);opacity:0.55;font-size:13px;">${escapeHtml(b.text || '')}</div>`;
}

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}