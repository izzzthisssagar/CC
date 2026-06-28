import { isDevanagari, fontClassFor } from "@/lib/script";

describe("isDevanagari", () => {
  it("detects pure Devanagari words", () => {
    expect(isDevanagari("नमस्ते")).toBe(true);
    expect(isDevanagari("सिक्छौं")).toBe(true);
  });

  it("detects conjuncts and matras (the hard cases)", () => {
    expect(isDevanagari("क्ष")).toBe(true); // conjunct
    expect(isDevanagari("पिता")).toBe(true); // matra
    expect(isDevanagari("ज्ञ")).toBe(true);
  });

  it("returns false for Latin / English words", () => {
    expect(isDevanagari("video")).toBe(false);
    expect(isDevanagari("editing")).toBe(false);
    expect(isDevanagari("123")).toBe(false);
  });

  it("returns true for a Ninglish mixed token (any Devanagari char)", () => {
    // mixed-script single token still needs the Devanagari font
    expect(isDevanagari("videoमा")).toBe(true);
  });

  it("handles empty string safely", () => {
    expect(isDevanagari("")).toBe(false);
  });
});

describe("fontClassFor", () => {
  it("maps Devanagari → font-deva, Latin → font-sans", () => {
    expect(fontClassFor("आज")).toBe("font-deva");
    expect(fontClassFor("editing")).toBe("font-sans");
  });
});
