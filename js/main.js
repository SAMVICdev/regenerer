/* ============================================================
   Ministère Les Régénérés — Interactions de la page
   ------------------------------------------------------------
   JavaScript Vanilla (ES6) — aucune dépendance externe.
   Ce fichier gère :
     1. L'application des liens depuis js/config.js (réseaux sociaux)
     2. Le menu mobile
     3. Le header au défilement
     4. Les animations d'apparition (reveal)
     5. L'année du pied de page
     6. La copie des numéros Mobile Money
     7. Le compteur à rebours récurrent (heure de Lomé = UTC+0)

   ▸ Ordre de chargement (voir index.html) :
       js/config.js  →  js/main.js  →  js/live.js
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     0) CONFIGURATION
     ------------------------------------------------------------
     On lit window.MLR_CONFIG (défini par js/config.js).
     Si le fichier est absent, on retombe sur des valeurs par défaut.
     ============================================================ */
  var CFG = window.MLR_CONFIG || {};

  /* ============================================================
     1) LIENS PILOTÉS PAR LA CONFIGURATION
     ------------------------------------------------------------
     Tous les <a data-link="facebook|instagram|tiktok|youtube|whatsapp">
     reçoivent leur href depuis CFG.links. Il suffit donc de modifier
     js/config.js pour mettre à jour tout le site.
     Le HTML conserve des href par défaut (utile si le JS est désactivé).
     ============================================================ */
  function applyConfigLinks() {
    var links = CFG.links || {};
    document.querySelectorAll("[data-link]").forEach(function (el) {
      var key = el.getAttribute("data-link");
      var url = links[key];
      if (!url) return; // clé inconnue → on garde le href du HTML

      // Message WhatsApp pré-rempli éventuel (attribut data-wa-text)
      var text = el.getAttribute("data-wa-text");
      if (text) {
        url += (url.indexOf("?") === -1 ? "?" : "&") + "text=" + encodeURIComponent(text);
      }
      el.setAttribute("href", url);
    });
  }

  // Synchronise les liens « sameAs » des données structurées (SEO)
  // avec ceux de la configuration.
  function syncSchema() {
    var el = document.getElementById("schema-church");
    if (!el || !CFG.links) return;
    try {
      var data = JSON.parse(el.textContent);
      var L = CFG.links;
      var list = [L.facebook, L.instagram, L.youtube, L.tiktok].filter(Boolean);
      if (list.length) data.sameAs = list;
      el.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      /* JSON invalide → on ignore */
    }
  }

  applyConfigLinks();
  syncSchema();

  /* ============================================================
     2) MENU MOBILE
     ------------------------------------------------------------
     Bascule l'ouverture/fermeture et échange les icônes burger/croix.
     ============================================================ */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var iconOpen = document.getElementById("icon-open");
  var iconClose = document.getElementById("icon-close");

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("hidden");
    if (iconOpen) iconOpen.classList.remove("hidden");
    if (iconClose) iconClose.classList.add("hidden");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      var isOpen = !mobileMenu.classList.contains("hidden");
      if (isOpen) {
        closeMenu();
      } else {
        mobileMenu.classList.remove("hidden");
        if (iconOpen) iconOpen.classList.add("hidden");
        if (iconClose) iconClose.classList.remove("hidden");
        menuToggle.setAttribute("aria-expanded", "true");
      }
    });
    // Ferme le menu après un clic sur un lien
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ============================================================
     3) HEADER AU DÉFILEMENT
     ------------------------------------------------------------
     Ajoute un fond opaque + ombre dès que l'on descend la page.
     ============================================================ */
  var header = document.getElementById("site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add("bg-navy/95", "shadow-lg", "backdrop-blur");
    } else {
      header.classList.remove("bg-navy/95", "shadow-lg", "backdrop-blur");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============================================================
     4) ANIMATIONS D'APPARITION (reveal)
     ------------------------------------------------------------
     Les éléments .reveal deviennent visibles à l'entrée dans l'écran,
     avec un léger décalage en cascade.
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var siblings = el.parentElement
              ? Array.prototype.slice.call(el.parentElement.children)
              : [];
            var idx = siblings.indexOf(el);
            var delay = (idx > -1 ? idx % 3 : 0) * 90;
            setTimeout(function () {
              el.classList.add("is-visible");
            }, delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    // Navigateur ancien → tout afficher immédiatement
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ============================================================
     5) ANNÉE DU PIED DE PAGE
     ============================================================ */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     6) COPIE DES NUMÉROS MOBILE MONEY (T-Money / Flooz)
     ------------------------------------------------------------
     Boutons .copy-btn avec attribut data-copy="+228...".
     Utilise l'API Clipboard, avec repli pour les navigateurs anciens.
     ============================================================ */
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy") || "";
      var original = btn.innerHTML;
      function done() {
        btn.innerHTML = "✓ Numéro copié !";
        setTimeout(function () {
          btn.innerHTML = original;
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(value)
          .then(done)
          .catch(function () {
            legacyCopy(value);
            done();
          });
      } else {
        legacyCopy(value);
        done();
      }
    });
  });

  function legacyCopy(value) {
    var ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* ignore */
    }
    document.body.removeChild(ta);
  }

  /* ============================================================
     7) HORAIRES & COMPTEUR À REBOURS RÉCURRENT
     ------------------------------------------------------------
     Fuseau : heure de Lomé (Togo) = UTC+0, sans changement d'heure.
     Les programmes proviennent de CFG.events (js/config.js).
       • day   : 0 = Dimanche … 6 = Samedi
       • start : minutes depuis minuit (18h00 = 18*60)
       • end   : minutes depuis minuit
       • stream: true = diffusé en direct (utilisé par live.js)
     ============================================================ */

  // Valeurs de repli si js/config.js est absent ou vide
  var DEFAULT_EVENTS = [
    { name: "Culte du Soir", day: 3, start: 18 * 60, end: 20 * 60, stream: false },
    { name: "École du Dimanche", day: 0, start: 7 * 60, end: 8 * 60, stream: true },
    { name: "Grand Culte — Louange & Adoration", day: 0, start: 8 * 60, end: 11 * 60 + 30, stream: true },
  ];

  var EVENTS =
    CFG.events && CFG.events.length
      ? CFG.events.map(function (e) {
          return {
            name: e.name,
            day: e.day,
            start: e.start,
            end: e.end,
            stream: !!e.stream,
          };
        })
      : DEFAULT_EVENTS;

  var DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  // Ajoute un zéro devant les nombres < 10 (ex. 7 → "07")
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // Convertit des minutes depuis minuit en "18h00"
  function fmtTime(min) {
    return pad(Math.floor(min / 60)) + "h" + pad(min % 60);
  }

  // Date de début de l'occurrence de l'événement dans la semaine courante
  // (calcul en UTC = heure de Lomé).
  function occurrence(ev, now) {
    var base = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
    );
    var diff = (ev.day - now.getUTCDay() + 7) % 7;
    base.setUTCDate(base.getUTCDate() + diff);
    base.setUTCHours(Math.floor(ev.start / 60), ev.start % 60, 0, 0);
    return base;
  }

  // Renvoie l'événement EN COURS (le cas échéant) : { ev, start, end }
  function findLive(now) {
    var nowMs = now.getTime();
    for (var i = 0; i < EVENTS.length; i++) {
      var ev = EVENTS[i];
      var start = occurrence(ev, now);
      var end = new Date(start.getTime() + (ev.end - ev.start) * 60000);
      if (nowMs >= start.getTime() && nowMs < end.getTime()) {
        return { ev: ev, start: start, end: end };
      }
    }
    return null;
  }

  // Renvoie le PROCHAIN événement à venir : { ev, start }
  function findNext(now) {
    var nowMs = now.getTime();
    var best = null;
    for (var i = 0; i < EVENTS.length; i++) {
      var ev = EVENTS[i];
      var start = occurrence(ev, now);
      // Déjà passé cette semaine → on passe à la semaine suivante
      if (start.getTime() <= nowMs) start = new Date(start.getTime() + 7 * 86400000);
      if (!best || start.getTime() < best.start.getTime()) best = { ev: ev, start: start };
    }
    return best;
  }

  /* API publique — utilisée par la zone de visionnage (js/live.js) */
  window.MLR = {
    EVENTS: EVENTS,
    DAYS: DAYS,
    pad: pad,
    fmtTime: fmtTime,
    occurrence: occurrence,
    findLive: findLive,
    findNext: findNext,
  };

  // Petit utilitaire : écrit du texte dans un élément s'il existe
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* Boucle du compteur (mise à jour chaque seconde) */
  function tick() {
    var now = new Date();
    var nowMs = now.getTime();

    var live = findLive(now);
    var target, label, sub, isLive = false;

    if (live) {
      // Un culte est en cours → on décompte jusqu'à sa fin
      isLive = true;
      target = live.end;
      label = "En ce moment : " + live.ev.name;
      sub = "Le culte se termine à " + fmtTime(live.ev.end) + " (heure de Lomé).";
    } else {
      // Sinon → on décompte jusqu'au prochain programme
      var best = findNext(now);
      target = best.start;
      var isToday =
        best.start.getUTCDate() === now.getUTCDate() &&
        best.start.getUTCMonth() === now.getUTCMonth() &&
        best.start.getUTCFullYear() === now.getUTCFullYear();
      label = "Prochain programme";
      sub =
        best.ev.name +
        " — " +
        (isToday ? "aujourd'hui" : DAYS[best.ev.day]) +
        " à " +
        fmtTime(best.ev.start) +
        " (heure de Lomé).";
    }

    // Badge « EN DIRECT » dans le hero
    var badge = document.getElementById("live-badge");
    if (badge) {
      badge.classList.toggle("hidden", !isLive);
      badge.classList.toggle("flex", isLive);
    }

    setText("countdown-label", label);
    setText("countdown-sub", sub);

    // Découpage du temps restant
    var diff = Math.max(0, target.getTime() - nowMs);
    var d = Math.floor(diff / 86400000);
    diff -= d * 86400000;
    var h = Math.floor(diff / 3600000);
    diff -= h * 3600000;
    var m = Math.floor(diff / 60000);
    diff -= m * 60000;
    var s = Math.floor(diff / 1000);

    setText("cd-days", pad(d));
    setText("cd-hours", pad(h));
    setText("cd-mins", pad(m));
    setText("cd-secs", pad(s));
  }

  tick();
  setInterval(tick, 1000);
})();
