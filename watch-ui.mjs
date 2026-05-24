import { chromium } from "playwright";
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
const page = await ctx.newPage();
await page.goto("http://104.248.235.24:3200/gestor/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@m3solutions.com.br");
await page.fill('input[type="password"]', "M3Admin@2024");
await page.click('button[type="submit"]');
await page.waitForURL(/\/gestor(?!\/login)/, { timeout: 15000 });
await page.goto("http://104.248.235.24:3200/gestor/wizard/chat", { waitUntil: "networkidle" });
console.log("→ chat aberto — auto-refresh a cada 25s pra ver progressão");
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(25000);
  await page.reload({ waitUntil: "networkidle" }).catch(() => {});
  const state = await page.locator("header div.font-mono").innerText().catch(() => "");
  console.log(`  [${i}] ${state}`);
  if (/publicar site|publicado/i.test(state)) {
    console.log("✓ pronto");
    break;
  }
}
await page.waitForTimeout(30000);
await browser.close();
