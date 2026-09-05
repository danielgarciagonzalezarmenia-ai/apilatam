import { escapeHtml } from './util.js?v=1';

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

export function defaultBlocks() {
  return [
    { id: 'b' + Date.now() + 'a', type: 'header', text: 'Mi App', subtitle: 'Creada con AppForge', showLogo: true, logo: '', align: 'center' },
    { id: 'b' + Date.now() + 'b', type: 'text', text: 'Escribe aqui la bienvenida de tu app. Personaliza este texto desde el editor.', align: 'center' },
    { id: 'b' + Date.now() + 'c', type: 'button', text: 'Empezar', url: 'https://example.com', variant: 'solid' },
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
  const logo = b.showLogo && b.logo
    ? `<img class="ab-logo" src="${escapeHtml(b.logo)}" alt="" onerror="this.style.display='none'">`
    : '';
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
  let style = '';
  if (variant === 'solid') style = `background:var(--t-accent);color:#000;`;
  else if (variant === 'outline') style = `border:1.5px solid var(--t-accent);color:var(--t-accent);background:transparent;`;
  else style = `color:var(--t-accent);background:transparent;`;
  style = 'display:inline-block;padding:13px 28px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;' + style;
  let attrs = 'href="#"';
  if (b.linkTarget) attrs = `data-af-page="${escapeHtml(b.linkTarget)}"`;
  else if (b.linkUrl) attrs = `href="${escapeHtml(b.linkUrl)}" target="_blank" rel="noopener"`;
  return `<div class="ab-button" style="${css};text-align:${b.align || 'center'};"><a style="${style}" ${attrs}>${escapeHtml(b.text || 'Boton')}</a></div>`;
}

function blockVideo(b, css) {
  if (b.type === 'youtube' && b.url) {
    const id = youtubeId(b.url);
    if (id) {
      return `<div class="ab-video" style="${css};"><div class="ab-video-box" style="position:relative;width:100%;aspect-ratio:16/9;border-radius:var(--t-radius);overflow:hidden;background:#000;"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe></div></div>`;
    }
  }
  return `<div class="ab-video" style="${css};"><video controls playsinline preload="metadata" style="width:100%;border-radius:var(--t-radius);background:#000;aspect-ratio:16/9;" src="${escapeHtml(b.url || '')}"></video></div>`;
}

function blockHtml(b, css) {
  return `<div class="ab-html" style="${css};">${b.html || ''}</div>`;
}

function blockList(b, css) {
  const items = (b.items || []).filter(x => x && x.text);
  const list = items.map(x => {
    const content = `${x.icon ? `<span class="ab-list-icon" style="background:var(--t-accent);">${escapeHtml(x.icon)}</span>` : ''}
      <div><div class="ab-list-title">${escapeHtml(x.text)}</div>${x.desc ? `<div class="ab-list-desc">${escapeHtml(x.desc)}</div>` : ''}</div>`;
    const lk = x.linkTarget || x.linkUrl ? linkMarkup(x) : null;
    if (lk) {
      return `<a class="ab-list-item" ${lk.open.includes('data-af-page') ? `data-af-page="${escapeHtml(x.linkTarget)}"` : `href="${escapeHtml(x.linkUrl)}" target="_blank" rel="noopener"`} style="text-decoration:none;">${content}</a>`;
    }
    return `<div class="ab-list-item">${content}</div>`;
  }).join('');
  return `<div class="ab-list" style="${css};">${list}</div>`;
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