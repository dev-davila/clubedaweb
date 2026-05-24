import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("file:///tmp/vitalis-raw.html", { waitUntil: "domcontentloaded" });
// Inspeciona estrutura ANTES de qualquer script rodar
const before = await p.evaluate(() => ({
  headChildren: document.head.children.length,
  bodyChildren: document.body.children.length,
  // Lista tags em head
  headTags: Array.from(document.head.children).map(c => c.tagName).join(","),
}));
console.log("AFTER DOM PARSED (before scripts):", JSON.stringify(before));
