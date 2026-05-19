/**
 * Spike: home → design system → about sem homeHtmlSample.
 *
 * Uso: npx tsx scripts/stitch-design-system-spike.ts
 */

import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ensureSiteCopy, generateSiteContent } from "../lib/wizard/site-content-generator";
import { initialSnapshot, transition } from "../lib/wizard/state-machine";
import type { WizardAnswers } from "../lib/wizard/types";
import { runStitchPagePipeline } from "../lib/stitch/stitch-pipeline";

function padariaAnswers(): WizardAnswers {
  const inputs = [
    "vamos",
    "Padaria do Tião — padaria artesanal",
    "Pão fresco todo dia.\nPedir pelo WhatsApp",
    "Fermentação natural desde 1998. não tenho site",
    "Pão artesanal\nBolos\nCafé",
    "famílias do bairro",
    "WhatsApp 11 99999-0000",
    "acolhedor",
    "marrom e bege",
    "sem referência",
    "sim",
  ];
  let snap = initialSnapshot();
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  for (const input of inputs) {
    snap = transition({ snapshot: snap, message: input, origin }).next;
  }
  return snap.answers;
}

const OUT = join(process.cwd(), "tmp", "stitch-ds-spike");

async function main() {
  if (!process.env.STITCH_API_KEY?.trim()) {
    console.error("STITCH_API_KEY ausente");
    process.exit(1);
  }

  const answers = padariaAnswers();
  const copy = ensureSiteCopy(answers, await generateSiteContent(answers));
  mkdirSync(OUT, { recursive: true });

  console.log("1/2 — home…");
  const home = await runStitchPagePipeline("home", answers, copy, { strictFunctional: true });
  writeFileSync(join(OUT, "home.html"), home.html);
  console.log(`   projectId=${home.projectId} designSystemId=${home.designSystemId ?? "—"}`);

  console.log("2/2 — about (sem homeHtmlSample, com designSystemId)…");
  const about = await runStitchPagePipeline("about", answers, copy, {
    existingProjectId: home.projectId,
    designSystemId: home.designSystemId,
    homeHtmlSample: null,
    strictFunctional: true,
  });
  writeFileSync(join(OUT, "about.html"), about.html);
  console.log(`   htmlLen=${about.html.length} validationOk=${about.validationOk}`);
  console.log(`\nArtefatos em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
