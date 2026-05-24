import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
const p = await ctx.newPage();
await p.goto("http://104.248.235.24:3200/gestor/login", { waitUntil: "domcontentloaded" });
await p.fill('input[type="email"]', "admin@m3solutions.com.br");
await p.fill('input[type="password"]', "M3Admin@2024");
await p.click('button[type="submit"]');
await p.waitForURL(/\/gestor(?!\/login)/, { timeout: 15000 });
await p.waitForTimeout(3000);
for (const r of ["editor", "paginas", "temas", "menus", "aparencia", "categorias", "autores", "tags", "posts"]) {
  try {
    await p.goto(`http://104.248.235.24:3200/gestor/${r}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `/tmp/lupa-admin-${r}.png`, fullPage: false });
    console.log(`✓ ${r}`);
  } catch (e) {
    console.log(`✗ ${r}: ${String(e).slice(0, 80)}`);
  }
}
await b.close();
