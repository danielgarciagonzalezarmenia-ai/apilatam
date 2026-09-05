import { escapeHtml } from './util.js?v=1';

export const ICON_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';

export function loadIconFont() {
  return new Promise((resolve) => {
    let link = document.querySelector('link[data-af-icons]');
    const done = () => { link.onload = link.onerror = null; resolve(); };
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.afIcons = '';
      link.onload = done;
      link.onerror = done;
      link.href = ICON_FONT_HREF;
      document.head.appendChild(link);
      return;
    }
    if (link.href === ICON_FONT_HREF) { resolve(); return; }
    link.onload = done;
    link.onerror = done;
    link.href = ICON_FONT_HREF;
  });
}

const NAV = ['home', 'menu', 'close', 'search', 'arrow_back', 'arrow_forward', 'arrow_upward', 'arrow_downward', 'chevron_left', 'chevron_right', 'expand_more', 'expand_less', 'more_vert', 'more_horiz', 'apps', 'refresh', 'logout', 'login', 'settings', 'notifications', 'place', 'link', 'open_in_new', 'account_circle'];

const ACTIONS = ['add', 'edit', 'delete', 'save', 'download', 'upload', 'share', 'favorite', 'star', 'visibility', 'thumb_up', 'thumb_down', 'bookmark', 'play_arrow', 'pause', 'skip_next', 'replay', 'volume_up', 'volume_off', 'photo_camera', 'videocam', 'music_note', 'check', 'close', 'restart_alt', 'done_all', 'filter_list', 'sort'];

const COMMERCE = ['shopping_cart', 'shopping_bag', 'storefront', 'local_mall', 'payments', 'credit_card', 'sell', 'request_quote', 'receipt_long', 'account_balance_wallet', 'currency_exchange', 'paid', 'savings', 'trending_up', 'trending_down', 'leaderboard', 'bar_chart', 'query_stats', 'monitoring', 'store'];

const COMMUNICATION = ['send', 'call', 'mail', 'drafts', 'forum', 'chat', 'sms', 'notifications_active', 'campaign', 'record_voice_over', 'mark_email_read', 'mark_unread_chat', 'alternate_email', 'voicemail', 'contact_phone'];

const PEOPLE = ['person', 'person_add', 'group', 'groups', 'public', 'face', 'manage_accounts', 'badge', 'verified_user', 'work', 'school', 'emoji_emotions', 'wc', 'celebration', 'volunteer_activism', 'supervised_user_circle'];

const TIME = ['calendar_today', 'calendar_month', 'schedule', 'alarm', 'today', 'event_available', 'bedtime', 'history', 'date_range', 'hourglass_bottom', 'hourglass_top', 'timer'];

const FILES = ['description', 'insert_drive_file', 'folder', 'folder_open', 'attach_file', 'attachment', 'cloud', 'cloud_done', 'cloud_upload', 'cloud_download', 'file_download', 'file_upload', 'picture_as_pdf', 'article', 'notes', 'menu_book', 'checklist', 'contact_mail', 'event_note'];

const HEALTH = ['favorite', 'local_hospital', 'monitoring', 'health_and_safety', 'accessibility', 'fitness_center', 'science', 'covid', 'medication', 'bloodtype', 'masks', 'pregnant_woman', 'elderly'];

const FUN = ['sports_soccer', 'sports_basketball', 'sports_esports', 'casino', 'cake', 'travel_explore', 'flight', 'hotel', 'campground', 'beach_access', 'pets', 'park', 'restaurant', 'local_cafe', 'local_bar', 'emoji_events', 'trophy', 'military_tech', 'workspace_premium', 'stadium', 'festival', 'music_note'];

const OBJECTS = ['smartphone', 'tablet_mac', 'laptop', 'tv', 'headphones', 'speaker', 'watch', 'memory', 'router', 'battery_full', 'bolt', 'light_mode', 'dark_mode', 'thermostat', 'water_drop', 'eco', 'grass', 'home_repair_service', 'electric_bolt', 'solar_power'];

const INFO = ['info', 'help', 'warning', 'error', 'check_circle', 'cancel', 'lock', 'lock_open', 'shield', 'gpp_good', 'security', 'fingerprint', 'password', 'key', 'admin_panel_settings', 'question_mark', 'block', 'new_releases', 'verified'];

const CATEGORIES = [
  { id: 'nav', label: 'Navegacion', icons: NAV },
  { id: 'actions', label: 'Acciones', icons: ACTIONS },
  { id: 'commerce', label: 'Comercio', icons: COMMERCE },
  { id: 'comm', label: 'Comunicacion', icons: COMMUNICATION },
  { id: 'people', label: 'Personas', icons: PEOPLE },
  { id: 'time', label: 'Tiempo', icons: TIME },
  { id: 'files', label: 'Archivos', icons: FILES },
  { id: 'health', label: 'Salud', icons: HEALTH },
  { id: 'fun', label: 'Ocio', icons: FUN },
  { id: 'objects', label: 'Objetos', icons: OBJECTS },
  { id: 'info', label: 'Informacion', icons: INFO }
];

export const ICON_CATEGORIES = CATEGORIES;
export const ALL_ICONS = [...new Set(CATEGORIES.flatMap(c => c.icons))];

export function iconSpan(name, options = {}) {
  if (!name) return '';
  const size = options.size || 20;
  const color = options.color || 'currentColor';
  if (!/^[a-z0-9_]+$/.test(name)) {
    return `<span class="af-icon-char" style="font-size:${size}px;color:${color};display:inline-flex;align-items:center;justify-content:center;line-height:1;">${escapeHtml(name)}</span>`;
  }
  return `<span class="af-icon" style="font-size:${size}px;color:${color};" aria-hidden="true">${escapeHtml(name)}</span>`;
}