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
  social: 'Redes sociales',
  whatsapp: 'WhatsApp',
  table: 'Tabla',
  faq: 'Preguntas frecuentes',
  carousel: 'Testimonios',
  counters: 'Estadisticas',
  countdown: 'Cuenta regresiva',
  map: 'Mapa',
  gallery: 'Galeria',
  form: 'Formulario',
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
    case 'social': return blockSocial(block, css);
    case 'whatsapp': return blockWhatsapp(block, css);
    case 'table': return blockTable(block, css);
    case 'faq': return blockFaq(block, css);
    case 'carousel': return blockCarousel(block, css);
    case 'counters': return blockCounters(block, css);
    case 'countdown': return blockCountdown(block, css);
    case 'map': return blockMap(block, css);
    case 'gallery': return blockGallery(block, css);
    case 'form': return blockForm(block, css);
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
    const img = c.img ? `<img class="ab-grid-img" src="${escapeHtml(c.img)}" alt="" onerror="this.style.display='none'">` : '';
    const icon = c.icon ? `<span class="ab-grid-icon">${iconSpan(c.icon, { size: c.iconSize || 22, color: c.iconColor ? c.iconColor : 'var(--t-accent)' })}</span>` : '';
    const content = `${img}${icon}${c.text ? `<div class="ab-grid-title">${escapeHtml(c.text)}</div>` : ''}${c.desc ? `<div class="ab-grid-desc">${escapeHtml(c.desc)}</div>` : ''}`;
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

/* ---------------- Bloques nuevos ---------------- */

export const SOCIAL_NETS = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  spotify: 'Spotify',
  linkedin: 'LinkedIn',
  phone: 'Telefono',
  email: 'Correo'
};

const SOCIAL_SVGS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 0 0-8.15 14.5L2.6 21.5l4.7-1.2A9.5 9.5 0 1 0 12 2.5Zm0 1.8a7.7 7.7 0 1 1-3.95 14.35l-.6-.35-2.75.7.73-2.65-.4-.63A7.7 7.7 0 0 1 12 4.3Zm-3.1 4.2c-.2 0-.45.08-.68.32-.24.26-.92.9-.92 2.2s.94 2.55 1.06 2.72c.13.18 1.83 2.95 4.5 4.02 2.18.88 2.65.66 3.12.59.57-.08 1.84-.75 2.1-1.48.26-.72.26-1.35.18-1.48-.07-.13-.28-.21-.6-.37-.31-.16-1.84-.91-2.12-1.01-.28-.1-.49-.15-.7.16-.2.31-.78 1.02-.96 1.23-.18.2-.36.23-.67.08a7.4 7.4 0 0 1-2.43-1.5 9.4 9.4 0 0 1-1.68-2.09c-.18-.3-.02-.46.13-.61.14-.13.31-.34.46-.52.16-.17.21-.3.32-.49.1-.2.05-.37-.03-.51-.07-.14-.69-1.68-.95-2.29-.25-.6-.5-.52-.7-.53h-.6Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.7 3h3.05L14.1 10.35 21.85 21h-5.66l-4.43-6.02L6.72 21H3.66l6.5-7.43L3 3h5.8l4 5.53L17.7 3Zm-.95 16.2h1.6L7.35 4.7H5.6L16.75 19.2Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2.1 1.8 3.7 3.9 4v2.9c-1.5 0-2.9-.5-4-1.4v6c0 3.9-3 6.7-6.7 6.2A6.1 6.1 0 0 1 5.7 15c-.8-3.8 2.5-7.5 6.5-7.1v3.1a3.1 3.1 0 0 0-3.4 3.4 3.2 3.2 0 0 0 6.4.7V3h1.4Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 8.6V6.9c0-.85.3-1.4 1.45-1.4h1.75V2.6h-2.9C12 2.6 10.2 4.55 10.2 7.35V8.6H7.6V12h2.6v9.4h4V12h2.75l.4-3.4h-3.15Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.7 7.2a2.6 2.6 0 0 0-1.82-1.84C18.35 5 12 5 12 5s-6.35 0-7.88.36A2.6 2.6 0 0 0 2.3 7.2 27.6 27.6 0 0 0 2 12c0 1.62.1 3.22.3 4.8a2.6 2.6 0 0 0 1.82 1.84C5.65 19 12 19 12 19s6.35 0 7.88-.36a2.6 2.6 0 0 0 1.82-1.84c.2-1.58.3-3.18.3-4.8 0-1.62-.1-3.22-.3-4.8ZM9.8 15.1V8.9l5.25 3.1L9.8 15.1Z"/></svg>',
  spotify: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Zm4.05 12.7a.56.56 0 0 1-.76.2c-2.1-1.28-4.76-1.57-7.88-.86a.56.56 0 0 1-.24-1.1c3.34-.76 6.23-.42 8.52 1a.56.56 0 0 1 .36.76Zm1.08-2.4a.7.7 0 0 1-.96.25c-2.4-1.47-6.07-1.9-8.9-1.04a.7.7 0 1 1-.4-1.35c3.28-.98 7.35-.5 10.11 1.25a.7.7 0 0 1 .15.89Zm.1-2.5c-2.88-1.72-7.63-1.88-10.37-1.04a.84.84 0 1 1-.47-1.6c3.17-.94 8.42-.76 11.77 1.26a.84.84 0 0 1-.93 1.38Z" transform="translate(0)"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.3 3h15.4A1.3 1.3 0 0 1 21 4.3v15.4a1.3 1.3 0 0 1-1.3 1.3H4.3A1.3 1.3 0 0 1 3 19.7V4.3A1.3 1.3 0 0 1 4.3 3ZM8.35 9.6V19H5.6V9.6h2.75ZM6.98 8.28a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2ZM19 19h-2.74v-5.05c0-1.47-.58-2.36-1.8-2.36-1.03 0-1.73.7-2 1.37-.1.25-.14.6-.14.94V19H9.6V9.6h2.7v1.3c.36-.63 1.15-1.46 2.67-1.46 1.94 0 3.43 1.28 3.43 4.02V19Z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3l2 4-1.5 1.5a11 11 0 0 0 6 6L15 13l4 2v3a2 2 0 0 1-2 2A16 16 0 0 1 2 7a2 2 0 0 1 2-2h3Z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
};

function blockSocial(b, css) {
  const links = (b.links || []).filter(l => l && l.url);
  if (!links.length) return '';
  const inner = links.map(l => {
    const svg = SOCIAL_SVGS[l.net] || SOCIAL_SVGS.email;
    return `<a class="ab-social" href="${escapeHtml(l.url)}" target="_blank" rel="noopener" title="${escapeHtml(SOCIAL_NETS[l.net] || '')}">${svg}</a>`;
  }).join('');
  return `<div class="ab-socials" style="${css};text-align:${b.align || 'center'};">${inner}</div>`;
}

function blockWhatsapp(b, css) {
  const num = (b.number || '').replace(/\D/g, '');
  const msg = encodeURIComponent(b.message || 'Hola, quiero mas informacion');
  const renderUrl = num ? 'https://wa.me/' + num + (msg ? '?text=' + msg : '') : '#';
  const style = b.bg ? 'background:' + b.bg + ';color:var(--t-text);box-shadow:none;' : '';
  return `<div class="ab-wa-wrap" style="${css};text-align:${b.align || 'center'};"><a class="ab-wa" href="${renderUrl}" target="_blank" rel="noopener" style="${style}">${SOCIAL_SVGS.whatsapp}<span>${escapeHtml(b.text || 'Escribenos por WhatsApp')}</span></a></div>`;
}

function blockTable(b, css) {
  const cols = [2, 3, 4, 5].includes(Number(b.cols)) ? Number(b.cols) : 2;
  const headers = b.headers || [];
  const rows = (b.rows || []).slice(0, 16);
  const cell = (row, i) => {
    if (row === null || row === undefined) return '';
    if (Array.isArray(row)) return escapeHtml(row[i] || '');
    return escapeHtml(row['c' + i] || '');
  };
  const th = (i) => `<th>${escapeHtml(headers[i] || '')}</th>`;
  const td = (row, i) => `<td>${cell(row, i)}</td>`;
  let html = '';
  if (b.showHeader !== false) {
    html += '<thead><tr>' + Array.from({ length: cols }, (_, i) => th(i)).join('') + '</tr></thead>';
  }
  html += '<tbody>' + rows.map(r => '<tr>' + Array.from({ length: cols }, (_, i) => td(r, i)).join('') + '</tr>').join('') + '</tbody>';
  return `<div class="ab-table-wrap" style="${css};"><table class="ab-table">${html}</table></div>`;
}

function blockFaq(b, css) {
  const items = (b.items || []).filter(x => x && (x.q || x.a));
  if (!items.length) return '';
  return `<div class="ab-faq" style="${css};">` + items.map((it, i) => `
    <div class="ab-faq-item${b.openFirst && i === 0 ? ' open' : ''}">
      <button class="ab-faq-q" type="button"><span>${escapeHtml(it.q || 'Pregunta')}</span><span class="ab-faq-chev">+</span></button>
      <div class="ab-faq-a">${escapeHtml(it.a || '')}</div>
    </div>`).join('') + '</div>';
}

function blockCarousel(b, css) {
  const items = (b.items || []).filter(x => x && x.text);
  if (!items.length) return '';
  const slides = items.map(it => `
    <div class="ab-car-slide">
      <div class="ab-car-stars">${'<span>★</span>'.repeat(Math.min(5, Math.max(0, Number(it.stars) || 5)))}</div>
      <div class="ab-car-text">${escapeHtml(it.text)}</div>
      <div class="ab-car-author">
        ${it.img ? `<img src="${escapeHtml(it.img)}" alt="" onerror="this.style.display='none'">` : `<span class="ab-car-av">${escapeHtml((it.name || '\u00B7').slice(0, 1))}</span>`}
        <span>${escapeHtml(it.name || '')}${it.role ? `<em>${escapeHtml(it.role)}</em>` : ''}</span>
      </div>
    </div>`).join('');
  return `<div class="ab-car" style="${css};">
    <div class="ab-car-window"><div class="ab-car-track">${slides}</div></div>
    <div class="ab-car-foot"><button class="ab-car-nav prev" type="button">\u2039</button><div class="ab-car-dots"></div><button class="ab-car-nav next" type="button">\u203A</button></div>
  </div>`;
}

function blockCounters(b, css) {
  const stats = (b.stats || []).filter(x => x && (x.value || x.label));
  if (!stats.length) return '';
  const cols = Math.min(4, Math.max(1, stats.length));
  const inner = stats.map(s => `
    <div class="ab-stat">
      ${s.icon ? `<span class="ab-stat-icon">${iconSpan(s.icon, { size: s.iconSize || 20, color: s.iconColor ? s.iconColor : 'var(--t-accent)' })}</span>` : ''}
      <div class="ab-stat-num" data-count="${escapeHtml(s.value)}"${s.suffix ? ` data-suffix="${escapeHtml(s.suffix)}"` : ''}>0</div>
      ${s.label ? `<div class="ab-stat-label">${escapeHtml(s.label)}</div>` : ''}
    </div>`).join('');
  return `<div class="ab-counters" style="${css};grid-template-columns:repeat(${cols},1fr);">${inner}</div>`;
}

function blockCountdown(b, css) {
  return `<div class="ab-cd" data-target="${escapeHtml(b.target || '')}" style="${css};">
    <div class="ab-cd-boxes">
      <div class="ab-cd-box"><span data-d>0</span><label>dias</label></div>
      <div class="ab-cd-box"><span data-h>0</span><label>horas</label></div>
      <div class="ab-cd-box"><span data-m>0</span><label>min</label></div>
      <div class="ab-cd-box"><span data-s>0</span><label>seg</label></div>
    </div>
    ${b.label ? `<div class="ab-cd-label">${escapeHtml(b.label)}</div>` : ''}
    <div class="ab-cd-end">${escapeHtml(b.endText || 'El evento ha finalizado')}</div>
  </div>`;
}

function blockMap(b, css) {
  const src = b.embed || b.url || '';
  return `<div class="ab-map" style="${css};">
    ${src ? `<div class="ab-map-frame"><iframe src="${escapeHtml(src)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" title="Mapa"></iframe></div>`
          : `<div class="ab-map-ph">Pega el enlace del mapa en el editor</div>`}
    ${b.address ? `<div class="ab-map-addr">${escapeHtml(b.address)}</div>` : ''}
    ${b.showBtn && b.address ? `<a class="ab-map-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">Como llegar</a>` : ''}
  </div>`;
}

function blockGallery(b, css) {
  const imgs = (b.images || []).filter(x => x && x.url);
  if (!imgs.length) return '';
  const cols = [2, 3].includes(Number(b.cols)) ? Number(b.cols) : 2;
  const inner = imgs.map(g => `
    <figure class="ab-gal-img" data-src="${escapeHtml(g.url)}" data-cap="${escapeHtml(g.cap || '')}" role="button" tabindex="0" aria-label="Ampliar imagen">
      <img src="${escapeHtml(g.url)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%2318181b%22/%3E%3C/svg%3E';">
      ${g.cap ? `<figcaption>${escapeHtml(g.cap)}</figcaption>` : ''}
    </figure>`).join('');
  return `<div class="ab-gallery" style="${css};grid-template-columns:repeat(${cols},1fr);">${inner}</div>`;
}

function blockForm(b, css) {
  const dest = b.email || '';
  const inputs = [];
  if (b.showName !== false) inputs.push(`<label>Nombre<input class="ab-form-in" data-f="Nombre" type="text" placeholder="Tu nombre"></label>`);
  if (b.showEmail !== false) inputs.push(`<label>Correo<input class="ab-form-in" data-f="Correo" type="email" placeholder="tucorreo@ejemplo.com"></label>`);
  if (b.showPhone) inputs.push(`<label>Telefono<input class="ab-form-in" data-f="Telefono" type="tel" placeholder="+57 300 000 0000"></label>`);
  if (b.showMessage !== false) inputs.push(`<label>Mensaje<textarea class="ab-form-in" data-f="Mensaje" rows="4" placeholder="Escribe tu mensaje"></textarea></label>`);
  return `<form class="ab-form" data-email="${escapeHtml(dest)}" style="${css};">
    ${inputs.join('')}
    <button class="ab-form-btn" type="submit">${escapeHtml(b.btnText || 'Enviar mensaje')}</button>
    <div class="ab-form-ok">Mensaje listo. Revisa tu app de correo.</div>
  </form>`;
}

/* ---------------- Interactividad ----------------
   Se invoca tras renderizar: initBlocks(root) bindea FAQ, carrusel,
   contadores, cuenta regresiva, galeria (lightbox) y formulario. */
const rootTimers = new WeakMap();
export function initBlocks(root) {
  if (!root) return;
  const timers = rootTimers.get(root) || [];
  timers.forEach(clearInterval);
  rootTimers.set(root, []);
  const addTimer = (t) => { rootTimers.get(root).push(t); };
  initFaq(root);
  initCarousel(root, addTimer);
  initCounters(root);
  initCountdown(root, addTimer);
  initGallery(root);
  initForms(root);
}

function initFaq(root) {
  root.querySelectorAll('.ab-faq-q').forEach(q => {
    if (q.__af) return;
    q.__af = true;
    q.addEventListener('click', () => {
      const item = q.closest('.ab-faq-item');
      const wasOpen = item.classList.contains('open');
      q.closest('.ab-faq').querySelectorAll('.ab-faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

function initCarousel(root, addTimer) {
  root.querySelectorAll('.ab-car').forEach(car => {
    if (car.__af) return;
    car.__af = true;
    const track = car.querySelector('.ab-car-track');
    const dotsWrap = car.querySelector('.ab-car-dots');
    if (!track || !track.children.length) return;
    const slides = Array.from(track.children);
    if (slides.length <= 1) {
      const foot = car.querySelector('.ab-car-foot');
      if (foot) foot.style.display = 'none';
      return;
    }
    let idx = 0;
    const n = slides.length;
    const dots = [];
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'ab-car-dot';
      d.setAttribute('aria-label', 'Ir al testimonio ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
      dots.push(d);
    });
    const go = (i) => {
      idx = (i + n) % n;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      dots.forEach((d, j) => d.classList.toggle('active', j === idx));
    };
    car.querySelectorAll('.ab-car-nav.prev').forEach(b => b.addEventListener('click', () => go(idx - 1)));
    car.querySelectorAll('.ab-car-nav.next').forEach(b => b.addEventListener('click', () => go(idx + 1)));
    go(0);
    if (car.dataset.auto === '1') addTimer(setInterval(() => go(idx + 1), 3800));
  });
}

function initCounters(root) {
  root.querySelectorAll('.ab-stat-num[data-count]').forEach(num => {
    if (num.__af) return;
    num.__af = true;
    const target = parseFloat(num.dataset.count) || 0;
    const suffix = num.dataset.suffix || '';
    const dur = 1400;
    const fmt = (v) => {
      if (v % 1 !== 0) return v.toFixed(1) + suffix;
      return Math.round(v).toLocaleString('es') + suffix;
    };
    const run = () => {
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        num.textContent = fmt(e * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(num);
    } else run();
  });
}

function initCountdown(root, addTimer) {
  const cds = root.querySelectorAll('.ab-cd');
  if (!cds.length) return;
  const pad = v => String(v).padStart(2, '0');
  const tick = () => {
    cds.forEach(cd => {
      const t = new Date(cd.dataset.target).getTime();
      if (isNaN(t)) return;
      const diff = t - Date.now();
      if (diff <= 0) { cd.classList.add('done'); return; }
      cd.querySelector('[data-d]').textContent = pad(Math.floor(diff / 86400000));
      cd.querySelector('[data-h]').textContent = pad(Math.floor(diff % 86400000 / 3600000));
      cd.querySelector('[data-m]').textContent = pad(Math.floor(diff % 3600000 / 60000));
      cd.querySelector('[data-s]').textContent = pad(Math.floor(diff % 60000 / 1000));
    });
  };
  tick();
  addTimer(setInterval(tick, 1000));
}

let lbEl = null;
function initGallery(root) {
  root.querySelectorAll('.ab-gallery').forEach(gal => {
    gal.querySelectorAll('.ab-gal-img').forEach(img => {
      if (img.__af) return;
      img.__af = true;
      const open = () => openLightbox(gal, img);
      img.addEventListener('click', open);
      img.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });
  });
}

function openLightbox(gal, cur) {
  if (lbEl) lbEl.remove();
  const imgs = Array.from(gal.querySelectorAll('.ab-gal-img'))
    .map(i => ({ src: i.dataset.src, cap: i.dataset.cap })).filter(i => i.src);
  if (!imgs.length) return;
  let i = Math.max(0, imgs.findIndex(x => x.src === cur.dataset.src));
  lbEl = document.createElement('div');
  lbEl.className = 'ab-lb';
  lbEl.innerHTML = '<button class="ab-lb-close" aria-label="Cerrar">\u00D7</button><button class="ab-lb-btn prev" aria-label="Anterior">\u2039</button><img class="ab-lb-img" alt=""><button class="ab-lb-btn next" aria-label="Siguiente">\u203A</button><div class="ab-lb-cap"></div>';
  const show = () => {
    lbEl.querySelector('.ab-lb-img').src = imgs[i].src;
    lbEl.querySelector('.ab-lb-cap').textContent = imgs[i].cap || '';
    lbEl.querySelector('.ab-lb-btn.prev').style.display = imgs.length > 1 ? 'flex' : 'none';
    lbEl.querySelector('.ab-lb-btn.next').style.display = imgs.length > 1 ? 'flex' : 'none';
  };
  lbEl.querySelector('.ab-lb-close').addEventListener('click', () => lbEl.remove());
  lbEl.querySelector('.ab-lb-btn.prev').addEventListener('click', (e) => { e.stopPropagation(); i = (i - 1 + imgs.length) % imgs.length; show(); });
  lbEl.querySelector('.ab-lb-btn.next').addEventListener('click', (e) => { e.stopPropagation(); i = (i + 1) % imgs.length; show(); });
  lbEl.addEventListener('click', (e) => { if (e.target === lbEl) lbEl.remove(); });
  document.addEventListener('keydown', lbKey);
  function lbKey(e) {
    if (e.key === 'Escape') { if (lbEl) lbEl.remove(); document.removeEventListener('keydown', lbKey); }
    if (lbEl && e.key === 'ArrowRight') { i = (i + 1) % imgs.length; show(); }
    if (lbEl && e.key === 'ArrowLeft') { i = (i - 1 + imgs.length) % imgs.length; show(); }
  }
  show();
  document.body.appendChild(lbEl);
}

function initForms(root) {
  root.querySelectorAll('.ab-form').forEach(form => {
    if (form.__af) return;
    form.__af = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.dataset.email || '';
      const subject = encodeURIComponent('Contacto desde la app');
      const parts = [];
      form.querySelectorAll('[data-f]').forEach(el => {
        const v = el.value.trim();
        if (v) parts.push('-- ' + el.dataset.f + ':\n' + v);
      });
      if (!parts.length) return;
      const body = encodeURIComponent(parts.join('\n\n'));
      if (email) window.location.href = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
      const ok = form.querySelector('.ab-form-ok');
      if (ok) ok.style.display = 'block';
    });
  });
}