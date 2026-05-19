/**
 * Smoke test do discovery-agent (Claude via Abacus). Não toca em Stitch nem
 * em DB — só valida que:
 *   1. A IA insiste quando a resposta é vaga
 *   2. A IA extrai os campos do brief via tool update_brief
 *   3. Quando o brief tá completo, a IA pede confirmação e depois chama
 *      confirm_brief_ready
 *
 * Uso: npx tsx scripts/discovery-agent-smoke.ts
 */

import "dotenv/config";
import { runDiscoveryTurn, computeBriefProgress } from "@/lib/wizard/discovery-agent";
import type { ChatMessage, WizardAnswers } from "@/lib/wizard/types";

const SCRIPT = [
  // 1) Resposta vaga — IA deve insistir
  "Empresa",
  // 2) Nome + segmento concretos
  "Mendes Advogados — escritório boutique de direito empresarial e tributário em SP",
  // 3) Resposta vaga (clichê) — IA deve insistir
  "qualidade e expertise",
  // 4) Pitch concreto + CTA
  "Empresas em crescimento que precisam de cobertura jurídica sem montar departamento próprio. CTA: agendar consulta diagnóstica gratuita.",
  // 5) Sobre
  "Fundado em 2009 por sócios vindos de bancas multinacionais. Atendimento dedicado com sócio sênior em cada conta.",
  // 6) Serviços
  "Consultoria tributária — planejamento fiscal estruturado; Contencioso estratégico — defesa em ações complexas; M&A — contratos e governança",
  // 7) Persona vaga — IA insiste
  "empresas em geral",
  // 8) Persona concreta
  "Empresas de médio porte (50-500 funcionários) do setor industrial e tech, com decisões jurídicas estratégicas recorrentes",
  // 9) Contato
  "comercial@mendes.com.br — (11) 3000-0000 — Av. Paulista 1000, São Paulo",
  // 10) Tom
  "sério, premium, consultivo",
  // 11) Confirmação inicial (IA vai mostrar resumo)
  "Sim, pode gerar o site com isso.",
  // 12) Confirma o resumo (aí sim a IA chama confirm_brief_ready)
  "Aprovado, perfeito. Pode gerar agora.",
];

function shorten(s: string, max = 120): string {
  const flat = s.replace(/\s+/g, " ");
  return flat.length <= max ? flat : flat.slice(0, max - 1) + "…";
}

async function main() {
  console.log("=".repeat(72));
  console.log("SMOKE TEST — discovery-agent (Claude via Abacus)");
  console.log("=".repeat(72));

  let history: ChatMessage[] = [];
  let answers: WizardAnswers = {};
  let reasksObserved = 0;
  let readyTurn: number | null = null;

  for (let i = 0; i < SCRIPT.length; i++) {
    const msg = SCRIPT[i];
    const beforeFields = Object.keys(answers).length;
    console.log(`\n[${i + 1}/${SCRIPT.length}] USER: ${shorten(msg, 100)}`);

    const t0 = Date.now();
    let result;
    try {
      result = await runDiscoveryTurn({ message: msg, history, answers });
    } catch (err) {
      console.error(`❌ chamada falhou: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
    const dt = ((Date.now() - t0) / 1000).toFixed(1);

    history = [
      ...history,
      { role: "user", content: msg },
      { role: "assistant", content: result.reply },
    ];
    const afterFields = Object.keys(result.answers).length;
    const newFields = afterFields - beforeFields;
    const progress = computeBriefProgress(result.answers);

    console.log(`     BOT (${dt}s): ${shorten(result.reply, 200)}`);
    console.log(
      `     ← progresso=${progress}% · campos preenchidos=${afterFields} (+${newFields}) · ready=${result.isReady}`,
    );

    if (newFields === 0 && !result.isReady) {
      // Não extraiu nada novo → muito provavelmente fez reask (insistiu)
      reasksObserved++;
      console.log(`     ✓ INSISTÊNCIA detectada (nenhum campo novo extraído)`);
    }

    answers = result.answers;

    if (result.isReady) {
      readyTurn = i + 1;
      break;
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log("RESULTADO");
  console.log("=".repeat(72));
  console.log(`Reasks observados: ${reasksObserved} (esperado: ≥2 — vague em 'Empresa', 'qualidade', 'empresas em geral')`);
  console.log(`Brief finalizado no turno: ${readyTurn ?? "(não chegou em ready)"}`);
  console.log(`Progresso final: ${computeBriefProgress(answers)}%`);
  console.log(`Campos preenchidos:`);
  for (const [k, v] of Object.entries(answers)) {
    const disp = Array.isArray(v) ? v.join(", ") : String(v);
    console.log(`  - ${k}: ${shorten(disp, 70)}`);
  }

  const okReasks = reasksObserved >= 2;
  const okReady = readyTurn !== null;
  if (okReasks && okReady) {
    console.log("\n🎉 SMOKE TEST PASS — IA insistiu em vago E chegou em ready");
    process.exit(0);
  } else {
    console.log("\n❌ SMOKE TEST FAIL");
    if (!okReasks) console.log("  - poucos reasks observados");
    if (!okReady) console.log("  - não chegou em isReady");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("erro fatal:", err);
  process.exit(1);
});
