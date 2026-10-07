/* ============================================================
   ⚙️  CONFIGURATION GLOBALE — Ministère Les Régénérés
   ============================================================
   C'est LE SEUL fichier à modifier pour :

     1. Activer le direct YouTube (clé API + chaîne)   → section `youtube`
     2. Mettre à jour les liens réseaux sociaux / WhatsApp → section `links`
     3. Modifier les programmes de la semaine          → section `events`

   ▸ IMPORTANT — Déploiement (variables d'environnement) :
     En production, la clé API et l'ID de chaîne peuvent être
     injectés automatiquement depuis des variables d'environnement
     SANS toucher à ce fichier :

         YOUTUBE_API_KEY       → youtube.apiKey
         YOUTUBE_CHANNEL_ID    → youtube.channelId
         YOUTUBE_HANDLE        → youtube.handle
         YOUTUBE_LIVE_VIDEO_ID → youtube.liveVideoId

     Commande :  npm run config     (voir scripts/build-config.js)
     Le script ne remplace QUE les valeurs fournies : vos liens et
     vos événements saisis ici restent intacts.

   ▸ Ce fichier est chargé en PREMIER par index.html, avant
     main.js et live.js, qui le lisent via window.MLR_CONFIG.
   ============================================================ */

window.MLR_CONFIG = {

  /* ==========================================================
     1) YOUTUBE — Détection du direct & rediffusions
     ----------------------------------------------------------
     Comment obtenir la clé API et l'ID de chaîne ?
     → voir la section « Zone de visionnage » du README.
     ========================================================== */
  youtube: {
    // 🔑 Clé API YouTube Data v3 (ex. "AIzaSyD..."). Laissez "" pour
    //    le mode secours (pas de détection auto, mais le site reste OK).
    apiKey: "",

    // 📺 ID de la chaîne YouTube (commence par "UC…"). Recommandé.
    //    Si vide, il sera retrouvé automatiquement via `handle`.
    channelId: "",

    // 👤 Pseudo de la chaîne SANS le @ (secours pour retrouver l'ID).
    handle: "ministeleresregeneres",

    // 🎯 Forcer un ID de vidéo précis (facultatif — utile pour tester
    //    ou diffuser un événement ponctuel). Ex. "dQw4w9WgXcQ".
    liveVideoId: "",

    // ⏱️ Fréquences de vérification du direct (en secondes)
    pollSeconds: 180,        // hors culte (économie de quota API)
    soonPollSeconds: 60,     // dans les 15 min avant un culte diffusé
    livePollSeconds: 30,     // pendant un culte diffusé (détection rapide)

    // 🗄️ Cache anti-quota : durée de validité des réponses API (s)
    cacheSeconds: 120,

    // 📼 Nombre de dernières vidéos (rediffusions) affichées
    maxReplays: 3,

    // 🔗 Liens de secours (boutons « Ouvrir sur YouTube » / « S'abonner »)
    channelUrl: "https://www.youtube.com/@ministeleresregeneres",
    liveUrl: "https://www.youtube.com/@ministeleresregeneres/live",
    subscribeUrl: "https://www.youtube.com/@ministeleresregeneres?sub_confirmation=1",
  },

  /* ==========================================================
     2) LIENS — Réseaux sociaux & WhatsApp
     ----------------------------------------------------------
     Ces liens alimentent automatiquement tous les boutons du site
     (en-tête, hero, cartes médias, pied de page, bouton flottant).
     Il suffit de les modifier ICI : inutile de toucher au HTML.
     ========================================================== */
  links: {
    facebook: "https://www.facebook.com/ministeleresregeneres",
    instagram: "https://www.instagram.com/ministeleresregeneres",
    tiktok: "https://www.tiktok.com/@ministeleresregeneres",
    youtube: "https://www.youtube.com/@ministeleresregeneres",

    // 📞 WhatsApp officiel — format international SANS le "+".
    //    Ex. Togo : 228 93 35 75 15  →  https://wa.me/22893357515
    whatsapp: "https://wa.me/22893357515",
  },

  /* ==========================================================
     3) PROGRAMMES — Horaires de la semaine (heure de Lomé = UTC+0)
     ----------------------------------------------------------
     Ces programmes alimentent :
       • le compteur à rebours de la page d'accueil ;
       • le texte « prochain culte » de la zone de visionnage ;
       • la fréquence de détection du direct (voir `stream`).

     day   : 0 = Dimanche, 1 = Lundi, … 6 = Samedi
     start : heure de début en MINUTES depuis minuit (18h00 = 18*60)
     end   : heure de fin en MINUTES depuis minuit
     stream: true  → ce programme est diffusé en direct sur YouTube
                     (le site vérifie alors le direct plus souvent)
     ========================================================== */
  events: [
    {
      name: "Culte du Soir",
      day: 3,                 // Mercredi
      start: 18 * 60,         // 18h00
      end: 20 * 60,           // 20h00
      stream: false,          // non diffusé en direct (modifiable)
    },
    {
      name: "École du Dimanche",
      day: 0,                 // Dimanche
      start: 7 * 60,          // 07h00
      end: 8 * 60,            // 08h00
      stream: true,           // diffusé en direct
    },
    {
      name: "Grand Culte — Louange & Adoration",
      day: 0,                 // Dimanche
      start: 8 * 60,          // 08h00
      end: 11 * 60 + 30,      // 11h30
      stream: true,           // diffusé en direct
    },
  ],
};
