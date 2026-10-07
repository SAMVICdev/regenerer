# Ministère Les Régénérés — Landing Page Officielle

Site web vitrine (One-Page) du **Ministère Les Régénérés** — *« Nouvelles créatures en domination »* — basé à **Lomé, Togo**.

Conçu d'après le cahier des charges : *Landing Page Institutionnelle & Plateforme d'Engagement Communautaire*.

---

## 🎯 Objectifs couverts

| Objectif | Réalisation |
|---|---|
| **Informer** | Horaires des cultes, slogan, localisation exacte à Lomé |
| **Engager** | Compteur à rebours récurrent + redirection réseaux sociaux (Facebook, TikTok, WhatsApp) |
| **Mobiliser** | Collecte des dîmes & offrandes via Mobile Money (T-Money & Flooz) |
| **Performance** | Site statique ultra-léger, optimisé pour la connexion mobile au Togo |

---

## 🧱 Structure du projet

```
.
├── index.html              # Page unique (8 sections)
├── css/styles.css          # Tailwind CSS compilé & minifié
├── src/input.css           # Source Tailwind (à recompiler si modif)
├── js/
│   ├── config.js           # ⚙️  TOUTE la configuration (YouTube, liens, événements)
│   ├── main.js             # JS Vanilla : liens, compteur, menu, animations, copie
│   └── live.js             # Zone de visionnage : détection direct + player + chat
├── scripts/
│   └── build-config.js     # 🔧 Injection des variables d'environnement (déploiement)
├── .env.example            # 🔐 Modèle de variables d'environnement
├── assets/
│   ├── logo.png            # Logo (badge circulaire)
│   ├── logo-256.png        # Logo optimisé (header/footer)
│   ├── favicon.png         # Favicon
│   ├── hero-poster.jpg     # Image de secours de la vidéo d'accueil
│   ├── pastor.jpg          # Portrait de l'orateur
│   ├── seminar.jpg         # Affiche du séminaire
│   └── video/
│       ├── hero.mp4        # Vidéo de fond (~264 Ko)
│       └── hero.webm       # Vidéo de fond (~268 Ko)
├── tailwind.config.js      # Charte graphique (couleurs, polices, animations)
└── package.json
```

> 💡 **Un seul fichier à connaître : `js/config.js`.** Les liens des réseaux sociaux,
> les horaires des programmes et les identifiants YouTube y sont regroupés et
> abondamment commentés.

---

## 📄 Les 8 sections

1. **En-tête & Navigation** — marque + slogan, menu ancré (Accueil, Direct, Programmes, Événements, Vidéos, Dons, Contact) et bouton WhatsApp.
2. **Hero** — vidéo de fond en boucle (autoplay/loop/muted) avec voile bleu/noir, slogan, référence *1 Pierre 1:23* et **compteur à rebours**.
3. **Zone de visionnage (Direct)** — lecteur YouTube embarqué **détecté automatiquement via l'API**, chat en direct et dernières vidéos (replays). *(voir section dédiée ci-dessous)*
4. **Programmes hebdomadaires** — cartes : Culte du Soir (Mer. 18h–20h), École du Dimanche (Dim. 07h–08h), Grand Culte (Dim. 08h–11h30).
5. **Événement spécial** — *3 Jours de Séminaire*, thème « Maudit est quiconque est pendu au bois » (Galates 3:13), orateur **Pst. DEDJO Jérémie**, dates & lieu.
6. **Médias & vidéos** — cartes Facebook Live/Replays, YouTube et TikTok.
7. **Dîmes & Offrandes** — T-Money (+228 93 35 75 15) et Flooz (+228 98 15 10 68) avec bouton *Copier le numéro*.
8. **Pied de page & Contacts** — téléphones, adresse, réseaux sociaux.

---

## ⏱️ Compteur à rebours (logique)

Le compteur cible automatiquement le **prochain programme de la semaine** (heure de Lomé = UTC+0) :

- **Mercredi 18h00–20h00** → Culte du Soir
- **Dimanche 07h00–08h00** → École du Dimanche
- **Dimanche 08h00–11h30** → Grand Culte (Louange & Adoration)

Comportement :
- Décompte en temps réel (Jours / Heures / Minutes / Secondes).
- **Pendant un culte**, un badge **🔴 EN DIRECT** s'affiche et le compteur indique la fin du culte.
- Dès qu'un programme se termine, le compteur **se réinitialise automatiquement** vers le programme suivant.

---

## 📺 Zone de visionnage « Culte en direct » (YouTube API)

La section **Direct** (`#direct`) affiche automatiquement le culte **dès que la chaîne YouTube est en direct**. Elle s'appuie sur la **YouTube Data API v3** et fonctionne en 3 temps :

1. **Détection** — le site interroge l'API (`search` + `eventType=live`) pour savoir si la chaîne émet. La fréquence est **adaptative** : rapide pendant/avant un culte (30–60 s) pour que le direct apparaisse **automatiquement**, plus lente le reste du temps (180 s) pour économiser le quota.
2. **Lecteur + chat** — si un direct est détecté, le lecteur YouTube est **embarqué** (`/embed/{id}`) et le **chat en direct** s'affiche à côté (`/live_chat?v={id}`). Un **point rouge « en direct »** apparaît aussi sur le lien *Direct* du menu.
3. **Hors ligne** — sinon, une vignette « Aucun direct pour le moment » apparaît avec le **prochain culte** calculé par le compteur. Si un culte **diffusé** est en cours, le message devient « Le culte est en cours… le direct va démarrer dans un instant ».

S'y ajoutent les **dernières vidéos (replays)** récupérées via `playlistItems`, affichées sous le lecteur.

> 🗓️ **Direct du dimanche automatique** : les programmes marqués `stream: true` dans `js/config.js` (École du Dimanche et Grand Culte) déclenchent une vérification accélérée : dès que la diffusion démarre, elle s'affiche seule sur la page, sans intervention.

### 🔑 Configuration (obligatoire pour l'auto-détection)

Tout se règle dans **`js/config.js`** :

```js
window.MLR_CONFIG = {
  youtube: {
    apiKey: "AIzaSy...",             // ← votre clé API YouTube Data v3
    channelId: "UCxxxxxxxxxxxxxxxx", // ← ID de la chaîne (commence par "UC")
    handle: "ministeleresregeneres", // ← pseudo sans le @ (secours)
    liveVideoId: "",                 // ← forcer un ID précis (facultatif)
    pollSeconds: 180,                // hors culte
    soonPollSeconds: 60,             // ~15 min avant un culte
    livePollSeconds: 30,             // pendant un culte diffusé
    cacheSeconds: 120,
    maxReplays: 3,
    channelUrl:   "https://www.youtube.com/@ministeleresregeneres",
    liveUrl:      "https://www.youtube.com/@ministeleresregeneres/live",
    subscribeUrl: "https://www.youtube.com/@ministeleresregeneres?sub_confirmation=1",
  },

  // Réseaux sociaux & WhatsApp (alimentent tout le site automatiquement)
  links: {
    facebook:  "https://www.facebook.com/ministeleresregeneres",
    instagram: "https://www.instagram.com/ministeleresregeneres",
    tiktok:    "https://www.tiktok.com/@ministeleresregeneres",
    youtube:   "https://www.youtube.com/@ministeleresregeneres",
    whatsapp:  "https://wa.me/22893357515", // format international SANS le +
  },

  // Programmes de la semaine (heure de Lomé = UTC+0)
  events: [
    { name: "Culte du Soir",                     day: 3, start: 18*60, end: 20*60,      stream: false },
    { name: "École du Dimanche",                 day: 0, start: 7*60,  end: 8*60,       stream: true  },
    { name: "Grand Culte — Louange & Adoration", day: 0, start: 8*60,  end: 11*60 + 30, stream: true  },
  ],
};
```

#### 1) Obtenir une clé API (`apiKey`)

1. Ouvrir la [Console Google Cloud](https://console.cloud.google.com/).
2. Créer (ou choisir) un projet.
3. **APIs & Services → Bibliothèque** → activer **YouTube Data API v3**.
4. **APIs & Services → Identifiants → Créer des identifiants → Clé API**.
5. (Recommandé) **Restreindre la clé** aux sites web autorisés (votre domaine) pour éviter tout usage abusif.

> 💡 La clé est visible côté client. Restreignez-la par **référent HTTP** (domaine) et, si possible, via un proxy serveur pour un usage intensif.

#### 2) Récupérer le `channelId`

- Ouvrir la chaîne YouTube → **clic droit → Afficher le code source de la page** → chercher `"channelId"` ou `"externalId"` (une valeur qui commence par `UC…`).
- **Ou** laisser `channelId` vide : le site le retrouvera automatiquement à partir du `handle` (1er appel API).

#### 3) Mode secours (sans clé API)

Si `apiKey` est vide, la section reste fonctionnelle : elle affiche l'état « Hors ligne », le **prochain culte**, et des boutons **Ouvrir sur YouTube** / **S'abonner**. Aucun direct n'est détecté automatiquement.

#### 4) Tester / forcer un direct

Pour diffuser un événement ponctuel (ou tester l'affichage en direct), renseignez `liveVideoId` avec l'ID de la vidéo (`https://youtu.be/`**`ID`**). Laissez `""` en production pour l'auto-détection.

> ⚠️ **Quota API** : la clé gratuite offre ~10 000 unités/jour. Le site met les réponses en **cache** (`cacheSeconds`) et **suspend les appels** quand l'onglet est masqué (`document.hidden`) pour économiser le quota.

---

## 🔐 Déploiement avec variables d'environnement

Un site **statique** ne peut pas lire les variables d'environnement tout seul. On les
« grave » donc dans `js/config.js` **au moment du build**, via le script
`scripts/build-config.js`.

### En local

```bash
cp .env.example .env      # puis remplir .env avec vos clés
npm run config            # injecte les valeurs dans js/config.js
# ou directement :
YOUTUBE_API_KEY=AIzaSy... YOUTUBE_CHANNEL_ID=UCxxxx npm run config
```

### Sur Netlify / Vercel

1. Déclarer les variables dans le tableau de bord du site
   (**Site settings → Environment variables** / **Settings → Environment Variables**).
2. La commande de build `npm run build` appelle automatiquement `build-config.js`
   puis compile le CSS.

| Variable d'environnement | Clé injectée dans `config.js` |
|---|---|
| `YOUTUBE_API_KEY` | `youtube.apiKey` |
| `YOUTUBE_CHANNEL_ID` | `youtube.channelId` |
| `YOUTUBE_HANDLE` | `youtube.handle` |
| `YOUTUBE_LIVE_VIDEO_ID` | `youtube.liveVideoId` |
| `WHATSAPP_URL` | `links.whatsapp` |
| `FACEBOOK_URL` | `links.facebook` |
| `INSTAGRAM_URL` | `links.instagram` |
| `TIKTOK_URL` | `links.tiktok` |
| `YOUTUBE_URL` | `links.youtube` |

> ✅ Le script ne remplace **que** les valeurs fournies : vos liens et vos événements
> saisis à la main dans `config.js` restent intacts.
> 🔁 Il met aussi à jour un **tampon anti-cache** (`?v=…`) sur les fichiers de
> `index.html`, pour que les visiteurs voient toujours la dernière version.

---

## ✏️ Modifier les liens et les événements

Tout se fait dans **`js/config.js`** — aucune connaissance du HTML n'est requise.

- **Liens réseaux sociaux / WhatsApp** → section `links`. Ils alimentent
  automatiquement l'en-tête, le hero, les cartes médias, le pied de page et le
  bouton flottant (via l'attribut `data-link="…"` dans le HTML).
- **Programmes de la semaine** → section `events`. Chaque entrée :
  `{ name, day (0=dim…6=sam), start (minutes), end (minutes), stream (true/false) }`.
  Ajoutez/retirez des lignes librement ; le compteur et le direct s'adaptent.
- **Ajouter un nouveau réseau social** : ajoutez la clé dans `links`, puis une carte
  ou un bouton avec `data-link="maCle"` dans `index.html`.

Après une modification, relancez `npm run build` (ou faites un **rechargement forcé**
`Ctrl+Shift+R`) pour contourner le cache du navigateur.

---

## 🎨 Charte graphique

| Couleur | Code Hex | Ratio | Usage |
|---|---|---|---|
| Bleu Roi / Marine | `#0A3880` / `#051D42` | 60 % | Couleur dominante |
| Jaune / Or | `#FFC700` | 30 % | Accents, CTA, compteur |
| Rouge Éclatant | `#E52320` | 10 % | Badges « En direct », séminaire |
| Fond Neutre | `#F9FAFB` / `#FFFFFF` | — | Sections textuelles |

**Typographie :** Inter / system-ui.

---

## ⚙️ Technologies

- HTML5 sémantique
- **Tailwind CSS** (compilé & purgé)
- **JavaScript Vanilla (ES6)** — aucune dépendance lourde
- Responsive : mobile / tablette / ordinateur
- Accessibilité : balises sémantiques, contrastes, `aria-*`, respect de `prefers-reduced-motion`

---

## 🔨 Développement

```bash
npm install          # installe Tailwind
npm run config       # injecte les variables d'environnement dans js/config.js
npm run build        # config + compile css/styles.css (minifié)
npm run build:css    # compile uniquement le CSS
npm run watch        # recompile le CSS à la volée
npm run serve        # lance un serveur local (port 8080)
```

Prévisualiser en local :

```bash
npm run serve        # ou : python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

---

## 🚀 Déploiement

Le site est **100 % statique**. Hébergement recommandé : **Netlify**, **Vercel** ou serveur standard (cPanel).

**Netlify / Vercel (recommandé) :**

1. Connecter le dépôt Git.
2. Commande de build : `npm run build` — dossier publié : `.` (racine).
3. Renseigner les variables d'environnement (clé API YouTube…) dans le tableau de bord.
4. Activer le **HTTPS / SSL** (obligatoire).

**Serveur standard (cPanel) :**

1. Lancer `npm run build` en local (ou `npm run config` si vous éditez `config.js` à la main).
2. Déposer les fichiers à la racine du site.
3. Activer le **HTTPS / SSL**.

Nom de domaine conseillé : `ministeleresregeneres.tg` ou `.com`.

---

## ✏️ Personnalisation

- **Direct YouTube** : renseigner `apiKey` et `channelId` dans **`js/config.js`** (ou via variables d'environnement — voir ci-dessus).
- **Réseaux sociaux** : mettre à jour les liens dans **`js/config.js`** → `links` (ils se propagent automatiquement à tout le site).
- **Horaires / événements** : modifier la section `events` de `js/config.js`.
- **Numéro WhatsApp** : `links.whatsapp` dans `js/config.js` (format international sans `+`).
- **Vidéo de fond** : remplacer `assets/video/hero.mp4` / `hero.webm` (< 5 Mo) et `assets/hero-poster.jpg`.
- **Couleurs** : modifier `tailwind.config.js` puis relancer `npm run build:css`.
- **Textes des sections** : directement dans `index.html` (chaque section est repérée par un commentaire `<!-- ============ … ============ -->`).

---

© Ministère Les Régénérés — Fait avec foi à Lomé, Togo 🇹🇬
