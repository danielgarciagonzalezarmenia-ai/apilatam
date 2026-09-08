/* ============================================================================
   AppForge - Glass shell compartido (v2)
   Inyecta el sidebar de vidrio (si no existe) y gestiona ventanas flotantes.
   Configuracion por pagina (antes de incluir este script):
     window.GLASS_MENU = [
       { i:"fa-house", label:"Inicio", href:"index.html", rail:true },  // navega
       { i:"fa-dollar-sign", label:"Planes", win:"planes", rail:true }  // abre ventana
     ]
   Los items con `href` son <a> reales (navegan siempre, sin depender de JS);
   los con `win` son <button> que abren/cierran la ventana .gwin[data-win].
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
    if (document.body.classList.contains("editor")) {
      if (!document.body.classList.contains("has-glass")) document.body.classList.add("has-glass");
      return;
    }
    if (!document.body.classList.contains("home")) document.body.classList.add("home");
    if (!document.body.classList.contains("glass-windowed")) document.body.classList.add("glass-windowed");
  }

  function railItems() {
    var out = [];
    for (var i = 0; i < MENU.length; i++) if (MENU[i].rail && out.length < 4) out.push(MENU[i]);
    return out;
  }

  function buildShell() {
    var wrap = el("glassWrap");
    if (wrap) { setBody(); return; }
    setBody();

    var html = '<div class="glass-wrap" id="glassWrap">';
    html += '<aside class="sidebar glass-sidebar">';
    html += '<div class="window-btns"><span class="gw-green"></span><span class="gw-red"></span><span class="gw-yellow"></span></div>';
    html += '<div class="logo glass-logo"><button id="toggle" aria-label="Menu"><i class="fa-solid fa-wand-magic-sparkles"></i></button></div>';
    html += '<div class="line glass-line"></div>';
    html += '<ul class="mini-menu" id="mini-rail"></ul>';
    html += '<div class="line glass-line"></div>';
    html += '<div class="profile glass-profile"><a href="dashboard.html" id="railAcct" title="Mi cuenta"><img id="miniAvatar" alt=""></a></div>';
    html += '</aside>';
    html += '<section class="panel glass-panel">';
    html += '<div class="window-btns big"><span class="gw-green"></span><span class="gw-red"></span><span class="gw-yellow"></span></div>';
    html += '<h1>AppForge</h1>';
    html += '<span class="menu-title">MENU</span>';
    html += '<div class="divider glass-divider"></div>';
    html += '<ul class="menu glass-menu" id="gm-main"></ul>';
    html += '<div class="divider glass-divider"></div>';
    html += '<ul class="menu glass-menu secondary">';
    html += '<li id="li-login"><a class="gnav" href="login.html"><div class="gi"><i class="fa-solid fa-right-to-bracket"></i><span class="txt">Iniciar sesion</span></div></a></li>';
    html += '<li id="li-apps" class="hidden"><a class="gnav" href="dashboard.html"><div class="gi"><i class="fa-solid fa-user"></i><span class="txt">Mis apps</span></div></a></li>';
    html += '<li id="li-logout" class="hidden"><button class="gnav" type="button" data-glogout="1"><div class="gi"><i class="fa-solid fa-right-from-bracket"></i><span class="txt">Cerrar sesion</span></div></button></li>';
    html += '</ul>';
    html += '<div class="divider glass-divider bottom"></div>';
    html += '<a class="account glass-account" href="dashboard.html" id="accountLink">';
    html += '<img id="accountAvatar" src="" alt="">';
    html += '<div><h3 id="accountName">Invitado</h3><small id="accountEmail">Conectate con tu cuenta</small></div>';
    html += '<i class="fa-solid fa-angle-right"></i>';
    html += '</a>';
    html += '</section>';
    html += '</div>';

    var t = document.createElement("template");
    t.innerHTML = html;
    // insertar al inicio del body
    while (t.content.firstChild) document.body.insertBefore(t.content.firstChild, document.body.firstChild);

    fillRail();
    fillMenu();
    wire();
  }

  function fillRail() {
    var ul = el("mini-rail");
    if (!ul) return;
    var rail = railItems();
    ul.innerHTML = "";
    rail.forEach(function (it) {
      var li = document.createElement("li");
      if (it.href) {
        var a = document.createElement("a");
        a.className = "gnav rail";
        a.href = it.href;
        a.title = it.label;
        a.setAttribute("aria-label", it.label);
        a.innerHTML = '<i class="fa-solid ' + esc(it.i) + '"></i>';
        li.appendChild(a);
      } else if (it.win) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "gnav rail";
        b.title = it.label;
        b.setAttribute("data-win", it.win);
        b.innerHTML = '<i class="fa-solid ' + esc(it.i) + '"></i>';
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
  }

  function fillMenu() {
    var ul = el("gm-main");
    if (!ul) return;
    ul.innerHTML = "";
    MENU.forEach(function (it, idx) {
      var li = document.createElement("li");
      if (idx === 0) li.classList.add("current");
      var icon = '<i class="fa-solid ' + esc(it.i) + '"></i>';
      if (it.href) {
        var a = document.createElement("a");
        a.className = "gnav";
        a.href = it.href;
        a.innerHTML = '<div class="gi">' + icon + '<span class="txt">' + esc(it.label) + '</span></div>';
        li.appendChild(a);
      } else if (it.win) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "gnav";
        b.setAttribute("data-win", it.win);
        b.innerHTML = '<div class="gi">' + icon + '<span class="txt">' + esc(it.label) + '</span></div>';
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
  }

  function wire() {
    var w = el("glassWrap");
    var t = el("toggle");
    if (t && w) t.addEventListener("click", function () { w.classList.toggle("open"); });

    // cualquiera con [data-win] abre/cierra esa ventana y cierra el panel
    document.addEventListener("click", function (e) {
      var target = e.target && e.target.closest ? e.target.closest("[data-win]") : null;
      if (!target) return;
      e.preventDefault();
      if (w) w.classList.remove("open");
      Glass.open(target.getAttribute("data-win"));
    });

    // cerrar sesion
    document.addEventListener("click", function (e) {
      var lg = e.target && e.target.closest ? e.target.closest("[data-glogout]") : null;
      if (!lg) return;
      e.preventDefault();
      Glass._logout ? Glass._logout() : Glass.setUser(null);
    });

    // cerrar la ventana con su boton / al pulsar Escape
    document.addEventListener("click", function (e) {
      var c = e.target.closest ? e.target.closest(".gwin-close") : null;
      if (c) { var win = c.closest(".gwin"); if (win) win.classList.remove("open"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") document.querySelectorAll(".gwin.open").forEach(function (x) { x.classList.remove("open"); });
    });
  }

  /* ---------------- Window manager ---------------- */
  function openWin(id) {
    var found = false;
    document.querySelectorAll(".gwin").forEach(function (win) {
      if (win.getAttribute("data-win") === id) { win.classList.add("open"); found = true; }
      else win.classList.remove("open");
    });
    // si la pagina no tiene esa ventana pero si la pagina destino,... nada
    return found;
  }
  function closeWin(id) {
    var win = document.querySelector('.gwin[data-win="' + id + '"]');
    if (win) win.classList.remove("open");
  }

  /* ---------------- Auth ---------------- */
  var user = null;
  function setUser(u) {
    user = u;
    var log = !!u;
    var logL = el("li-login"), appsL = el("li-apps"), outL = el("li-logout"),
      acc = el("accountLink"), railAcct = el("railAcct"),
      nameEl = el("accountName"), emailEl = el("accountEmail"),
      avEl = el("accountAvatar"), minAv = el("miniAvatar");
    var dash = "dashboard.html", login = "login.html";
    if (logL) logL.classList.toggle("hidden", log);
    if (appsL) appsL.classList.toggle("hidden", !log);
    if (outL) outL.classList.toggle("hidden", !log);
    var accHref = log ? dash : login;
    if (acc) acc.setAttribute("href", accHref);
    if (railAcct) railAcct.setAttribute("href", accHref);
    if (logL || appsL) {
      var ll = logL && logL.querySelector("a");
    }
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
    document.dispatchEvent(new CustomEvent("glass:user", { detail: u }));
  }

  var Glass = { open: openWin, close: closeWin, setUser: setUser, getUser: function () { return user; }, _logout: null };
  window.Glass = Glass;

  function initWindows() {
    var first = null;
    document.querySelectorAll(".gwin[data-win-open]").forEach(function (x) {
      if (!first) { x.classList.add("open"); first = true; }
    });
  }

  function start() {
    buildShell();
    initWindows();
    if (window.GLASS_INIT_USER) setUser(window.GLASS_INIT_USER);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();