/* ============================================================================
   AppForge - Glass shell compartido
   Inyecta el sidebar de vidrio (si no existe) y gestiona ventanas flotantes.
   Configuracion por pagina (antes de incluir este script):
     window.GLASS_MENU = [
       { i:"fa-house", label:"Inicio", win:"home" },          // abre ventana .gwin[data-win=home]
       { i:"fa-rocket", label:"Como funciona", win:"como" },
       { i:"fa-dollar-sign", label:"Planes", win:"planes", rail:true },
       { i:"fa-user", label:"Mis apps", href:"dashboard.html" }
     ]
   Los menus con `href` navegan; los con `win` abren/cierran ventanas flotantes.
   ============================================================================ */
(function () {
  "use strict";

  var MENU = window.GLASS_MENU || [
    { i: "fa-house", label: "Inicio", href: "index.html", rail: true },
    { i: "fa-dollar-sign", label: "Planes", href: "plans.html", rail: true },
    { i: "fa-user", label: "Mis apps", href: "dashboard.html", rail: true }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var el = function (id) { return document.getElementById(id); };

  function setBody() {
    // el editor conserva su layout nativo (solo shell + fondo)
    if (document.body.classList.contains("editor")) {
      if (!document.body.classList.contains("has-glass")) document.body.classList.add("has-glass");
      return;
    }
    if (!document.body.classList.contains("home")) document.body.classList.add("home");
    if (!document.body.classList.contains("glass-windowed")) document.body.classList.add("glass-windowed");
  }

  /* ---------------- Sidebar ---------------- */
  function railItems() {
    var out = [];
    for (var i = 0; i < MENU.length; i++) {
      if (MENU[i].rail && out.length < 4) out.push(MENU[i]);
    }
    return out;
  }

  function buildShell() {
    if (el("glassWrap")) return;

    setBody();

    var html = '<div class="glass-wrap" id="glassWrap">';
    html += '<aside class="sidebar glass-sidebar">';
    html += '<div class="window-btns"><span class="gw-green"></span><span class="gw-red"></span><span class="gw-yellow"></span></div>';
    html += '<div class="logo glass-logo"><button id="toggle" aria-label="Menu"><i class="fa-solid fa-wand-magic-sparkles"></i></button></div>';
    html += '<div class="line glass-line"></div>';

    var rail = railItems();
    if (rail.length) {
      html += '<ul class="mini-menu">';
      for (var r = 0; r < rail.length; r++) {
        html += '<li data-action="' + esc(rail[r].href || ("win:" + rail[r].win)) + '" title="' + esc(rail[r].label) + '"><i class="fa-solid ' + esc(rail[r].i) + '"></i></li>';
      }
      html += '</ul><div class="line glass-line"></div>';
    }

    html += '<ul class="mini-menu"><li data-action="win:profile" title="Cuenta"><i class="fa-solid fa-user"></i></li></ul>';
    html += '<div class="profile glass-profile"><a href="login.html"><img id="miniAvatar" alt=""></a></div>';
    html += '</aside>';

    html += '<section class="panel glass-panel">';
    html += '<div class="window-btns big"><span class="gw-green"></span><span class="gw-red"></span><span class="gw-yellow"></span></div>';
    html += '<h1>AppForge</h1>';
    html += '<span class="menu-title">MENU</span>';
    html += '<div class="divider glass-divider"></div>';
    html += '<ul class="menu glass-menu" id="gm-main"></ul>';
    html += '<div class="divider glass-divider"></div>';
    html += '<ul class="menu glass-menu secondary">';
    html += '<li id="li-login" data-action="href:login.html"><div><i class="fa-solid fa-right-to-bracket"></i><span>Iniciar sesion</span></div></li>';
    html += '<li id="li-apps" class="hidden" data-action="href:dashboard.html"><div><i class="fa-solid fa-user"></i><span>Mis apps</span></div></li>';
    html += '<li id="li-logout" class="hidden"><div><i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesion</span></div></li>';
    html += '</ul>';
    html += '<div class="divider glass-divider bottom"></div>';
    html += '<a class="account glass-account" href="login.html" id="accountLink">';
    html += '<img id="accountAvatar" src="" alt="">';
    html += '<div><h3 id="accountName">Invitado</h3><small id="accountEmail">Conectate con tu cuenta</small></div>';
    html += '<i class="fa-solid fa-angle-right"></i>';
    html += '</a>';
    html += '</section>';
    html += '</div>';

    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    var first = document.body.firstChild;
    while (wrap.firstChild) {
      var node = wrap.firstChild;
      wrap.removeChild(node);
      document.body.insertBefore(node, first);
    }

    fillMenu();
    wireToggle();
    wireActions();
  }

  function fillMenu() {
    var ul = el("gm-main");
    if (!ul) return;
    for (var i = 0; i < MENU.length; i++) {
      var it = MENU[i];
      var a = it.win ? ("win:" + it.win) : ("href:" + it.href);
      var dot = it.dot ? '<span class="dot"></span>' : "";
      ul.insertAdjacentHTML("beforeend",
        '<li data-action="' + esc(a) + '"><div><i class="fa-solid ' + esc(it.i) + '"></i><span>' + esc(it.label) + '</span></div>' + dot + '</li>');
    }
  }

  function wireToggle() {
    var t = el("toggle");
    var w = el("glassWrap");
    if (t && w) t.addEventListener("click", function () { w.classList.toggle("open"); });
  }

  function doAction(action) {
    var w = el("glassWrap");
    if (w) w.classList.remove("open");
    if (!action) return;
    if (action.indexOf("win:") === 0) { Glass.open(action.slice(4)); return; }
    if (action.indexOf("href:") === 0) { window.location.assign(action.slice(5)); return; }
  }

  function wireActions() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-action]") : null;
      if (!t) return;
      doAction(t.getAttribute("data-action"));
    });
    var lg = el("li-logout");
    if (lg) lg.addEventListener("click", function () {
      if (window.logoutUser) { window.logoutUser(); } else if (window.Glass && window.Glass._logout) { window.Glass._logout(); } else { Glass.setUser(null); }
    });
  }

  /* ---------------- Window manager ---------------- */
  function openWin(id) {
    var any = false;
    document.querySelectorAll(".gwin").forEach(function (win) {
      if (win.getAttribute("data-win") === id) { win.classList.add("open"); any = true; }
      else win.classList.remove("open");
    });
    // si no existe la ventana, podria navegar a una pagina
    return any;
  }
  function closeWin(id) {
    var win = document.querySelector('.gwin[data-win="' + id + '"]');
    if (win) win.classList.remove("open");
  }

  function initWindows() {
    document.querySelectorAll(".gwin").forEach(function (win) {
      var close = win.querySelector(".gwin-close");
      if (close) close.addEventListener("click", function () { win.classList.remove("open"); });
      if (win.getAttribute("data-auth") !== undefined) {
        // marca para actualizar segun sesion (vacio por ahora)
      }
    });
    // abrir la ventana primaria marcada con data-win-open
    document.querySelectorAll(".gwin[data-win-open]").forEach(function (win, idx, list) {
      if (idx > 0) return; // solo la primera
      win.classList.add("open");
    });
  }

  /* ---------------- Auth ---------------- */
  var user = null;
  function setUser(u) {
    user = u;
    var nameEl = el("accountName"), emailEl = el("accountEmail"),
      avEl = el("accountAvatar"), minAv = el("miniAvatar"),
      logL = el("li-login"), appsL = el("li-apps"), outL = el("li-logout"),
      acc = el("accountLink");
    var log = !!u;
    if (logL) logL.classList.toggle("hidden", log);
    if (appsL) appsL.classList.toggle("hidden", !log);
    if (outL) outL.classList.toggle("hidden", !log);
    if (acc) acc.setAttribute("href", log ? "dashboard.html" : "login.html");
    if (u) {
      if (nameEl) nameEl.textContent = u.name || "Mi cuenta";
      if (emailEl) emailEl.textContent = u.email || "";
      if (avEl) avEl.setAttribute("src", u.avatar || "");
      if (minAv) minAv.setAttribute("src", u.avatar || "");
    } else {
      if (nameEl) nameEl.textContent = "Invitado";
      if (emailEl) emailEl.textContent = "Conectate con tu cuenta";
      if (avEl) avEl.setAttribute("src", "");
      if (minAv) minAv.setAttribute("src", "");
    }
    // evento para que cada pagina reaccione
    document.dispatchEvent(new CustomEvent("glass:user", { detail: u }));
  }

  var Glass = {
    open: openWin,
    close: closeWin,
    setUser: setUser,
    getUser: function () { return user; },
    _logout: null
  };
  window.Glass = Glass;

  function start() {
    buildShell();
    initWindows();
    // si la pagina ya puso un usuario global
    if (window.GLASS_INIT_USER) setUser(window.GLASS_INIT_USER);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();