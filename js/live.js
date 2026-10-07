/* ============================================================
   ZONE DE VISIONNAGE — Culte en direct (YouTube)
   ------------------------------------------------------------
   Ce fichier pilote la section #direct :
     • Détecte automatiquement le direct via YouTube Data API v3
     • Embarque le lecteur vidéo + le chat en direct
     • Affiche les dernières vidéos (rediffusions)
     • Adapte sa fréquence de vérification selon les cultes
       (plus rapide pendant/avant un culte diffusé → le direct
        apparaît automatiquement sur la page)
     • Fonctionne aussi SANS clé API (mode secours)

   ▸ Configuration : tout se règle dans js/config.js (section youtube).
   ▸ Dépend de : window.MLR_CONFIG (config.js) et window.MLR (main.js).
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     1) LECTURE DE LA CONFIGURATION
     ============================================================ */
  var CFG = (window.MLR_CONFIG && window.MLR_CONFIG.youtube) || {};
  var API_KEY = CFG.apiKey || "";
  var CHANNEL_ID = CFG.channelId || "";
  var HANDLE = CFG.handle || "";
  var FORCED_ID = CFG.liveVideoId || ""; // force un ID de vidéo (tests)
  var POLL_MS = (CFG.pollSeconds || 180) * 1000; // hors culte
  var SOON_MS = (CFG.soonPollSeconds || 60) * 1000; // ~15 min avant un culte
  var LIVE_MS = (CFG.livePollSeconds || 30) * 1000; // pendant un culte
  var CACHE_MS = (CFG.cacheSeconds || 120) * 1000; // cache anti-quota
  var MAX_REPLAYS = CFG.maxReplays || 3;

  /* ============================================================
     2) RÉFÉRENCES AUX ÉLÉMENTS DU DOM
     ============================================================ */
  var els = {
    status: document.getElementById("live-status"),
    statusText: document.getElementById("live-status-text"),
    schedule: document.getElementById("live-schedule"),
    placeholder: document.getElementById("player-placeholder"),
    placeholderTitle: document.getElementById("placeholder-title"),
    placeholderSub: document.getElementById("placeholder-sub"),
    frame: document.getElementById("player-frame"),
    chat: document.getElementById("chat-panel"),
    chatFrame: document.getElementById("chat-frame"),
    replays: document.getElementById("replays"),
    replaysGrid: document.getElementById("replays-grid"),
    watchBtn: document.getElementById("live-watch-btn"),
    subBtn: document.getElementById("live-sub-btn"),
  };

  // Si la section n'existe pas sur la page, on arrête tout.
  if (!els.frame) return;

  /* ============================================================
     3) LIENS DE SECOURS (boutons « Ouvrir sur YouTube » / « S'abonner »)
     ============================================================ */
  if (els.watchBtn && CFG.liveUrl) els.watchBtn.href = CFG.liveUrl;
  if (els.subBtn && CFG.subscribeUrl) els.subBtn.href = CFG.subscribeUrl;

  /* ============================================================
     4) CACHE ANTI-QUOTA (localStorage)
     ------------------------------------------------------------
     La clé API gratuite est limitée (~10 000 unités/jour). On met
     donc les réponses en cache pendant CACHE_MS pour éviter les
     appels inutiles.
     ============================================================ */
  function cacheGet(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > CACHE_MS) return null; // expiré
      return o.v;
    } catch (e) {
      return null;
    }
  }
  function cacheSet(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: v }));
    } catch (e) {
      /* quota dépassé / mode privé → on ignore */
    }
  }

  /* ============================================================
     5) APPEL À L'API YOUTUBE DATA v3
     ============================================================ */
  function api(path, params) {
    var url = "https://www.googleapis.com/youtube/v3/" + path;
    var qs = Object.keys(params)
      .map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      })
      .join("&");
    return fetch(url + "?" + qs + "&key=" + encodeURIComponent(API_KEY)).then(function (r) {
      if (!r.ok) throw new Error("YouTube API " + r.status);
      return r.json();
    });
  }

  /* ============================================================
     6) RÉSOLUTION DU channelId
     ------------------------------------------------------------
     Si channelId est vide, on le retrouve à partir du pseudo
     (handle) via l'endpoint `channels` (forHandle / forUsername).
     Le résultat est mis en cache.
     ============================================================ */
  function resolveChannelId() {
    if (CHANNEL_ID) return Promise.resolve(CHANNEL_ID);
    if (!API_KEY || !HANDLE) return Promise.resolve("");
    var cached = cacheGet("mlr_ch");
    if (cached) {
      CHANNEL_ID = cached;
      return Promise.resolve(cached);
    }
    var h = HANDLE.replace(/^@/, "");
    return api("channels", { part: "id", forHandle: "@" + h })
      .then(function (d) {
        if (d.items && d.items[0]) return d.items[0].id;
        // Repli : ancien système de pseudo
        return api("channels", { part: "id", forUsername: h }).then(function (d2) {
          return d2.items && d2.items[0] ? d2.items[0].id : "";
        });
      })
      .then(function (id) {
        if (id) {
          CHANNEL_ID = id;
          cacheSet("mlr_ch", id);
        }
        return id;
      })
      .catch(function () {
        return "";
      });
  }

  /* ============================================================
     7) DÉTECTION DU DIRECT
     ------------------------------------------------------------
     Interroge `search` avec eventType=live pour savoir si la chaîne
     émet en ce moment. Renvoie { id, title } ou null.
     ============================================================ */
  function getLive() {
    if (FORCED_ID) return Promise.resolve({ id: FORCED_ID, title: "" });
    if (!API_KEY) return Promise.resolve(null); // mode secours
    var cached = cacheGet("mlr_live");
    if (cached !== null) return Promise.resolve(cached);
    return resolveChannelId().then(function (ch) {
      if (!ch) return null;
      return api("search", {
        part: "snippet",
        channelId: ch,
        eventType: "live",
        type: "video",
        maxResults: 1,
      })
        .then(function (d) {
          var it = d.items && d.items[0];
          var res = it ? { id: it.id.videoId, title: it.snippet.title } : false;
          cacheSet("mlr_live", res);
          return res;
        })
        .catch(function () {
          return null;
        });
    });
  }

  /* ============================================================
     8) DERNIÈRES VIDÉOS (rediffusions)
     ------------------------------------------------------------
     Récupère la playlist « uploads » de la chaîne puis ses dernières
     vidéos via `playlistItems`.
     ============================================================ */
  function getReplays() {
    if (!API_KEY) return Promise.resolve([]);
    var cached = cacheGet("mlr_replays");
    if (cached) return Promise.resolve(cached);
    return resolveChannelId().then(function (ch) {
      if (!ch) return [];
      return api("channels", { part: "contentDetails", id: ch })
        .then(function (d) {
          var uploads =
            d.items && d.items[0] && d.items[0].contentDetails.relatedPlaylists.uploads;
          if (!uploads) return [];
          return api("playlistItems", {
            part: "snippet",
            playlistId: uploads,
            maxResults: MAX_REPLAYS,
          });
        })
        .then(function (pl) {
          var vids = (pl.items || []).map(function (it) {
            var s = it.snippet;
            return {
              id: s.resourceId.videoId,
              title: s.title,
              thumb:
                (s.thumbnails && (s.thumbnails.medium || s.thumbnails.default) || {}).url || "",
            };
          });
          cacheSet("mlr_replays", vids);
          return vids;
        })
        .catch(function () {
          return [];
        });
    });
  }

  /* ============================================================
     9) RENDU — BARRE DE STATUT
     ------------------------------------------------------------
     state : "live" | "loading" | "offline"
     ============================================================ */
  function setStatus(state, text) {
    if (!els.status || !els.statusText) return;
    els.statusText.textContent = text;
    var dot = els.status.querySelector("span");
    els.status.classList.remove("bg-white/10", "bg-brandred/90", "bg-brandred");
    if (state === "live") {
      els.status.classList.add("bg-brandred");
      if (dot) dot.className = "inline-block h-2.5 w-2.5 rounded-full bg-white animate-live-pulse";
    } else if (state === "loading") {
      els.status.classList.add("bg-white/10");
      if (dot) dot.className = "inline-block h-2.5 w-2.5 rounded-full bg-slate-300";
    } else {
      els.status.classList.add("bg-white/10");
      if (dot) dot.className = "inline-block h-2.5 w-2.5 rounded-full bg-slate-400";
    }
  }

  /* ============================================================
     10) RENDU — LECTEUR & CHAT
     ============================================================ */
  // Injecte l'iframe du lecteur YouTube
  function mountPlayer(videoId) {
    els.frame.innerHTML =
      '<iframe class="absolute inset-0 h-full w-full" src="https://www.youtube.com/embed/' +
      encodeURIComponent(videoId) +
      '?autoplay=1&rel=0&modestbranding=1" title="Culte en direct — Ministère Les Régénérés" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
      "allowfullscreen></iframe>";
    els.frame.classList.remove("hidden");
    if (els.placeholder) els.placeholder.classList.add("hidden");
  }

  // Injecte l'iframe du chat en direct
  function mountChat(videoId) {
    if (!els.chat || !els.chatFrame) return;
    var host = location.hostname;
    els.chatFrame.src =
      "https://www.youtube.com/live_chat?v=" +
      encodeURIComponent(videoId) +
      "&embed_domain=" +
      encodeURIComponent(host) +
      "&dark_theme=1";
    els.chat.classList.remove("hidden");
    els.chat.classList.add("flex", "flex-col");
  }

  // Retire le chat (hors direct)
  function unmountChat() {
    if (!els.chat) return;
    els.chat.classList.add("hidden");
    els.chat.classList.remove("flex", "flex-col");
    if (els.chatFrame) els.chatFrame.src = "about:blank";
  }

  // Affiche l'état « hors ligne » (avec message adapté si un culte est en cours)
  function showOffline(svc) {
    els.frame.classList.add("hidden");
    els.frame.innerHTML = "";
    if (els.placeholder) els.placeholder.classList.remove("hidden");

    var streaming = svc && svc.ev && svc.ev.stream;
    if (els.placeholderTitle) {
      els.placeholderTitle.textContent = streaming
        ? "Le culte est en cours…"
        : "Aucun direct pour le moment";
    }
    if (els.placeholderSub) {
      els.placeholderSub.textContent = streaming
        ? "Le direct va démarrer dans un instant. Merci de patienter 🙏"
        : "Le prochain culte sera diffusé ici en direct.";
    }
    unmountChat();
  }

  // Affiche/retire le point rouge « en direct » sur le lien de navigation
  function setNavLive(on) {
    document.querySelectorAll("[data-nav-live]").forEach(function (el) {
      el.classList.toggle("hidden", !on);
    });
  }

  /* ============================================================
     11) RENDU — GRILLE DES REDIFFUSIONS
     ============================================================ */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderReplays(vids) {
    if (!els.replays || !els.replaysGrid) return;
    if (!vids || !vids.length) {
      els.replays.classList.add("hidden");
      return;
    }
    els.replaysGrid.innerHTML = vids
      .map(function (v) {
        return (
          '<a href="https://www.youtube.com/watch?v=' +
          encodeURIComponent(v.id) +
          '" target="_blank" rel="noopener" class="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-transform hover:-translate-y-1">' +
          '<span class="relative block aspect-video overflow-hidden">' +
          (v.thumb
            ? '<img src="' + v.thumb + '" alt="" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">'
            : "") +
          '<span class="absolute inset-0 flex items-center justify-center bg-navy/30 opacity-0 transition-opacity group-hover:opacity-100">' +
          '<span class="flex h-12 w-12 items-center justify-center rounded-full bg-brandred text-white">' +
          '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
          "</span></span></span>" +
          '<span class="block px-4 py-3 text-sm font-semibold text-white/90 line-clamp-2">' +
          escapeHtml(v.title) +
          "</span></a>"
        );
      })
      .join("");
    els.replays.classList.remove("hidden");
  }

  /* ============================================================
     12) TEXTE « PROCHAIN CULTE » / « EN COURS »
     ============================================================ */
  function updateScheduleText() {
    if (!els.schedule || !window.MLR) return;
    var now = new Date();
    var live = window.MLR.findLive(now);
    if (live) {
      els.schedule.textContent = "En cours : " + live.ev.name;
      return;
    }
    var next = window.MLR.findNext(now);
    var isToday =
      next.start.getUTCDate() === now.getUTCDate() &&
      next.start.getUTCMonth() === now.getUTCMonth() &&
      next.start.getUTCFullYear() === now.getUTCFullYear();
    els.schedule.textContent =
      "Prochain culte : " +
      (isToday ? "aujourd'hui" : window.MLR.DAYS[next.ev.day]) +
      " à " +
      window.MLR.fmtTime(next.ev.start) +
      " (heure de Lomé)";
  }

  /* ============================================================
     13) FRÉQUENCE DE VÉRIFICATION ADAPTATIVE
     ------------------------------------------------------------
     Objectif : que le direct apparaisse AUTOMATIQUEMENT et
     rapidement pendant les cultes (ex. dimanche), tout en
     économisant le quota API le reste du temps.

       • Pendant un culte diffusé        → LIVE_MS  (ex. 30 s)
       • Dans les 15 min avant un culte  → SOON_MS  (ex. 60 s)
       • Le reste du temps               → POLL_MS  (ex. 180 s)
     ============================================================ */
  function currentPollMs() {
    if (!window.MLR) return POLL_MS;
    var now = new Date();
    var live = window.MLR.findLive(now);
    if (live) return live.ev.stream ? LIVE_MS : SOON_MS;
    var next = window.MLR.findNext(now);
    if (next && next.ev.stream) {
      var diff = next.start.getTime() - now.getTime();
      if (diff <= 15 * 60000) return SOON_MS;
    }
    return POLL_MS;
  }

  /* ============================================================
     14) BOUCLE PRINCIPALE
     ============================================================ */
  function refresh() {
    var now = new Date();
    var svc = window.MLR ? window.MLR.findLive(now) : null;

    setStatus("loading", "Vérification du direct…");

    // On lance en parallèle la détection du direct et des rediffusions
    return Promise.all([
      getLive().then(function (live) {
        if (live) {
          setStatus("live", "En direct maintenant");
          mountPlayer(live.id);
          mountChat(live.id);
          setNavLive(true);
        } else {
          setStatus("offline", "Hors ligne");
          showOffline(svc);
          setNavLive(false);
        }
        updateScheduleText();
      }),
      getReplays().then(renderReplays),
    ]);
  }

  // Planification adaptative : on reprogramme après chaque cycle
  var pollTimer = null;
  function scheduleNext() {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(function () {
      refresh().then(scheduleNext);
    }, currentPollMs());
  }

  // Démarrage
  refresh().then(scheduleNext);

  // Re-vérifie immédiatement quand l'onglet redevient visible
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) refresh();
  });

  // Le texte du prochain culte se met à jour régulièrement
  setInterval(updateScheduleText, 30000);
})();
