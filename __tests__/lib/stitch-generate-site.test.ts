import { validateStitchPageHtml } from "@/lib/cms/site-block-standard";
import { buildFallbackPageHtml } from "@/lib/stitch/fallback-page-html";
import { fallbackSiteContent } from "@/lib/wizard/site-content-generator";

describe("stitch multi-page", () => {
  const answers = {
    companyName: "Clínica Vet",
    industry: "clínica veterinária",
    audience: "tutores de pets",
    tone: "acolhedor",
  };
  const copy = fallbackSiteContent(answers);

  it("fallback HTML passes validation for all required pages", () => {
    for (const page of ["home", "about", "contact", "services", "blog"] as const) {
      const html = buildFallbackPageHtml(page, copy, "Clínica Vet", "clínica veterinária");
      expect(validateStitchPageHtml(page, html).ok).toBe(true);
    }
  });
});
