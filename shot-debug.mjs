import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on("console", msg => console.log(`[${msg.type()}]`, msg.text().slice(0, 200)));
p.on("pageerror", err => console.log("[ERR]", err.message.slice(0, 300)));
await p.goto("http://104.248.235.24:3200/preview/8X-NfHDgepazFabkBDsGjkh0OWsMnPWw/raw?page=home", { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(8000);
const html = await p.content();
console.log("doc length:", html.length);
// Verifica se body tem conteúdo visível
const visible = await p.evaluate(() => {
  const body = document.body;
  return {
    childCount: body.children.length,
    firstChildTag: body.children[0]?.tagName,
    bodyRect: body.getBoundingClientRect(),
    headerHeight: document.querySelector("header")?.offsetHeight,
    heroHeight: document.querySelector('[data-block="hero"]')?.offsetHeight,
    tailwindLoaded: !!window.tailwind,
  };
});
console.log("inspect:", JSON.stringify(visible, null, 2));
await b.close();
