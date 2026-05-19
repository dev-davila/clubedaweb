/**
 * Regenera APENAS a home com o brief salvo de /tmp/wizard-rich-output/brief.json.
 * Usa o blueprint expandido + minBytes maior + richSectionDirectives.home novos.
 */
import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { generateWizardPage } from "@/lib/stitch/generate-site";
import { sanitizeStitchHtml, setChromeSourceFromHome } from "@/lib/stitch/sanitize-stitch-html";
import { standardizeSiteChrome } from "@/lib/stitch/standardize-chrome";
import { standardizePageStyling } from "@/lib/stitch/share-page-styling";
import { ensureSiteCopy, generateSiteContent } from "@/lib/wizard/site-content-generator";
import { WIZARD_PAGE_ORDER } from "@/lib/wizard/page-flow";
import type { WizardAnswers } from "@/lib/wizard/types";
import type { RequiredPageType } from "@/lib/themes/required-pages";

const DIR = "/tmp/wizard-rich-output";

async function main() {
  const answers: WizardAnswers = JSON.parse(await readFile(`${DIR}/brief.json`, "utf-8"));
  console.log(`Brief carregado: ${answers.companyName} (${Object.keys(answers).length} campos)`);
  console.log(`differentiators: ${answers.differentiators?.length ?? 0} | howItWorks: ${answers.howItWorks?.length ?? 0} | faq: ${answers.faq?.length ?? 0} | proofPoints.items: ${answers.proofPoints?.items?.length ?? 0}`);

  const copy = ensureSiteCopy(answers, await generateSiteContent(answers));
  console.log(`Copy gerado. hero.title: ${copy.home.hero.title}`);

  console.log("\n[regen] gerando home com blueprint expandido…");
  const t0 = Date.now();
  const result = await generateWizardPage("home", answers, copy, { mode: "generate" });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[regen] home OK — provider=${result.provider} validation=${result.validationOk} ${result.html.length}b em ${dt}s`);

  // Aplica postprocess incluindo as outras 4 páginas (que já estão em disco)
  const pages: Record<string, string> = { home: result.html };
  for (const p of WIZARD_PAGE_ORDER) {
    if (p === "home") continue;
    pages[p] = await readFile(`${DIR}/${p}.html`, "utf-8");
  }

  // Sanitize home, set chrome source, sanitize outras
  pages.home = sanitizeStitchHtml(pages.home);
  setChromeSourceFromHome(pages.home);
  for (const p of WIZARD_PAGE_ORDER) {
    if (p === "home") continue;
    pages[p] = sanitizeStitchHtml(pages[p], { pageType: p, applyStandardChrome: true });
  }

  let polished: Record<string, string>;
  try {
    polished = standardizeSiteChrome(pages as Record<RequiredPageType, string>);
  } catch (err) {
    console.warn("chrome warn:", (err as Error).message);
    polished = pages;
  }
  polished = standardizePageStyling(polished, "home");

  for (const p of WIZARD_PAGE_ORDER) {
    await writeFile(`${DIR}/${p}.html`, polished[p], "utf-8");
  }
  console.log(`\n✓ home regenerada e postprocess aplicado em todas (${result.html.length}b → ${polished.home.length}b após chrome)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
