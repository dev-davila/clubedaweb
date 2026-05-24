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
 * Overrides CSS pra forçar contraste legível em paleta LIGHT.
 * As classes vêm do tailwind-config do Stitch e são frequentemente brancas
 * mesmo quando o body é light — esse override garante texto escuro.
 *
 * Pra paleta DARK não fazemos nada (assume o Stitch acerta lá).
 */
function lightModeOverrides(): string {
  return `
.text-on-surface, .text-on-background { color: #111827 !important; }
.text-on-surface-variant { color: #4b5563 !important; }
.text-surface, .text-background { color: #111827 !important; }
.text-on-primary-fixed-variant { color: #1f2937 !important; }
.text-on-secondary-fixed-variant { color: #1f2937 !important; }
.text-on-tertiary-fixed-variant { color: #1f2937 !important; }
/* Material symbols com text-surface (que costuma ser igual ao bg → invisível) */
.material-symbols-outlined.text-surface,
.material-symbols-outlined.text-on-surface-variant { color: #6b7280 !important; }
/* Hero/cards com bg-transparent ou bg-white/X com text-white aninhado:
   Stitch coloca text-white em CTAs over heroes mas quando o hero não tem
   bg-image, fica branco em branco. Força gray-900 pra elementos visíveis
   em superfícies claras. */
.bg-transparent .text-white,
[class*="bg-surface"] .text-white:not([class*="bg-primary"]):not([class*="bg-zinc-9"]):not([class*="bg-slate-9"]):not([class*="bg-gray-9"]) {
  color: #111827 !important;
}
`.trim();
}

export function applyContrastFix(html: string): string {
  // Idempotência
  if (html.includes(`id="${CONTRAST_STYLE_ID}"`)) return html;

  const palette = detectPalette(html);
  if (palette.mode === "dark") return html; // tema dark — Stitch geralmente acerta

  const css = lightModeOverrides();
  const styleTag = `<style id="${CONTRAST_STYLE_ID}">${css}</style>`;

  // Injeta depois do </style> existente ou antes de </head>
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${styleTag}\n</head>`);
  }
  return html.replace(/<body/i, `${styleTag}\n<body`);
}
