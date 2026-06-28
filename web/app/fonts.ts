// Self-hosted fonts via next/font — zero layout shift (size-adjust + preload),
// no FOUT, no render-blocking request to Google. Devanagari MUST be a real loaded
// font, not an OS fallback (fallbacks mangle conjuncts/matras).

import { Inter, Mukta } from "next/font/google";

// Latin partner (Ninglish + English words).
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Devanagari. Mukta is reliably on Google Fonts with a devanagari subset.
// NOTE: the worker burns captions in Matangi (blueprint primary). For true
// WYSIWYG preview, self-host Matangi once fonts/Matangi.ttf exists:
//   import localFont from "next/font/local";
//   export const matangi = localFont({
//     src: "../../fonts/Matangi-VariableFont_wght.ttf",
//     variable: "--font-deva", display: "swap",
//   });
// and use `matangi` below instead of `mukta`.
export const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-deva",
  display: "swap",
});
