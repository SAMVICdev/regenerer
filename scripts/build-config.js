#!/usr/bin/env node
/* ============================================================
   🔧 scripts/build-config.js
   ------------------------------------------------------------
   Injecte des valeurs dans js/config.js à partir de variables
   d'environnement — SANS toucher au reste du fichier.

   Pourquoi ? Parce que js/config.js est un fichier STATIQUE :
   il ne peut pas lire les variables d'environnement tout seul
   (contrairement à un serveur). On les « grave » donc dans le
   fichier au moment du déploiement (build).

   ▸ Utilisation locale :
        YOUTUBE_API_KEY=AIzaSy... npm run config

   ▸ Utilisation avec un fichier .env :
        cp .env.example .env   (puis remplir .env)
        npm run config

   ▸ Sur Netlify / Vercel :
        déclarer les variables dans le tableau de bord,
        puis lancer `npm run build` (qui appelle ce script).

   Le script ne remplace QUE les clés présentes dans les
   variables d'environnement : vos liens et événements saisis
   à la main dans config.js restent intacts.
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");

/* Racine du projet (dossier parent de /scripts) */
const ROOT = path.join(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "js", "config.js");
const ENV_PATH = path.join(ROOT, ".env");

/* ------------------------------------------------------------
   Table de correspondance : variable d'environnement → clé
   dans js/config.js. Ajoutez vos propres lignes si besoin.
   ------------------------------------------------------------ */
const MAP = {
  YOUTUBE_API_KEY: "apiKey",
  YOUTUBE_CHANNEL_ID: "channelId",
  YOUTUBE_HANDLE: "handle",
  YOUTUBE_LIVE_VIDEO_ID: "liveVideoId",
  WHATSAPP_URL: "whatsapp",
  FACEBOOK_URL: "facebook",
  INSTAGRAM_URL: "instagram",
  TIKTOK_URL: "tiktok",
  YOUTUBE_URL: "youtube",
};

/* ------------------------------------------------------------
   Charge un fichier .env (parseur minimal, sans dépendance).
   Les variables déjà définies dans l'environnement réel ont
   la priorité (utile sur Netlify/Vercel).
   ------------------------------------------------------------ */
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue; // commentaire / vide
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Retire les guillemets éventuels
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

/* ------------------------------------------------------------
   Remplace la valeur d'une clé `clé: "valeur"` dans le source.
   Ne touche pas aux objets (ex. `youtube: {`) ni aux commentaires.
   Retourne true si une substitution a eu lieu.
   ------------------------------------------------------------ */
function inject(source, key, value) {
  // \b garantit un mot entier ; l'échappement protège les caractères spéciaux.
  const re = new RegExp("(\\b" + key + "\\s*:\\s*)\"([^\"]*)\"");
  if (!re.test(source)) return { source, changed: false };
  const safe = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return { source: source.replace(re, '$1"' + safe + '"'), changed: true };
}

/* ------------------------------------------------------------
   « Tamponne » une version sur les assets locaux référencés dans
   index.html (css/styles.css, js/*.js) pour éviter que le navigateur
   ne serve une ANCIENNE version en cache après une modification.
   Ex. :  js/config.js  →  js/config.js?v=m1x2y3
   ------------------------------------------------------------ */
function stampAssets(stamp) {
  const htmlPath = path.join(ROOT, "index.html");
  if (!fs.existsSync(htmlPath)) return false;
  const before = fs.readFileSync(htmlPath, "utf8");
  const re = /((?:src|href)=["'])((?:\.\/)?(?:css|js)\/[^"'?]+\.(?:css|js))(\?v=[^"']*)?(["'])/g;
  const after = before.replace(
    re,
    (m, pre, url, _v, post) => pre + url + "?v=" + stamp + post
  );
  if (after === before) return false;
  fs.writeFileSync(htmlPath, after, "utf8");
  return true;
}

/* ------------------------------ Main ------------------------------ */
function main() {
  loadDotEnv(ENV_PATH);

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("✖ Fichier introuvable : " + CONFIG_PATH);
    process.exit(1);
  }

  let source = fs.readFileSync(CONFIG_PATH, "utf8");
  const applied = [];
  const missing = [];

  for (const [envKey, cfgKey] of Object.entries(MAP)) {
    const value = process.env[envKey];
    if (value === undefined || value === "") continue; // non fourni → on ignore
    const res = inject(source, cfgKey, value);
    if (res.changed) {
      source = res.source;
      applied.push(envKey + " → " + cfgKey);
    } else {
      missing.push(cfgKey);
    }
  }

  if (applied.length === 0) {
    console.log("ℹ Aucune variable d'environnement fournie — js/config.js inchangé.");
    console.log("  (Renseignez vos clés dans js/config.js, ou définissez des variables");
    console.log("   d'environnement — voir .env.example.)");
  } else {
    fs.writeFileSync(CONFIG_PATH, source, "utf8");
    console.log("✔ js/config.js mis à jour :");
    applied.forEach((line) => console.log("   • " + line));
    if (missing.length) {
      console.log("⚠ Clés introuvables dans config.js (ignorées) : " + missing.join(", "));
    }
  }

  // Anti-cache : on tamponne une version sur les assets locaux d'index.html
  const stamp = Date.now().toString(36);
  if (stampAssets(stamp)) {
    console.log("✔ index.html : version des assets mise à jour (v=" + stamp + ")");
  }
}

main();
