let playerSeq = 0;

function fmtTime(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const s = Math.floor(t % 60);
  const m = Math.floor((t / 60) % 60);
  const h = Math.floor(t / 3600);
  return h > 0
    ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
    : m + ':' + String(s).padStart(2, '0');
}

function icon(name) {
  const paths = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
    exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };
  return paths[name] || '';
}

export async function initPlayer(host, { streamUrl, title = '', tag = '' } = {}) {
  if (!host) throw new Error('No host element');
  playerSeq++;
  const id = 'ltv-player-' + playerSeq;

  host.innerHTML = `
    <div class="player-shell" id="${id}">
      <video playsinline preload="metadata"></video>

      <div class="player-top">
        <div class="title"><span class="tag">${tag}</span>
          <span class="ptitle"></span>
        </div>
      </div>

      <div class="player-spinner">
        <div class="spin"></div>
      </div>

      <div class="player-bigplay">
        <div class="ring">${icon('play')}</div>
      </div>

      <div class="player-controls">
        <div class="seek-wrap">
          <input type="range" class="seek-bar" min="0" max="100" step="0.1" value="0">
          <span class="time">0:00 / 0:00</span>
        </div>
        <div class="control-row">
          <button class="p-btn primary" data-act="play">${icon('play')}</button>
          <button class="p-btn" data-act="mute">${icon('vol')}</button>
          <input type="range" class="vol-bar" min="0" max="1" step="0.05" value="1">
          <span class="p-spacer"></span>
          <button class="p-btn" data-act="full">${icon('full')}</button>
        </div>
      </div>

      <div class="player-error hidden">
        <h3>No se pudo reproducir</h3>
        <p></p>
        <button class="btn btn-secondary" data-act="close">Cerrar reproductor</button>
      </div>
    </div>
  `;

  const shell = host.querySelector('.player-shell');
  const video = shell.querySelector('video');
  const playBtn = shell.querySelector('[data-act="play"]');
  const bigplay = shell.querySelector('.player-bigplay');
  const spinner = shell.querySelector('.player-spinner');
  const errorEl = shell.querySelector('.player-error');
  const errorMsg = shell.querySelector('.player-error p');
  const seek = shell.querySelector('.seek-bar');
  const volBar = shell.querySelector('.vol-bar');
  const timeEl = shell.querySelector('.time');
  const muteBtn = shell.querySelector('[data-act="mute"]');
  const fullBtn = shell.querySelector('[data-act="full"]');
  const closeBtn = shell.querySelector('[data-act="close"]');
  shell.querySelector('.ptitle').textContent = title;

  let hls = null;
  let playingReported = false;
  let uiTimer = null;
  let spinnerT = null;
  let autoplayMuted = false;
  const onPlaying = typeof window.__ltvOnPlaying === 'function' ? window.__ltvOnPlaying : null;

  function setPlayIcon(paused) {
    playBtn.innerHTML = paused ? icon('play') : icon('pause');
    bigplay.classList.toggle('hidden', !paused);
  }

  function showUI() {
    shell.classList.add('show-ui');
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => {
      if (!video.paused) shell.classList.remove('show-ui');
    }, 2600);
  }

  function showError(msg) {
    spinner.classList.add('hidden');
    bigplay.classList.add('hidden');
    errorMsg.textContent = msg || 'El formato o el enlace no se pueden reproducir en este navegador.';
    errorEl.classList.remove('hidden');
    shell.classList.add('show-ui');
  }

  function isHls(url) {
    return /\.m3u8($|\?)/i.test(url) || /application\/vnd\.apple\.mpegurl/i.test(url);
  }
  function isMkv(url) {
    return /\.mkv($|\?)/i.test(url);
  }

  async function load() {
    errorEl.classList.add('hidden');
    spinner.classList.remove('hidden');
    bigplay.classList.remove('hidden');
    setPlayIcon(true);
    startSpinnerTimeout();

    // Detect format: la extension es poco fiable (muchos proveedores usan .mkv
    // en URLs que en realidad son streams HLS o MP4/WebM reproducibles).
    let useHls = isHls(streamUrl);
    if (!useHls && shouldProbe(streamUrl)) {
      useHls = await probeHls(streamUrl);
    }

    if (useHls) {
      try {
        const Hls = (await import('https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.mjs')).default;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            spinner.classList.add('hidden');
            tryPlay();
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              showError('No se pudo conectar con el stream. Revisa el enlace del canal.');
            }
          });
          return;
        }
      } catch (e) {
        // fall back to native
      }
    }

    // native (mp4, webm, y .mkv cuyos proveedores sirven un stream reproducible)
    video.src = streamUrl;
    video.addEventListener('loadedmetadata', () => spinner.classList.add('hidden'), { once: true });
    video.addEventListener('canplay', () => spinner.classList.add('hidden'), { once: true });
    video.addEventListener('error', function e() {
      spinner.classList.add('hidden');
      bigplay.classList.remove('hidden');
      showError('No se pudo reproducir este enlace. Puede estar caido o el formato no es compatible con el navegador.');
      video.removeEventListener('error', e);
    }, { once: true });
    tryPlay();
  }

  function shouldProbe(url) {
    if (/\.(m3u8|mp4|m4v|webm|ogv|mov|mp3|m4a|aac)($|\?)/i.test(url)) return false;
    return (/^https?:/i.test(url));
  }

  async function probeHls(url) {
    try {
      const resp = await fetch(url, { headers: { Range: 'bytes=0-300' } });
      if (!resp.ok && resp.status !== 206) return false;
      const ct = (resp.headers.get('content-type') || '').toLowerCase();
      if (ct.indexOf('mpegurl') !== -1 || ct.indexOf('m3u8') !== -1) return true;
      const txt = await resp.text();
      if (/^#EXTM3U/i.test((txt || '').trim())) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function tryPlay() {
    const p = video.play();
    if (p && p.catch) p.catch(() => {
      if (!video.muted) {
        autoplayMuted = true;
        video.muted = true;
        muteBtn.innerHTML = icon('mute');
        const r = video.play();
        if (r && r.catch) r.catch(() => {
          spinner.classList.add('hidden');
          bigplay.classList.remove('hidden');
          showUI();
        });
      } else {
        spinner.classList.add('hidden');
        bigplay.classList.remove('hidden');
        showUI();
      }
    });
  }

  function unmuteIfAutoplay() {
    if (autoplayMuted) {
      autoplayMuted = false;
      video.muted = false;
      muteBtn.innerHTML = video.volume > 0 ? icon('vol') : icon('mute');
    }
  }

  function startSpinnerTimeout() {
    clearTimeout(spinnerT);
    spinnerT = setTimeout(() => {
      spinner.classList.add('hidden');
      if (video.paused) {
        bigplay.classList.remove('hidden');
        showUI();
      }
      if (autoplayMuted && video.paused) {
        autoplayMuted = false;
        video.muted = false;
        muteBtn.innerHTML = icon('vol');
      }
    }, 12000);
  }

  // events
  video.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
  video.addEventListener('play', () => {
    setPlayIcon(false);
    if (!playingReported) {
      playingReported = true;
      onPlaying && onPlaying({ title, tag });
    }
  });
  video.addEventListener('pause', () => setPlayIcon(true));
  video.addEventListener('playing', () => { spinner.classList.add('hidden'); });
  video.addEventListener('waiting', () => { if (!errorEl.classList.contains('shown')) spinner.classList.remove('hidden'); });
  video.addEventListener('timeupdate', () => {
    if (video.duration) {
      seek.value = (video.currentTime / video.duration) * 100;
      timeEl.textContent = fmtTime(video.currentTime) + ' / ' + fmtTime(video.duration);
    }
  });

  playBtn.addEventListener('click', () => { unmuteIfAutoplay(); video.paused ? video.play() : video.pause(); });
  bigplay.addEventListener('click', () => { unmuteIfAutoplay(); video.play(); });
  seek.addEventListener('input', () => {
    if (video.duration) video.currentTime = (seek.value / 100) * video.duration;
  });
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    autoplayMuted = false;
    muteBtn.innerHTML = video.muted ? icon('mute') : icon('vol');
  });
  volBar.addEventListener('input', () => {
    video.volume = Number(volBar.value);
    video.muted = Number(volBar.value) === 0;
    muteBtn.innerHTML = video.muted || video.volume === 0 ? icon('mute') : icon('vol');
  });
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shell.requestFullscreen && shell.requestFullscreen();
  });
  closeBtn.addEventListener('click', () => {
    video.pause();
    hls && hls.destroy();
    host.innerHTML = '';
  });

  shell.addEventListener('mousemove', showUI);
  shell.addEventListener('touchstart', showUI, { passive: true });
  shell.addEventListener('pointerdown', function firstTap() {
    unmuteIfAutoplay();
    shell.removeEventListener('pointerdown', firstTap);
  }, { once: true });

  await load();
  video.addEventListener('loadedmetadata', () => {
    if (!video.paused) playingReported = true;
  });

  return {
    shell,
    video,
    destroy() {
      video.pause();
      if (hls) hls.destroy();
      host.innerHTML = '';
    }
  };
}