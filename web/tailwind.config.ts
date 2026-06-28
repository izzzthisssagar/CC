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
        deva: ["var(--font-deva)", "Noto Sans Devanagari", "sans-serif"],
      },
      colors: {
        // Tokens from app/tokens.css. Use brand-600+ with white text (AA).
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
    },
  },
  plugins: [],
};

export default config;
