import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
const p = await ctx.newPage();

// Login
await p.goto("http://104.248.235.24:3200/gestor/login", { waitUntil: "networkidle" });
await p.fill('input[type="email"]', "admin@m3solutions.com.br");
await p.fill('input[type="password"]', "M3Admin@2024");
await p.click('button[type="submit"]');
await p.waitForURL(/\/gestor(?!\/login)/, { timeout: 15000 });
await p.waitForTimeout(2500);

// 1) Theme do admin reflete Café Lupa
const themed = await p.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return { primary: s.getPropertyValue("--stitch-primary"), font: s.getPropertyValue("--stitch-font-heading") };
});
console.log("admin theme:", JSON.stringify(themed));

// 2) Cada tela com screenshot + key check
const screens = [
  { url: "/gestor", name: "dashboard" },
  { url: "/gestor/editor", name: "editor" },
  { url: "/gestor/paginas", name: "paginas" },
  { url: "/gestor/temas", name: "temas" },
  { url: "/gestor/menus", name: "menus" },
  { url: "/gestor/aparencia", name: "aparencia" },
  { url: "/gestor/categorias", name: "categorias" },
  { url: "/gestor/autores", name: "autores" },
  { url: "/gestor/tags", name: "tags" },
  { url: "/gestor/posts", name: "posts" },
];
for (const s of screens) {
  await p.goto(`http://104.248.235.24:3200${s.url}`, { waitUntil: "networkidle", timeout: 25000 });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `/tmp/lupa-admin-${s.name}.png`, fullPage: false });
}
await b.close();
