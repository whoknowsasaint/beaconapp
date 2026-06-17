// ──────────────────────────────────────────────
// Beacon- Tailwind CSS Configuration
// Extends Tailwind with Beacon's full design token system.
// Every color, font, spacing, and animation used in the
// product is defined here as a named token.
// ──────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],

  theme: {
    extend: {

      // ─── Color System ───────────────────────
      // All colors reference CSS custom properties defined
      // in globals.css. This lets us swap themes without
      // touching component code.

      colors: {
        // Base surfaces
        "beacon-bg":          "var(--color-bg)",
        "beacon-bg-elevated": "var(--color-bg-elevated)",
        "beacon-bg-overlay":  "var(--color-bg-overlay)",

        // Borders
        "beacon-border":      "var(--color-border)",
        "beacon-border-soft": "var(--color-border-soft)",

        // Text
        "beacon-text":        "var(--color-text)",
        "beacon-text-muted":  "var(--color-text-muted)",
        "beacon-text-faint":  "var(--color-text-faint)",

        // Brand
        "beacon-blue":        "var(--color-blue)",
        "beacon-blue-glow":   "var(--color-blue-glow)",

        // Status
        "beacon-green":       "var(--color-green)",
        "beacon-amber":       "var(--color-amber)",
        "beacon-red":         "var(--color-red)",

        // Terminal accent (Scene 07)
        "beacon-terminal":    "var(--color-terminal)",
      },

      // ─── Typography ─────────────────────────

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],  // 10px
      },

      // ─── Spacing ────────────────────────────
      // Beacon uses an 8px base grid

      spacing: {
        "18": "4.5rem",   // 72px
        "22": "5.5rem",   // 88px
        "30": "7.5rem",   // 120px
        "34": "8.5rem",   // 136px
      },

      // ─── Border Radius ──────────────────────

      borderRadius: {
        "4xl": "2rem",
      },

      // ─── Box Shadow ─────────────────────────
      // Named shadows matching the scene spec

      boxShadow: {
        "glass":     "0 24px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset",
        "glass-lg":  "0 32px 100px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset",
        "tooltip":   "0 8px 24px rgba(0,0,0,0.4)",
        "card":      "0 12px 40px rgba(0,0,0,0.5)",
        "glow-blue": "0 0 40px rgba(59,130,246,0.15)",
        "glow-green":"0 0 20px rgba(34,197,94,0.2)",
        "glow-red":  "0 0 12px rgba(239,68,68,0.5)",
      },

      // ─── Animation ──────────────────────────
      // Named animations for CSS keyframe use.
      // Framer Motion handles JS-driven animations.

      keyframes: {
        "ping-ring": {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },

      animation: {
        "ping-ring":     "ping-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-soft":    "pulse-soft 2s ease-in-out infinite",
        "shimmer":       "shimmer 4s linear infinite",
        "float":         "float 5s ease-in-out infinite",
        "cursor-blink":  "cursor-blink 1s step-end infinite",
      },

      // ─── Backdrop Blur ──────────────────────

      backdropBlur: {
        "glass": "12px",
        "glass-sm": "8px",
        "glass-lg": "20px",
      },

      // ─── Background Size ────────────────────

      backgroundSize: {
        "200": "200% auto",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
  ],
}