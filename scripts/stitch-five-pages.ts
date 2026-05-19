/**
 * Gate Fase 0: gera as 5 páginas obrigatórias via Google Stitch (mesmo projectId).
 *
 * Uso:
 *   npx tsx scripts/stitch-five-pages.ts
 *   npx tsx scripts/stitch-five-pages.ts --persona padaria
 *   npx tsx scripts/stitch-five-pages.ts --strict-functional
 *
 * Salva HTML em tmp/stitch-five/{pageType}.html
 * Exit 0 somente com 5/5 OK.
 */

import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { STITCH_PAGE_MIN_BYTES, validateStitchPageHtml } from "../lib/cms/site-block-standard";
import { homeHtmlSampleFromPage, runStitchPagePipeline } from "../lib/stitch/stitch-pipeline";
import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "../lib/themes/required-pages";
import { generateSiteContent, ensureSiteCopy } from "../lib/wizard/site-content-generator";
import { transition, initialSnapshot } from "../lib/wizard/state-machine";
import type { WizardAnswers } from "../lib/wizard/types";

const OUT_DIR = join(process.cwd(), "tmp", "stitch-five");

function parsePersonaAnswers(key: string): WizardAnswers {
  const inputs =
    key === "padaria"
      ? [
          "vamos",
          "Padaria do Tião — padaria artesanal de bairro, fermentação natural",
          "Pão fresco todo dia. Peça pelo WhatsApp ou passe na loja.\nPedir pelo WhatsApp",
          "Fermentação natural desde 1998. não tenho site",
          "Pão artesanal — fermentação 24h\nBolos sob encomenda — festas e cafés\nCafé da manhã — combos promocionais",
          "famílias da vizinhança e pessoas que valorizam pão de qualidade",
          "WhatsApp 11 99999-0000 · Rua das Flores 100 · seg-sáb 6h-20h",
          "acolhedor e familiar",
          "marrom, bege e dourado",
          "sem referência",
          "sim",
        ]
      : [];

  let snap = initialSnapshot();
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  for (const input of inputs) {
    snap = transition({ snapshot: snap, message: input, origin }).next;
  }
  return snap.answers;
}

function pageOk(
  pageType: RequiredPageType,
  html: string,
  strictFunctional: boolean,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const min = STITCH_PAGE_MIN_BYTES[pageType];
  if (html.length < min) reasons.push(`html ${html.length} < ${min}`);
  const v = validateStitchPageHtml(pageType, html);
  if (!v.ok) reasons.push(...v.missingBlocks);
  if (strictFunctional) {
    if (pageType === "contact" && !/<form[\s>]/i.test(html)) reasons.push("no-form");
    if (pageType === "blog" && (html.match(/<article/gi) ?? []).length < 3) {
      reasons.push("blog-articles<3");
    }
  }
  if (!/<html/i.test(html)) reasons.push("no-html-root");
  if (!/tailwindcss/i.test(html)) reasons.push("no-tailwind-cdn");
  return { ok: reasons.length === 0, reasons };
}

async function main() {
  const personaKey = process.argv.includes("--persona")
    ? process.argv[process.argv.indexOf("--persona") + 1] ?? "padaria"
    : "padaria";
  const strictFunctional = process.argv.includes("--strict-functional");

  if (!process.env.STITCH_API_KEY?.trim()) {
    console.error("STITCH_API_KEY ausente no .env");
    process.exit(1);
  }

  const answers = parsePersonaAnswers(personaKey);
  if (!answers.companyName) {
    console.error("Persona inválida:", personaKey);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n═══ Stitch 5 páginas — ${answers.companyName} ═══\n`);
  console.log(`Persona: ${personaKey} | strictFunctional: ${strictFunctional}\n`);

  const copy = ensureSiteCopy(answers, await generateSiteContent(answers));
  let projectId: string | null = process.env.STITCH_PROJECT_ID ?? null;
  let homeHtmlSample: string | null = null;
  let designSystemId: string | null = null;

  const rows: {
    page: string;
    ok: boolean;
    htmlLen: number;
    ms: number;
    screenId: string;
    reasons: string[];
  }[] = [];

  for (const pageType of REQUIRED_PAGE_TYPES) {
    const t0 = Date.now();
    process.stdout.write(`  ${pageType}… `);

    try {
      const result = await runStitchPagePipeline(pageType, answers, copy, {
        existingProjectId: projectId,
        designSystemId,
        homeHtmlSample: pageType === "home" ? null : homeHtmlSample,
        strictFunctional,
        maxAttempts: 2,
      });
      projectId = result.projectId;
      if (result.designSystemId) designSystemId = result.designSystemId;
      if (pageType === "home") homeHtmlSample = homeHtmlSampleFromPage(result.html);

      const outPath = join(OUT_DIR, `${pageType}.html`);
      const meta = [
        `<!-- Gerado via Google Stitch API`,
        `     projectId: ${result.projectId}`,
        `     screenId: ${result.screenId}`,
        `     htmlUrl: ${result.htmlUrl}`,
        `     generatedAt: ${new Date().toISOString()} -->`,
        "",
      ].join("\n");
      writeFileSync(outPath, meta + result.html, "utf8");

      const check = pageOk(pageType, result.html, strictFunctional);
      const ms = Date.now() - t0;
      rows.push({
        page: pageType,
        ok: check.ok && result.validationOk,
        htmlLen: result.html.length,
        ms,
        screenId: result.screenId,
        reasons: check.reasons,
      });

      const status = check.ok ? "OK" : "WARN";
      console.log(
        `${status} ${result.html.length} chars ${ms}ms → ${outPath}${check.reasons.length ? ` (${check.reasons.join(", ")})` : ""}`,
      );
    } catch (err) {
      const ms = Date.now() - t0;
      const msg = err instanceof Error ? err.message : String(err);
      rows.push({
        page: pageType,
        ok: false,
        htmlLen: 0,
        ms,
        screenId: "-",
        reasons: [msg],
      });
      console.log(`FAIL ${ms}ms — ${msg}`);
    }
  }

  console.log("\n── Resumo ──\n");
  console.log("página     | ok | htmlLen | ms    | screenId");
  console.log("-----------|----|---------|-------|----------");
  for (const r of rows) {
    console.log(
      `${r.page.padEnd(10)} | ${r.ok ? "✓" : "✗"}  | ${String(r.htmlLen).padStart(7)} | ${String(r.ms).padStart(5)} | ${r.screenId}`,
    );
    if (r.reasons.length) console.log(`           └ ${r.reasons.join("; ")}`);
  }

  const passed = rows.filter((r) => r.ok).length;
  const manifest = {
    provider: "google-stitch-api",
    projectId,
    persona: personaKey,
    generatedAt: new Date().toISOString(),
    pages: rows.map((r) => ({
      pageType: r.page,
      ok: r.ok,
      screenId: r.screenId,
      htmlLen: r.htmlLen,
      file: `${r.page}.html`,
    })),
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\nprojectId: ${projectId ?? "(n/a)"}`);
  console.log(`Resultado: ${passed}/5`);
  console.log(`Arquivos: ${OUT_DIR}/`);
  console.log(`Manifest: ${OUT_DIR}/manifest.json`);
  console.log(`\nNo console Stitch, busque o projeto ID acima (não confundir com projetos antigos).`);
  console.log(`Preview local: http://localhost:8765/index.html (index.html é só navegador, não é do Stitch)\n`);

  if (passed < 5) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
