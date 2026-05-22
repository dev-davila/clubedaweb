/**
 * Quando o Stitch gera um <section data-block="hero"> com <img> em
 * background fullscreen (absolute inset-0), o texto do hero (h1/h2/p)
 * costuma ficar com cor escura em cima da foto — ilegível.
 *
 * Esta função detecta esse padrão e injeta:
 *  1. Um overlay dark gradient com z-index 1 (acima da img, abaixo do conteúdo)
 *  2. CSS pra forçar texto claro no hero
 *
 * Idempotente: marca a section com `data-cdw-hero-overlay="1"` pra não duplicar.
 */

const HERO_OVERLAY_CSS = `
<style id="__cdw_hero_overlay">
  section[data-cdw-hero-overlay="1"]::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.12) 100%);
    z-index: 1;
    pointer-events: none;
  }
  section[data-cdw-hero-overlay="1"] > *:not(.absolute) {
    position: relative;
    z-index: 2;
  }
  section[data-cdw-hero-overlay="1"] h1,
  section[data-cdw-hero-overlay="1"] h2,
  section[data-cdw-hero-overlay="1"] p,
  section[data-cdw-hero-overlay="1"] span:not([class*="bg-"]),
  section[data-cdw-hero-overlay="1"] a:not([class*="bg-"]):not([class*="border"]) {
    color: #ffffff !important;
    text-shadow: 0 2px 12px rgba(0,0,0,0.4);
  }
  section[data-cdw-hero-overlay="1"] span[class*="bg-"] {
    backdrop-filter: blur(2px);
  }
  /* Botões outline (border + bg transparente) ficam INVISÍVEIS sobre overlay
     dark. Forçamos border branca, texto branco e bg sutil. */
  section[data-cdw-hero-overlay="1"] a[class*="border"]:not([class*="border-b-"]),
  section[data-cdw-hero-overlay="1"] button[class*="border"]:not([class*="border-b-"]) {
    border-color: rgba(255,255,255,0.85) !important;
    color: #ffffff !important;
    background-color: rgba(255,255,255,0.08) !important;
    backdrop-filter: blur(4px);
  }
  section[data-cdw-hero-overlay="1"] a[class*="border"]:hover,
  section[data-cdw-hero-overlay="1"] button[class*="border"]:hover {
    background-color: rgba(255,255,255,0.18) !important;
  }
  /* Botões sólidos com bg-primary etc — só garantia de sombra pra destacar
     do overlay (sem mudar a cor). */
  section[data-cdw-hero-overlay="1"] a[class*="bg-primary"],
  section[data-cdw-hero-overlay="1"] button[class*="bg-primary"] {
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  }
</style>
`;

const HERO_RE = /<section\b([^>]*?)\bdata-block=["']hero["']([^>]*)>([\s\S]*?)<\/section>/i;

export function injectHeroOverlay(html: string): string {
  const match = html.match(HERO_RE);
  if (!match) return html;

  const before = match[1];
  const after = match[2];
  const inner = match[3];

  // Já tem overlay? skip
  if (/data-cdw-hero-overlay/.test(before + after)) return html;

  // Hero tem <img> com inset-0/absolute fullscreen como background?
  const hasBgImage = /<div\s+class=["'][^"']*\babsolute\b[^"']*\binset-0\b[^"']*["'][^>]*>[\s\S]{0,400}?<img\b/i.test(inner);
  if (!hasBgImage) return html;

  // Marca section e injeta style global
  const newSection = `<section${before} data-block="hero" data-cdw-hero-overlay="1"${after}>${inner}</section>`;
  let out = html.replace(HERO_RE, newSection);

  if (!/__cdw_hero_overlay/.test(out)) {
    if (/<\/head>/i.test(out)) {
      out = out.replace(/<\/head>/i, `${HERO_OVERLAY_CSS}\n</head>`);
    } else {
      out = HERO_OVERLAY_CSS + out;
    }
  }
  return out;
}
