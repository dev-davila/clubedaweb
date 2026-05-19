/**
 * Smoke test do briefing rico + prompt do Stitch.
 *
 * 1. Roda discovery-agent com persona advocacia inteira (campos ricos)
 * 2. Verifica que IA preencheu differentiators[], faq[], howItWorks[], etc.
 * 3. Verifica que buildStitchPagePrompt agora injeta esses campos literalmente
 *    no prompt (inclui "USE EXATAMENTE estes 3 diferenciais", FAQ literal, etc.)
 *
 * Não chama Stitch real (custo). Só valida o pipeline de prompt.
 */

import "dotenv/config";
import { runDiscoveryTurn, computeBriefProgress } from "@/lib/wizard/discovery-agent";
import { buildStitchPagePrompt } from "@/lib/cms/site-block-standard";
import { fallbackSiteContent } from "@/lib/wizard/site-content-generator";
import type { ChatMessage, WizardAnswers } from "@/lib/wizard/types";

const SCRIPT = [
  "Mendes Advogados — escritório boutique de direito empresarial e tributário em São Paulo, fundado em 2009",
  "Persona: empresas industriais e tech de médio porte (50-500 funcionários) com decisões jurídicas estratégicas frequentes",
  "Dor principal: medo de processo trabalhista mal conduzido + perda de oportunidade tributária por falta de planejamento fiscal",
  "Diferenciais: 1) Sócio sênior dedicado em cada conta (sem terceirização), 2) Dashboard mensal com KPIs jurídicos enviado por WhatsApp, 3) SLA de resposta em 4h úteis para urgências, 4) Parecer escrito em até 5 dias úteis",
  "Produto principal: Gestão Jurídica Estratégica — programa anual com sócio dedicado, dashboard mensal, suporte ilimitado em direito empresarial e tributário, e até 2 pareceres por mês.",
  "Como funciona: 1) Diagnóstico jurídico inicial em 7 dias, 2) Plano de ação personalizado em 14 dias, 3) Implementação assistida nos primeiros 90 dias, 4) Acompanhamento mensal contínuo com dashboard e calls",
  "Modelo de preço: 3 planos — Essencial (R$ 8.500/mês), Profissional (R$ 15.000/mês), Premium (sob consulta)",
  "Prova social: 80+ empresas atendidas em 2024, NPS 91, 4 prêmios Análise Advocacia 500, parceria com 12 family offices",
  "FAQ: 1) P: 'Vocês cobram caso a caso?' R: 'Não. Trabalhamos com mensalidade fixa que cobre demandas ilimitadas dentro do escopo contratado.' 2) P: 'Atendem outros estados?' R: 'Sim. Temos parceiros em 14 estados e cuidamos da articulação. O atendimento direto é em SP.' 3) P: 'Qual o prazo médio de resposta?' R: 'SLA de 4h úteis para urgências, 24h para demandas regulares, 5 dias úteis para pareceres complexos.'",
  "Tom: sério, premium e consultivo",
  "Site goal: agendar diagnóstico gratuito de 60 minutos. CTA: 'Agendar diagnóstico'",
  "Contato: comercial@mendes.com.br — (11) 3000-0000 — WhatsApp (11) 99000-0000 — Av. Paulista 1000, São Paulo - SP",
  "Sem blog por enquanto, sem conteúdo escrito",
  "Sim, está completo. Pode gerar o site agora.",
];

function shorten(s: string, max = 100): string {
  const flat = s.replace(/\s+/g, " ");
  return flat.length <= max ? flat : flat.slice(0, max - 1) + "…";
}

async function main() {
  console.log("=".repeat(72));
  console.log("SMOKE TEST — Briefing rico + prompts do Stitch");
  console.log("=".repeat(72));

  let history: ChatMessage[] = [];
  let answers: WizardAnswers = {};

  for (let i = 0; i < SCRIPT.length; i++) {
    const msg = SCRIPT[i];
    console.log(`\n[${i + 1}/${SCRIPT.length}] USER: ${shorten(msg, 90)}`);
    const t0 = Date.now();
    const result = await runDiscoveryTurn({ message: msg, history, answers });
    const dt = ((Date.now() - t0) / 1000).toFixed(1);

    history = [
      ...history,
      { role: "user", content: msg },
      { role: "assistant", content: result.reply },
    ];
    answers = result.answers;
    const progress = computeBriefProgress(answers);
    console.log(`     BOT (${dt}s): ${shorten(result.reply, 130)}`);
    console.log(`     ← progresso=${progress}% · ready=${result.isReady}`);

    if (result.isReady) {
      console.log(`\n[✓] Brief fechado no turno ${i + 1}`);
      break;
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log("CAMPOS RICOS COLETADOS");
  console.log("=".repeat(72));
  const checks = [
    { key: "differentiators", required: 3, present: Array.isArray(answers.differentiators) && answers.differentiators.length >= 3 },
    { key: "productName", required: 1, present: Boolean(answers.productName) },
    { key: "productDescription", required: 1, present: Boolean(answers.productDescription) },
    { key: "howItWorks", required: 2, present: Array.isArray(answers.howItWorks) && answers.howItWorks.length >= 2 },
    { key: "faq", required: 3, present: Array.isArray(answers.faq) && answers.faq.length >= 3 },
    { key: "proofPoints.items", required: 1, present: Boolean(answers.proofPoints?.items?.length) },
    { key: "pricingModel", required: 1, present: Boolean(answers.pricingModel) },
    { key: "mainPain", required: 1, present: Boolean(answers.mainPain) },
    { key: "siteGoal", required: 1, present: Boolean(answers.siteGoal) },
    { key: "foundedYear", required: 1, present: Boolean(answers.foundedYear) },
    { key: "blogTopics.skip", required: 1, present: answers.blogTopics?.skip === true },
  ];
  for (const c of checks) {
    console.log(`${c.present ? "✅" : "❌"} ${c.key} (req=${c.required})`);
  }

  console.log("\n" + "=".repeat(72));
  console.log("PROMPT DO STITCH (página services — onde a riqueza mais aparece)");
  console.log("=".repeat(72));
  const copy = fallbackSiteContent(answers);
  const prompt = buildStitchPagePrompt("services", answers, copy);
  console.log(`Length: ${prompt.length} chars`);
  console.log(`Contém "USE EXATAMENTE": ${prompt.includes("USE EXATAMENTE") ? "✅" : "❌"}`);
  console.log(`Contém algum diferencial literal: ${
    answers.differentiators?.some((d) => prompt.includes(d.slice(0, 30))) ? "✅" : "❌"
  }`);
  console.log(`Contém productName: ${
    answers.productName && prompt.includes(answers.productName) ? "✅" : "❌"
  }`);
  console.log(`Contém pricing literal: ${
    answers.pricingModel && prompt.includes(answers.pricingModel.slice(0, 20)) ? "✅" : "❌"
  }`);
  console.log(`Contém pergunta de FAQ literal: ${
    answers.faq?.[0] && prompt.includes(answers.faq[0].q.slice(0, 20)) ? "✅" : "❌"
  }`);
  console.log(`Contém etapa de howItWorks literal: ${
    answers.howItWorks?.[0] && prompt.includes(answers.howItWorks[0].slice(0, 20)) ? "✅" : "❌"
  }`);

  console.log("\n=== HEAD do prompt (1500 chars) ===");
  console.log(prompt.slice(0, 1500));

  console.log("\n=== Direcionamento rico (slice) ===");
  const richStart = prompt.indexOf("## Direcionamento");
  if (richStart >= 0) {
    const richEnd = prompt.indexOf("## Blueprint", richStart);
    console.log(prompt.slice(richStart, richEnd > 0 ? richEnd : richStart + 2000));
  }
}

main().catch((err) => {
  console.error("ERRO:", err);
  process.exit(1);
});
