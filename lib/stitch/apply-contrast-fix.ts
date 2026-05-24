/**
 * Corrige contraste em sites Stitch onde o tailwind-config gerou cores
 * "text-on-surface" / "text-on-surface-variant" / "text-surface" inadequadas
 * pra paleta efetiva do body (ex.: M3Solutions tem body bg light mas
 * `text-on-surface-variant` ficou branco — texto invisível).
 *
 * Estratégia: detecta paleta do body (light/dark) lendo `bg-*` no <body>
 * + tailwind-config inline. Injeta <style> que sobrescreve as classes
 * problemáticas com cores legíveis pra paleta efetiva.
 *
 * Idempotente: <style id="__cdw_contrast_fix"> só é injetado uma vez.
 */

interface ContrastPalette {
  mode: "light" | "dark";
  /** RGB do background efetivo. */
  bgHex: string;
}

const CONTRAST_STYLE_ID = "__cdw_contrast_fix";

/**
 * Tenta deduzir a paleta efetiva olhando o <body class="...">.
 * - bg-(white|gray-50|slate-50|stone-50|surface) → light
 * - bg-(black|gray-900|slate-900|zinc-900|navy|background) com tema dark → dark
 * Default: light (assume Stitch erra pra branco quando ambíguo).
 */
function detectPalette(html: string): ContrastPalette {
  const bodyMatch = html.match(/<body\b[^>]*\bclass=["']([^"']+)["']/i);
  const classes = (bodyMatch?.[1] ?? "").toLowerCase();

  // Procura primary surface color no tailwind config: --background, surface, etc.
  // Tailwind config inline tem `"surface": "#xxxxxx"`.
  const tailwindCfg = html.match(/<script[^>]*id=["']tailwind-config["'][^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? "";

  const surfaceColor = (tailwindCfg.match(/"surface"\s*:\s*"(#[0-9a-fA-F]{3,8})"/) ?? [])[1];
  const bgColor = (tailwindCfg.match(/"background"\s*:\s*"(#[0-9a-fA-F]{3,8})"/) ?? [])[1];

  let effectiveBg = "#ffffff";
  if (classes.includes("bg-surface") && surfaceColor) effectiveBg = surfaceColor;
  else if (classes.includes("bg-background") && bgColor) effectiveBg = bgColor;
  else if (surfaceColor) effectiveBg = surfaceColor;
  else if (bgColor) effectiveBg = bgColor;

  const lum = luminance(effectiveBg);
  return {
    mode: lum > 0.5 ? "light" : "dark",
    bgHex: effectiveBg,
  };
}

function luminance(hex: string): number {
  const m = hex.replace("#", "").match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/);
  if (!m) return 0.5;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Overrides CSS pra contraste em paleta LIGHT. Conservador — só ataca
 * casos onde a class do tailwind-config gerado é a MESMA cor do bg
 * (material icons com text-surface no bg surface, por exemplo). NÃO
 * sobrescreve text-on-surface global porque footers dark legítimos
 * usam essa mesma classe (com bg dark) e ficariam invisíveis.
 */
function lightModeOverrides(): string {
  return `
/* Material symbols com text-surface — text = bg = invisível */
.material-symbols-outlined.text-surface,
.material-symbols-outlined.text-background {
  color: #6b7280 !important;
}
/* Icon containers com bg-primary/0.05 ou similar + text-on-X muito leve */
[class*="bg-primary/0"] .material-symbols-outlined,
[class*="bg-tertiary/0"] .material-symbols-outlined,
[class*="bg-secondary/0"] .material-symbols-outlined {
  color: #0b1c30 !important;
}
/* Botões outline em surfaces light com text-white declarado (sem bg dark
   ancestor) ficam invisíveis. Só ataca quando o pai não tem bg dark. */
section:not([data-cdw-hero-overlay="1"]):not([class*="bg-primary"]):not([class*="bg-zinc-9"]):not([class*="bg-slate-9"]):not([class*="bg-gray-9"]):not([class*="bg-black"]):not([class*="bg-on-"]) > div > a[class*="bg-transparent"] {
  color: #0b1c30 !important;
  border-color: #0b1c30 !important;
}
`.trim();
}

/**
 * Remove marker hero-overlay quando não há bg-image real (heurística falhou no
 * publish original — ex.: mockup com rounded-/shadow- foi confundido com bg).
 * O marker força texto branco no hero, e isso fica invisível sobre body light.
 */
function revertStaleHeroOverlay(html: string): string {
  if (!/data-cdw-hero-overlay=["']1["']/.test(html)) return html;
  // Verifica se há imagem fullscreen (sem rounded/shadow/ring) dentro do hero
  const heroMatch = html.match(
    /<section\b[^>]*data-cdw-hero-overlay=["']1["'][^>]*>([\s\S]*?)<\/section>/i,
  );
  if (!heroMatch) return html;
  const inner = heroMatch[1];
  const bgImg = inner.match(
    /<div\s+class=["'][^"']*\babsolute\b[^"']*\binset-0\b[^"']*["'][^>]*>[\s\S]{0,400}?<img\b[^>]*\bclass=["']([^"']+)["']/i,
  );
  const imgCls = bgImg?.[1] ?? "";
  const isRealBg =
    bgImg &&
    !/\b(rounded-|shadow-|ring-)/i.test(imgCls) &&
    /object-cover/i.test(imgCls) &&
    /w-full/i.test(imgCls) &&
    /h-full/i.test(imgCls);
  if (isRealBg) return html;
  // Não é bg real → remove o marker (CSS deixa de aplicar)
  return html.replace(
    /(<section\b[^>]*)\s+data-cdw-hero-overlay=["']1["']/i,
    "$1",
  );
}

export function applyContrastFix(html: string): string {
  // 1) Reverte hero-overlay aplicado erroneamente em mockups
  let out = revertStaleHeroOverlay(html);

  // 2) Injeta CSS de contraste se body é light
  if (out.includes(`id="${CONTRAST_STYLE_ID}"`)) return out;

  const palette = detectPalette(out);
  if (palette.mode === "dark") return out;

  const css = lightModeOverrides();
  const styleTag = `<style id="${CONTRAST_STYLE_ID}">${css}</style>`;

  if (/<\/head>/i.test(out)) {
    return out.replace(/<\/head>/i, `${styleTag}\n</head>`);
  }
  return out.replace(/<body/i, `${styleTag}\n<body`);
}
