import {
  STANDARD_PAGE_BLOCKS,
  STITCH_HOME_REQUIRED_DATA_BLOCKS,
  buildStitchHomePrompt,
  validateStitchHomeHtml,
} from "@/lib/cms/site-block-standard";

describe("site block standard", () => {
  it("defines official page block packages", () => {
    expect(STANDARD_PAGE_BLOCKS.home).toEqual(["hero", "features-grid", "cta"]);
    expect(STANDARD_PAGE_BLOCKS.about).toEqual(["hero", "content", "cta"]);
    expect(STANDARD_PAGE_BLOCKS.blog).toEqual(["hero", "content"]);
  });

  it("stitch prompt enforces data-block attributes", () => {
    const prompt = buildStitchHomePrompt({
      companyName: "Padaria X",
      industry: "padaria artesanal",
    });
    expect(prompt).toContain('data-block="hero"');
    expect(prompt).toContain('data-block="features-grid"');
    expect(prompt).toContain("feature-card");
    expect(prompt).toContain("Padaria X");
    expect(prompt).toContain("## Design language");
    expect(prompt).toContain("## Secções desta página");
  });

  it("validates stitch home html", () => {
    const valid = `
      <section data-block="hero" id="top"></section>
      <section data-block="features-grid" id="servicos">
        <article data-block="feature-card"></article>
        <article data-block="feature-card"></article>
        <article data-block="feature-card"></article>
      </section>
      <section data-block="cta" id="contato"></section>
    `;
    expect(validateStitchHomeHtml(valid).ok).toBe(true);
    expect(validateStitchHomeHtml("<div>empty</div>").ok).toBe(false);
  });

  it("lists minimum stitch blocks", () => {
    expect(STITCH_HOME_REQUIRED_DATA_BLOCKS).toEqual(["hero", "features-grid", "cta"]);
  });
});
