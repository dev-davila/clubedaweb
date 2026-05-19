import { buildStitchPagePrompt, STITCH_PROMPT_MAX_CHARS } from "@/lib/cms/site-block-standard";
import { buildStitchRichPagePrompt } from "@/lib/stitch/stitch-prompts";
import { extractHtmlStyleSample } from "@/lib/stitch/html-style-sample";

const baseAnswers = {
  companyName: "Padaria Arte",
  industry: "padaria artesanal",
  homePitch: "Pães artesanais no centro",
  tone: "acolhedor",
  colors: "terracota e cream",
};

describe("stitch prompts v2", () => {
  it("includes design language and rich sections", () => {
    const prompt = buildStitchPagePrompt("home", baseAnswers);
    expect(prompt).toContain("## Design language");
    expect(prompt).toContain("## Secções desta página");
    expect(prompt).toContain("desktop-first");
    expect(prompt).not.toContain("```json");
  });

  it("home has full briefing, about has short briefing", () => {
    const home = buildStitchPagePrompt("home", baseAnswers);
    const about = buildStitchPagePrompt("about", baseAnswers);
    expect(home).toContain("Proposta da home");
    expect(about).toContain("Briefing (resumo)");
    expect(about).not.toContain("Proposta da home");
  });

  it("stays under prompt max guardrail", () => {
    for (const page of ["home", "about", "contact", "services", "blog"] as const) {
      const p = buildStitchRichPagePrompt(page, baseAnswers);
      expect(p.length).toBeLessThan(STITCH_PROMPT_MAX_CHARS + 800);
    }
  });

  it("home sample is capped", () => {
    const html = `<html><head><style>.x{}</style></head><body><header data-block="header">Nav</header></body></html>`;
    const sample = extractHtmlStyleSample(html, 800);
    expect(sample.length).toBeLessThanOrEqual(800);
  });
});
