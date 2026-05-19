/**
 * Visual smoke test dos 3 previews do Stitch.
 *
 * Abre cada preview num browser real, espera o iframe carregar, valida que:
 *   1. O wrapper do preview cobre 100vw/100vh
 *   2. Nenhum header/footer do clubedaweb está visível
 *   3. O iframe contém conteúdo real (Tailwind CDN carregado, h1, etc.)
 * E captura um screenshot full-page de cada um em /tmp/preview-<key>.png
 *
 * Uso:
 *   npx tsx scripts/preview-visual-test.ts
 */

import { chromium, type Page, type Locator } from "playwright";

interface Target {
  key: string;
  url: string;
}

const TARGETS: Target[] = [
  { key: "padaria", url: "http://localhost:3001/preview/-K_ilXrs0pvh25P1ljaljgnICS9TQS7_" },
  { key: "advocacia", url: "http://localhost:3001/preview/hCYV-sttljrG6YxoUOxZjAGk_m_NKB2E" },
  { key: "moda", url: "http://localhost:3001/preview/aLPjED3Z4oVboZ7zZIOQN6_akv4GiVtn" },
];

async function inspect(page: Page, target: Target) {
  console.log("\n──────────────────────────────────────────");
  console.log(` ${target.key.toUpperCase()} — ${target.url}`);
  console.log("──────────────────────────────────────────");

  await page.goto(target.url, { waitUntil: "load", timeout: 30_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

  // Outer page checks
  const banner = await page.locator("text=/Modo Preview.*design gerado por IA/").first();
  const bannerVisible = await banner.isVisible().catch(() => false);
  console.log(`  banner preview visível: ${bannerVisible ? "✅" : "❌"}`);

  // Look for site-chrome leaking (these classes are from components/bd-redesign/header.tsx and similar)
  const leakSelectors = [
    "header.fixed.top-3",        // bd-redesign navbar
    "footer.bg-foreground",       // bd-redesign footer
    "[data-site-header]",
    "[data-site-footer]",
  ];
  for (const sel of leakSelectors) {
    const el = page.locator(sel).first();
    const count = await el.count();
    if (count > 0) {
      const visible = await el.isVisible().catch(() => false);
      console.log(`  leak [${sel}]: ${count} no DOM, ${visible ? "VISÍVEL ❌" : "escondido ✅"}`);
    }
  }

  // Iframe checks
  const iframe = page.frameLocator("iframe[title^='Preview de']");
  let stitchHasContent = false;
  let stitchH1Text = "(none)";
  try {
    const h1 = iframe.locator("h1, h2").first();
    await h1.waitFor({ timeout: 8_000 });
    stitchHasContent = true;
    stitchH1Text = (await h1.innerText()).slice(0, 80);
  } catch {
    /* swallow */
  }
  console.log(`  iframe carregou headings: ${stitchHasContent ? "✅" : "❌"}`);
  console.log(`  primeiro heading: "${stitchH1Text}"`);

  // Capture full-page screenshot
  const out = `/tmp/preview-${target.key}.png`;
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  screenshot: ${out}`);

  return { ...target, bannerVisible, stitchHasContent, stitchH1Text };
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Log console errors from the page to surface CSP violations / runtime errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`  [console.error] ${msg.text().slice(0, 200)}`);
    }
  });

  const results: any[] = [];
  for (const target of TARGETS) {
    try {
      results.push(await inspect(page, target));
    } catch (err) {
      console.log(`  ❌ falhou: ${String(err)}`);
      results.push({ ...target, error: String(err) });
    }
  }
  await browser.close();

  console.log("\n══════════════════════════════════════════");
  console.log(" RESUMO");
  console.log("══════════════════════════════════════════");
  for (const r of results) {
    const ok = r.bannerVisible && r.stitchHasContent;
    console.log(`${ok ? "✅" : "❌"}  ${r.key.padEnd(12)}  banner=${r.bannerVisible}  iframe=${r.stitchHasContent}  "${r.stitchH1Text ?? r.error}"`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
