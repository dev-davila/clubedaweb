import {
  STITCH_PAGE_MIN_BYTES,
  validateStitchPageFunctional,
  validateStitchPageHtml,
} from "@/lib/cms/site-block-standard";
import { buildStitchRepairNote, buildStitchRichPagePrompt } from "@/lib/stitch/stitch-prompts";

describe("stitch pipeline helpers", () => {
  it("rich prompt includes blueprint and continuity", () => {
    const prompt = buildStitchRichPagePrompt(
      "about",
      { companyName: "Padaria X", industry: "padaria" },
      undefined,
      { homeHtmlSample: "<header data-block=\"header\">Home</header>" },
    );
    expect(prompt).toContain("Padaria X");
    expect(prompt).toContain("Continuidade visual");
    expect(prompt).toContain("## Design language");
    expect(prompt).toContain("data-block=\"hero\"");
  });

  it("repair note lists missing blocks", () => {
    const note = buildStitchRepairNote("contact", ["contact-form"], 1200, 3000);
    expect(note).toContain("contact");
    expect(note).toContain("<form>");
  });

  it("validateStitchPageFunctional enforces min bytes and form", () => {
    const short = `<section data-block="hero"></section><section data-block="content"></section><section data-block="cta"></section>`;
    const v = validateStitchPageFunctional("contact", short);
    expect(v.htmlTooShort).toBe(true);
    expect(v.ok).toBe(false);
  });

  it("phase0 gate uses block validation + min bytes", () => {
    const html = `
      <html><head><script src="https://cdn.tailwindcss.com"></script></head>
      <body>
      <section data-block="hero" id="top"></section>
      <section data-block="features-grid" id="servicos">
        <article data-block="feature-card"></article>
        <article data-block="feature-card"></article>
        <article data-block="feature-card"></article>
      </section>
      <section data-block="cta" id="contato"></section>
      </body></html>
    `.padEnd(STITCH_PAGE_MIN_BYTES.home + 10, " ");
    expect(validateStitchPageHtml("home", html).ok).toBe(true);
    expect(html.length).toBeGreaterThanOrEqual(STITCH_PAGE_MIN_BYTES.home);
  });
});
