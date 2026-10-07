/** @type {import('tailwindcss').Config} */
/* ============================================================
   🎨 Charte graphique — Ministère Les Régénérés
   ------------------------------------------------------------
   Couleurs de marque (voir README) :
     • royal / navy  : Bleu Roi #0A3880 & Marine #051D42 (60 %)
     • gold          : Jaune / Or #FFC700 (30 %)
     • brandred      : Rouge Éclatant #E52320 (10 %)
   Typographie : Inter / system-ui.
   Animations : floaty, fadeUp, livePulse (badge direct), shimmer…
   ▸ Après toute modification : relancer `npm run build:css`.
   ============================================================ */
module.exports = {
  // Fichiers scannés pour ne conserver que les classes réellement utilisées
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Bleu Roi — couleur dominante
        royal: {
          DEFAULT: "#0A3880",
          50: "#EAF0FB",
          100: "#C9D9F3",
          200: "#93B1E6",
          300: "#5C88D9",
          400: "#2E63C4",
          500: "#0A3880",
          600: "#0A3273",
          700: "#082A61",
          800: "#061F49",
          900: "#051D42",
        },
        navy: "#051D42",
        // Jaune / Or — accents, CTA, compteur
        gold: {
          DEFAULT: "#FFC700",
          light: "#FFD84D",
          dark: "#E0AE00",
        },
        // Rouge Éclatant — badges « En direct », séminaire
        brandred: "#E52320",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(255,199,0,0.45)",
        soft: "0 18px 50px -20px rgba(5,29,66,0.35)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        livePulse: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.82)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        bounceDown: {
          "0%,100%": { transform: "translateY(0)", opacity: "0.7" },
          "50%": { transform: "translateY(10px)", opacity: "1" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s ease-out both",
        "live-pulse": "livePulse 1.4s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        "bounce-down": "bounceDown 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
