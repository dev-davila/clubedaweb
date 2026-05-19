/**
 * Lista telas de um projeto Stitch (prova de que o HTML veio da API).
 *
 * Uso: npx tsx scripts/stitch-verify-project.ts [projectId]
 */

import "dotenv/config";

async function main() {
  const projectId = process.argv[2] ?? "15792978214609424585";
  if (!process.env.STITCH_API_KEY?.trim()) {
    console.error("STITCH_API_KEY ausente");
    process.exit(1);
  }

  const sdk = await import("@google/stitch-sdk");
  const project = sdk.stitch.project(projectId);

  console.log(`\nProjeto Stitch: ${projectId}`);
  console.log(`Console: https://stitch.withgoogle.com/ (abra o projeto pelo ID)\n`);

  const screens = await project.screens();
  if (!screens.length) {
    console.log("Nenhuma tela no projeto.");
    return;
  }

  for (const s of screens) {
    console.log(`  screen ${s.id}`);
  }

  try {
    const systems = await project.listDesignSystems();
    console.log(`\nDesign systems: ${systems.length}`);
    for (const ds of systems) {
      console.log(`  ${ds.id}`);
    }
  } catch {
    console.log("\n(listDesignSystems não disponível)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
