import { extractTokensFromHtml, fallbackTokens } from "@/lib/stitch/theme-extractor";

describe("stitch theme extractor", () => {
  it("falls back when input is empty", () => {
    const t = extractTokensFromHtml("");
    expect(t.primaryColor).toBe("#3B82F6");
  });

  it("extracts primary color from dominant Tailwind class", () => {
    const html = `
      <section class="bg-red-600 text-white">Hero</section>
      <div class="bg-red-600 hover:bg-red-700">Card 1</div>
      <div class="bg-red-600">Card 2</div>
      <a class="text-red-700">link</a>
    `;
    const t = extractTokensFromHtml(html);
    expect(t.primaryColor).toBe("#DC2626");
  });

  it("picks a non-neutral primary color", () => {
    const html = `<div class="bg-gray-900 bg-emerald-600 bg-emerald-600 bg-emerald-700">x</div>`;
    const t = extractTokensFromHtml(html);
    expect(t.primaryColor).not.toBe("#111827");
    expect(["#059669", "#047857"]).toContain(t.primaryColor);
  });

  it("reads hex literals when no Tailwind classes are present", () => {
    const html = `<style>.btn { background: #FF6B6B; } .btn:hover { background: #FF6B6B; }</style>`;
    const t = extractTokensFromHtml(html);
    expect(t.primaryColor).toBe("#FF6B6B");
  });

  it("falls back colors by keyword in prompt", () => {
    expect(fallbackTokens("um site verde para a empresa").primaryColor).toBe("#059669");
    expect(fallbackTokens("usar roxo elegante").primaryColor).toBe("#7C3AED");
    expect(fallbackTokens("preto e moderno").primaryColor).toBe("#111827");
    expect(fallbackTokens("nenhuma menção").primaryColor).toBe("#3B82F6");
  });

  it("falls back to earthy tones (PT-BR)", () => {
    expect(fallbackTokens("marrom, bege e dourado").primaryColor).toBe("#92400E");
    expect(fallbackTokens("terracota, off-white e verde-sálvia").primaryColor).toBe("#B45309");
    expect(fallbackTokens("ocre suave").primaryColor).toBe("#EAB308");
    expect(fallbackTokens("vinho escuro elegante").primaryColor).toBe("#DC2626");
    expect(fallbackTokens("azul marinho premium").primaryColor).toBe("#1E3A8A");
    expect(fallbackTokens("cinza chumbo e prata").primaryColor).toBe("#475569");
  });

  it("derives readable secondary/accent from primary", () => {
    const t = fallbackTokens("azul");
    expect(t.secondaryColor).not.toBe(t.primaryColor);
    expect(t.accentColor).not.toBe(t.primaryColor);
  });

  it("detects rounded suffix as radius", () => {
    const html = `<button class="rounded-2xl">a</button><div class="rounded-2xl">b</div><div class="rounded-2xl">c</div>`;
    const t = extractTokensFromHtml(html);
    expect(t.borderRadius).toBe("16px");
  });
});
