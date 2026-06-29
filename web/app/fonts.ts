// Editorial Devanagari type system, self-hosted via next/font (zero CLS, no FOUT).
// Devanagari MUST be a real loaded font, never an OS fallback (fallbacks mangle
// conjuncts/matras).
//
// Roles:
//   display       — Fraunces, an editorial serif with real character (optical sizing,
//                   soft/wonky axes) for English headlines + big numerals.
//   devaDisplay   — Tiro Devanagari Hindi, a serif Devanagari that pairs with Fraunces
//                   for the oversized Devanagari "artwork" headlines.
//   body          — Mukta covers BOTH Latin and Devanagari, so Ninglish UI text renders
//                   in one consistent voice. Used for --font-sans AND --font-deva.

import { Fraunces, Tiro_Devanagari_Hindi, Mukta } from "next/font/google";

// English editorial display (serif).
export const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Devanagari editorial display (serif) — the hero artwork.
export const devaDisplay = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-deva-display",
  display: "swap",
});

// Body + UI for both scripts. Mukta is a humanist sans with a real devanagari subset.
// NOTE: the worker burns captions in Matangi (blueprint primary). For true WYSIWYG,
// self-host Matangi once fonts/Matangi.ttf exists and point --font-deva at it.
export const body = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
