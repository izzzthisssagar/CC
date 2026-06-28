// Script detection for Ninglish (Nepali+English code-switching) per-word font
// switching. CORE INVARIANT — a caption line mixes Devanagari and Latin words;
// each word must render in the matching font. See CLAUDE.md convention.

// Unicode Devanagari block: U+0900–U+097F.
const DEVANAGARI = /[ऀ-ॿ]/;

/** True if the word contains any Devanagari character. */
export function isDevanagari(word: string): boolean {
  return DEVANAGARI.test(word);
}

/** Tailwind font class for a word: Devanagari → Matangi stack, else Latin. */
export function fontClassFor(word: string): "font-deva" | "font-sans" {
  return isDevanagari(word) ? "font-deva" : "font-sans";
}
