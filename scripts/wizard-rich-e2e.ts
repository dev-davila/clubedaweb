/**
 * E2E REAL — discovery-agent + Stitch gerando as 5 páginas com brief rico.
 *
 * Foco: validar que o site sai impactante, com conteúdo literal do brief
 * em cada bloco. Salva HTMLs em /tmp/wizard-rich-output/ para inspeção visual.
 *
 * Uso: npx tsx scripts/wizard-rich-e2e.ts
 */

import "dotenv/config";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";

import { runDiscoveryTurn } from "@/lib/wizard/discovery-agent";
import { generateWizardPage } from "@/lib/stitch/generate-site";
import { sanitizeStitchHtml, setChromeSourceFromHome } from "@/lib/stitch/sanitize-stitch-html";
import { standardizeSiteChrome } from "@/lib/stitch/standardize-chrome";
import { standardizePageStyling } from "@/lib/stitch/share-page-styling";
import { WIZARD_PAGE_ORDER } from "@/lib/wizard/page-flow";
import { ensureSiteCopy, generateSiteContent } from "@/lib/wizard/site-content-generator";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import type { ChatMessage, WizardAnswers, WizardSnapshot } from "@/lib/wizard/types";

const OUTPUT_DIR = "/tmp/wizard-rich-output";

const SCRIPT = [
  "Mendes Advogados — escritório boutique de direito empresarial e tributário em São Paulo, fundado em 2009",
  "Persona: empresas industriais e tech de médio porte (50-500 funcionários) com decisões jurídicas estratégicas frequentes",
  "Dor: medo de processo trabalhista mal conduzido + perda de oportunidade tributária por falta de planejamento fiscal",
  "Diferenciais: 1) Sócio sênior dedicado em cada conta (sem terceirização), 2) Dashboard mensal com KPIs jurídicos via WhatsApp, 3) SLA de resposta em 4h úteis para urgências, 4) Parecer escrito em até 5 dias úteis",
  "Produto principal: Gestão Jurídica Estratégica — programa anual com sócio dedicado, dashboard mensal, suporte ilimitado em direito empresarial e tributário, até 2 pareceres por mês.",
  "Como funciona: 1) Diagnóstico jurídico em 7 dias, 2) Plano personalizado em 14 dias, 3) Implementação assistida nos primeiros 90 dias, 4) Acompanhamento mensal contínuo",
  "Preço: 3 planos — Essencial (R$ 8.500/mês), Profissional (R$ 15.000/mês), Premium (sob consulta)",
  "Prova social: 80+ empresas atendidas em 2024, NPS 91, 4 prêmios Análise Advocacia 500, parceria com 12 family offices",
  "FAQ: 1) P: 'Vocês cobram caso a caso?' R: 'Não. Mensalidade fixa cobre demandas ilimitadas dentro do escopo contratado.' 2) P: 'Atendem outros estados?' R: 'Sim, temos parceiros em 14 estados.' 3) P: 'Prazo de resposta?' R: 'SLA 4h úteis para urgência, 24h regular, 5 dias úteis para pareceres.'",
  "Tom: sério, premium e consultivo",
  "Objetivo do site: agendar diagnóstico gratuito de 60min. CTA: 'Agendar diagnóstico'",
  "Contato: comercial@mendes.com.br, (11) 3000-0000, WhatsApp (11) 99000-0000, Av. Paulista 1000, São Paulo - SP",
  "Sem blog por enquanto",
  "Sim, pode gerar agora.",
  "Aprovado, pode gerar o site.",
];

function div(t: string) {
  console.log("\n" + "═".repeat(72));
  console.log(`  ${t}`);
  console.log("═".repeat(72));
}

function short(s: string, n = 100): string {
  const f = s.replace(/\s+/g, " ");
  return f.length <= n ? f : f.slice(0, n - 1) + "…";
}

async function runBriefing(): Promise<WizardAnswers> {
  div("FASE 1 — Briefing conversacional (Claude via Abacus)");
  let history: ChatMessage[] = [];
  let answers: WizardAnswers = {};
  for (let i = 0; i < SCRIPT.length; i++) {
    const msg = SCRIPT[i];
    console.log(`\n[${i + 1}/${SCRIPT.length}] user: ${short(msg, 90)}`);
    const t = Date.now();
    const r = await runDiscoveryTurn({ message: msg, history, answers });
    console.log(`     bot (${((Date.now() - t) / 1000).toFixed(1)}s): ${short(r.reply, 120)}`);
    history = [
      ...history,
      { role: "user", content: msg },
      { role: "assistant", content: r.reply },
    ];
    answers = r.answers;
    if (r.isReady) {
      console.log(`\n[✓] Brief fechado no turno ${i + 1}`);
      return answers;
    }
  }
  throw new Error("brief não fechou");
}

async function generateAllPages(answers: WizardAnswers) {
  div("FASE 2 — Geração das 5 páginas no Stitch");
  const copy = ensureSiteCopy(answers, await generateSiteContent(answers));
  console.log(`[copy] hero.title: ${short(copy.home.hero.title, 80)}`);
  console.log(`[copy] features.items: ${copy.home.features.items.length}`);
  for (const it of copy.home.features.items) {
    console.log(`        - ${short(it.title, 40)} | ${short(it.description, 80)}`);
  }

  const out: Record<string, string> = {};
  let projectId: string | undefined;
  let designSystemId: string | undefined;
  let homeHtmlSample: string | null = null;
  let homeTokens: WizardSnapshot["extractedTokens"] | null = null;

  for (let i = 0; i < WIZARD_PAGE_ORDER.length; i++) {
    const p = WIZARD_PAGE_ORDER[i];
    const t = Date.now();
    console.log(`\n[gen ${i + 1}/5] ${p}…`);
    const r = await generateWizardPage(p, answers, copy, {
      existingProjectId: projectId,
      designSystemId,
      mode: "generate",
      homeTokens: p === "home" ? null : homeTokens,
      homeHtmlSample: p === "home" ? null : homeHtmlSample,
    });
    projectId = r.projectId;
    designSystemId = r.designSystemId ?? designSystemId;
    if (p === "home") {
      homeTokens = r.tokens;
      homeHtmlSample = r.html.slice(0, 2400);
    }
    out[p] = r.html;
    console.log(
      `[gen ${i + 1}/5] ${p} OK — ${r.provider} validation=${r.validationOk} ${r.html.length}b em ${((Date.now() - t) / 1000).toFixed(1)}s`,
    );
  }
  return out;
}

async function applyPostprocess(pages: Record<string, string>) {
  div("FASE 3 — Postprocess");
  if (!pages.home) throw new Error("home faltando");
  pages.home = sanitizeStitchHtml(pages.home);
  setChromeSourceFromHome(pages.home);
  console.log(`[post] home: ${pages.home.length}b`);
  for (const p of WIZARD_PAGE_ORDER) {
    if (p === "home") continue;
    if (!pages[p]) continue;
    pages[p] = sanitizeStitchHtml(pages[p], { pageType: p, applyStandardChrome: true });
    console.log(`[post] ${p}: ${pages[p].length}b`);
  }
  let polished: Record<string, string>;
  try {
    polished = standardizeSiteChrome(pages as Record<RequiredPageType, string>);
  } catch (err) {
    console.warn(`[post] chrome standardize warn: ${(err as Error).message}`);
    polished = pages;
  }
  polished = standardizePageStyling(polished, "home");
  return polished;
}

async function writeOutputs(processed: Record<string, string>, answers: WizardAnswers) {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const [p, html] of Object.entries(processed)) {
    await writeFile(join(OUTPUT_DIR, `${p}.html`), html, "utf-8");
  }
  const index = `<!doctype html><meta charset="utf-8"><title>Rich E2E</title>
<style>body{font-family:system-ui;padding:24px;max-width:600px} a{display:block;padding:8px;border:1px solid #ddd;margin:4px 0;text-decoration:none;color:#000;border-radius:6px} a:hover{background:#f5f5f5}</style>
<h1>${answers.companyName} — preview</h1>
${WIZARD_PAGE_ORDER.map((p) => `<a href="./${p}.html">${p}</a>`).join("\n")}`;
  await writeFile(join(OUTPUT_DIR, "index.html"), index, "utf-8");
  await writeFile(join(OUTPUT_DIR, "brief.json"), JSON.stringify(answers, null, 2), "utf-8");
}

async function main() {
  const t0 = Date.now();
  const answers = await runBriefing();
  const pages = await generateAllPages(answers);
  const processed = await applyPostprocess(pages);
  await writeOutputs(processed, answers);
  div("RESULTADO");
  console.log(`Tempo total: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`Output: file://${OUTPUT_DIR}/index.html`);
}

main().catch((e) => {
  console.error("erro:", e);
  if (e instanceof Error && e.stack) console.error(e.stack);
  process.exit(1);
});
