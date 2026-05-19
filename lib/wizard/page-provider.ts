export type WizardPageProvider = "ai" | "stitch" | "template";

/** Padrão: Google Stitch. Use WIZARD_PAGE_PROVIDER=ai para gerar via LLM local. */
export function resolveWizardPageProvider(): WizardPageProvider {
  const raw = (process.env.WIZARD_PAGE_PROVIDER ?? "stitch").trim().toLowerCase();
  if (raw === "stitch" || raw === "template" || raw === "ai") return raw;
  return "ai";
}
