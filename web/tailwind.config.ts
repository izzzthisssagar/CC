import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Loaded via next/font (app/fonts.ts) → CSS variables, zero CLS.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        deva: ["var(--font-sans)", "Noto Sans Devanagari", "sans-serif"], // Mukta covers deva
        display: ["var(--font-display)", "Georgia", "serif"],
        "deva-display": ["var(--font-deva-display)", "var(--font-sans)", "serif"],
      },
      colors: {
        // Tokens from app/tokens.css.
        ink: {
          DEFAULT: "var(--ink)",
          raised: "var(--ink-raised)",
          sunken: "var(--ink-sunken)",
        },
        paper: "var(--paper)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        rule: "var(--rule)",
        saffron: { DEFAULT: "var(--saffron)", dim: "var(--saffron-dim)" },
        brand: {
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
        },
        caption: {
          fill: "var(--caption-fill)",
          active: "var(--caption-active)",
        },
      },
      ringColor: {
        DEFAULT: "var(--ring)",
      },
    },
  },
  plugins: [],
};

export default config;
