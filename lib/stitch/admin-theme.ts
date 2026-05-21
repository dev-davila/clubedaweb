/**
 * Extrai paleta + fontes do site Stitch publicado e devolve estilos pra
 * injetar no admin (`/gestor`). Resultado: admin compartilha identidade
 * visual do site.
 */

import { extractTokensFromHtml } from "./theme-extractor";
import { getPublishedStitchHtml } from "./published-pages";

export interface AdminThemeStyles {
  /** CSS string pronto pra inserir num <style> dentro do <head>. */
  css: string;
  /** Indica se há tema Stitch (false = fallback do M3 base). */
  hasStitchTheme: boolean;
  /** URL do Google Fonts pra carregar a tipografia (heading e body). */
  fontUrl?: string;
}

/** Hex `#RRGGBB` → "h s% l%" (formato esperado pelas vars `hsl(var(--primary))`). */
function hexToHsl(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return "186 100% 53%";
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function pickFont(fontStack: string): string {
  // "Inter, system-ui, sans-serif" → "Inter". Ignora Material Symbols, que
  // é fonte de ícone (não tipografia de texto).
  for (const raw of fontStack.split(",")) {
    const name = raw.replace(/['"]/g, "").trim();
    if (!name) continue;
    if (/material[\s-]?symbols?/i.test(name)) continue;
    if (/system-ui|sans-serif|serif|monospace/i.test(name)) continue;
    return name;
  }
  return "Inter";
}

/** Extrai a primeira fonte de texto não-ícone dos <link href="fonts.googleapis.com/css2?family=..."> */
function detectTextFont(html: string): string | null {
  const re = /fonts\.googleapis\.com\/css2\?family=([^&"'\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const name = decodeURIComponent(m[1].replace(/\+/g, " ")).split(":")[0];
    if (/material[\s-]?symbols?/i.test(name)) continue;
    return name;
  }
  return null;
}

export async function getAdminThemeStyles(): Promise<AdminThemeStyles> {
  const html = await getPublishedStitchHtml("home");
  if (!html) {
    return { css: "", hasStitchTheme: false };
  }

  const tokens = extractTokensFromHtml(html);
  const primary = tokens.primaryColor || "#10b981";
  const accent = tokens.accentColor || primary;
  const detectedFont = detectTextFont(html);
  const heading = detectedFont ?? pickFont(tokens.fontHeading || "Inter");
  const body = detectedFont ?? pickFont(tokens.fontPrimary || "Inter");
  const isDark = tokens.colorMode === "dark";

  // O admin tem fundo branco — aplicamos a cor primária do site nos elementos
  // de ação (botões verdes, sidebar ativa, focus rings). Heading font aplicada
  // em títulos. Body font no resto.
  const primaryHsl = hexToHsl(primary);
  const accentHsl = hexToHsl(accent);

  const css = `
:root {
  --stitch-primary: ${primary};
  --stitch-accent: ${accent};
  --stitch-bg: ${tokens.backgroundColor || "#ffffff"};
  --stitch-text: ${tokens.textColor || "#0f172a"};
  --stitch-font-heading: "${heading.replace(/"/g, "")}", "Inter", system-ui, sans-serif;
  --stitch-font-body: "${body.replace(/"/g, "")}", "Inter", system-ui, sans-serif;
  --stitch-color-mode: ${isDark ? "dark" : "light"};

  /* Sobrescreve as vars HSL do template root (globals.css) — afeta bg-primary,
     text-primary e text-link que usam hsl(var(--primary)). */
  --primary: ${primaryHsl} !important;
  --brand-primary: ${primaryHsl} !important;
  --accent: ${accentHsl} !important;
  --brand-accent: ${accentHsl} !important;
}

body { font-family: var(--stitch-font-body); }
h1, h2, h3, h4, h5, h6 { font-family: var(--stitch-font-heading); letter-spacing: -0.01em; }

/* Botões e elementos de ação seguem cor primária do site */
.bg-emerald-600,
.bg-emerald-500,
.bg-green-600,
.bg-green-500,
.hover\\:bg-emerald-700:hover,
.hover\\:bg-green-700:hover { background-color: var(--stitch-primary) !important; }

.hover\\:bg-emerald-700:hover,
.hover\\:bg-green-700:hover { filter: brightness(0.92); }

.text-emerald-600,
.text-emerald-700,
.text-emerald-800,
.text-emerald-900,
.text-green-600,
.text-green-700 { color: var(--stitch-primary) !important; }

.bg-emerald-50,
.bg-emerald-100,
.bg-green-50 { background-color: color-mix(in srgb, var(--stitch-primary) 10%, transparent) !important; }

.border-emerald-200,
.border-emerald-300,
.border-emerald-400,
.border-emerald-500,
.border-green-200,
.border-green-300 { border-color: color-mix(in srgb, var(--stitch-primary) 35%, transparent) !important; }

.focus\\:ring-emerald-500:focus,
.focus\\:ring-emerald-500\\/40:focus,
.focus\\:ring-green-500:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--stitch-primary) 30%, transparent) !important; }

/* Sidebar: item ativo usa cor do site */
nav a.bg-emerald-50, nav a.bg-green-50 { background-color: color-mix(in srgb, var(--stitch-primary) 12%, transparent) !important; color: var(--stitch-primary) !important; }
nav a.bg-emerald-50 svg, nav a.bg-green-50 svg { color: var(--stitch-primary) !important; }

/* Botão "Nova Pauta" no topo da sidebar */
[class*="bg-gradient-to"][class*="from-emerald"],
[class*="bg-gradient-to"][class*="from-green"] {
  background: var(--stitch-primary) !important;
}
`;

  // URL do Google Fonts pra carregar as 2 famílias (heading + body)
  const families = new Set([heading, body]);
  const familyParams = [...families]
    .filter((f) => !/system-ui/i.test(f))
    .map((f) => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700`);
  const fontUrl = familyParams.length
    ? `https://fonts.googleapis.com/css2?${familyParams.join("&")}&display=swap`
    : undefined;

  return { css, hasStitchTheme: true, fontUrl };
}
