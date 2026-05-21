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
}

function pickFont(fontStack: string): string {
  // "Inter, system-ui, sans-serif" → "Inter"
  return fontStack
    .split(",")[0]
    .replace(/['"]/g, "")
    .trim();
}

export async function getAdminThemeStyles(): Promise<AdminThemeStyles> {
  const html = await getPublishedStitchHtml("home");
  if (!html) {
    return { css: "", hasStitchTheme: false };
  }

  const tokens = extractTokensFromHtml(html);
  const primary = tokens.primaryColor || "#10b981";
  const accent = tokens.accentColor || primary;
  const heading = pickFont(tokens.fontHeading || "Inter");
  const body = pickFont(tokens.fontPrimary || "Inter");
  const isDark = tokens.colorMode === "dark";

  // O admin tem fundo branco — aplicamos a cor primária do site nos elementos
  // de ação (botões verdes, sidebar ativa, focus rings). Heading font aplicada
  // em títulos. Body font no resto.
  const css = `
:root {
  --stitch-primary: ${primary};
  --stitch-accent: ${accent};
  --stitch-bg: ${tokens.backgroundColor || "#ffffff"};
  --stitch-text: ${tokens.textColor || "#0f172a"};
  --stitch-font-heading: "${heading.replace(/"/g, "")}", "Inter", system-ui, sans-serif;
  --stitch-font-body: "${body.replace(/"/g, "")}", "Inter", system-ui, sans-serif;
  --stitch-color-mode: ${isDark ? "dark" : "light"};
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

  return { css, hasStitchTheme: true };
}
