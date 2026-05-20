import type { ExtractedTokens } from "@/lib/wizard/types";

const HEX_RE = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
const RGB_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
const FONT_RE = /font-family\s*:\s*([^;"'}]+)/gi;
const TW_BG_RE = /\bbg-([a-z]+)-(\d{2,3})\b/g;
const TW_TEXT_RE = /\btext-([a-z]+)-(\d{2,3})\b/g;
const TW_BORDER_RE = /\brounded(-[a-z0-9]+)?\b/g;

const TAILWIND_BASE: Record<string, Record<number, string>> = {
  slate: { 50: "#F8FAFC", 100: "#F1F5F9", 600: "#475569", 700: "#334155", 800: "#1E293B", 900: "#0F172A" },
  gray: { 50: "#F9FAFB", 100: "#F3F4F6", 600: "#4B5563", 700: "#374151", 800: "#1F2937", 900: "#111827" },
  zinc: { 50: "#FAFAFA", 100: "#F4F4F5", 600: "#52525B", 700: "#3F3F46", 800: "#27272A", 900: "#18181B" },
  neutral: { 50: "#FAFAFA", 100: "#F5F5F5", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717" },
  stone: { 50: "#FAFAF9", 100: "#F5F5F4", 600: "#57534E", 700: "#44403C", 800: "#292524", 900: "#1C1917" },
  red: { 50: "#FEF2F2", 100: "#FEE2E2", 500: "#EF4444", 600: "#DC2626", 700: "#B91C1C", 800: "#991B1B" },
  orange: { 500: "#F97316", 600: "#EA580C", 700: "#C2410C" },
  amber: { 500: "#F59E0B", 600: "#D97706" },
  yellow: { 500: "#EAB308", 600: "#CA8A04" },
  lime: { 500: "#84CC16" },
  green: { 500: "#22C55E", 600: "#16A34A", 700: "#15803D" },
  emerald: { 500: "#10B981", 600: "#059669", 700: "#047857" },
  teal: { 500: "#14B8A6", 600: "#0D9488" },
  cyan: { 500: "#06B6D4", 600: "#0891B2" },
  sky: { 500: "#0EA5E9", 600: "#0284C7" },
  blue: { 500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8", 800: "#1E40AF" },
  indigo: { 500: "#6366F1", 600: "#4F46E5", 700: "#4338CA" },
  violet: { 500: "#8B5CF6", 600: "#7C3AED" },
  purple: { 500: "#A855F7", 600: "#9333EA" },
  fuchsia: { 500: "#D946EF" },
  pink: { 500: "#EC4899", 600: "#DB2777" },
  rose: { 500: "#F43F5E", 600: "#E11D48" },
};

const RADIUS_MAP: Record<string, string> = {
  "": "4px",
  "-none": "0",
  "-sm": "2px",
  "-md": "6px",
  "-lg": "8px",
  "-xl": "12px",
  "-2xl": "16px",
  "-3xl": "24px",
  "-full": "9999px",
};

const NEUTRAL_KEYS = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

function tallyColor(map: Map<string, number>, value: string, weight = 1) {
  const normalized = normalizeHex(value);
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + weight);
}

function normalizeHex(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9A-F]{3}$/.test(trimmed)) {
    const [_, r, g, b] = trimmed.match(/^#([0-9A-F])([0-9A-F])([0-9A-F])$/) ?? [];
    if (r && g && b) return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (trimmed.startsWith("RGB")) {
    const parts = trimmed.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const [r, g, b] = parts.slice(0, 3).map((p) => parseInt(p, 10));
      return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    }
  }
  return null;
}

function isNeutralHex(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 18; // low chroma
}

function pickTop(map: Map<string, number>, predicate?: (hex: string) => boolean): string | null {
  const entries = [...map.entries()]
    .filter(([hex]) => (predicate ? predicate(hex) : true))
    .sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

function rotateHue(hex: string, degrees: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
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
  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const rr = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const gg = Math.round(hue2rgb(p, q, h) * 255);
  const bb = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${[rr, gg, bb].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function darkenHex(hex: string, amount = 0.18): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function readTailwindClass(name: string, shade: number): string | null {
  return TAILWIND_BASE[name]?.[shade] ?? null;
}

function detectFont(html: string): string {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = FONT_RE.exec(html))) matches.push(m[1].trim());
  // Tailwind class hints
  if (/\bfont-(serif|mono|sans)\b/.test(html)) {
    if (/font-serif/.test(html)) return '"Source Serif Pro", Georgia, serif';
    if (/font-mono/.test(html)) return '"JetBrains Mono", monospace';
  }
  const link = html.match(/fonts\.googleapis\.com\/css2\?family=([^&"'\s]+)/i);
  if (link) {
    const name = decodeURIComponent(link[1].replace(/\+/g, " ")).split(":")[0];
    return `"${name}", system-ui, sans-serif`;
  }
  return matches[0]?.replace(/['"]+$/, "") ?? "Inter, system-ui, sans-serif";
}

function detectRadius(html: string): string {
  const counts = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = TW_BORDER_RE.exec(html))) {
    const suffix = m[1] ?? "";
    counts.set(suffix, (counts.get(suffix) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-lg";
  return RADIUS_MAP[top] ?? "8px";
}

export function extractTokensFromHtml(html: string): ExtractedTokens {
  if (!html || html.trim().length === 0) return fallbackTokens("");

  const colorVotes = new Map<string, number>();

  // 1. Tailwind classes (most reliable signal)
  let m: RegExpExecArray | null;
  while ((m = TW_BG_RE.exec(html))) {
    const hex = readTailwindClass(m[1], parseInt(m[2], 10));
    if (hex) tallyColor(colorVotes, hex, 2);
  }
  while ((m = TW_TEXT_RE.exec(html))) {
    const hex = readTailwindClass(m[1], parseInt(m[2], 10));
    if (hex) tallyColor(colorVotes, hex, 1);
  }

  // 2. Hex literals
  while ((m = HEX_RE.exec(html))) {
    tallyColor(colorVotes, m[0]);
  }

  // 3. RGB literals
  while ((m = RGB_RE.exec(html))) {
    tallyColor(colorVotes, `rgb(${m[1]},${m[2]},${m[3]})`);
  }

  const primary =
    pickTop(colorVotes, (h) => !isNeutralHex(h)) ?? "#3B82F6";
  const secondary =
    pickTop(colorVotes, (h) => !isNeutralHex(h) && h !== primary) ??
    darkenHex(primary);
  const accent =
    pickTop(colorVotes, (h) => !isNeutralHex(h) && h !== primary && h !== secondary) ??
    rotateHue(primary, 120);

  // Detecta colorMode pelo HTML: se body tem bg-slate-900/950/zinc-900 etc OU
  // <body class="...dark..."> OU style body{background:#0X...} → dark.
  const isDark = detectDarkMode(html);
  const backgroundColor = isDark ? "#0F172A" : "#FFFFFF";
  const surfaceColor = isDark ? "#1E293B" : "#F9FAFB";
  const textColor = isDark
    ? "#F8FAFC"
    : pickTop(colorVotes, (h) => isNeutralHex(h) && h !== "#FFFFFF") ?? "#1F2937";
  const textLightColor = isDark ? "#94A3B8" : "#6B7280";

  const fontFamily = detectFont(html);
  const radius = detectRadius(html);

  return {
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    textColor,
    textLightColor,
    backgroundColor,
    surfaceColor,
    fontPrimary: fontFamily,
    fontHeading: fontFamily,
    borderRadius: radius,
    styleType: isDark ? "tech-dark" : "corporate",
    colorMode: isDark ? "dark" : "light",
  };
}

export function detectDarkMode(html: string): boolean {
  // 1. <body> ou <main> com classe bg-slate-900/950, bg-zinc-900, bg-gray-900, bg-neutral-900, bg-stone-900
  if (/<body[^>]*class=["'][^"']*\bbg-(slate|zinc|gray|neutral|stone)-(8|9)\d\d\b/i.test(html)) return true;
  // 2. body { background-color: #0X... } no <style>
  const bodyStyle = html.match(/<style[\s\S]*?body\s*\{[^}]*background(-color)?\s*:\s*(#[0-9a-f]{6}|rgb[^;]+)/i);
  if (bodyStyle) {
    const bg = bodyStyle[2].toLowerCase();
    if (/^#0[0-9a-f]/.test(bg) || /^#1[0-9a-f]/.test(bg)) return true;
  }
  // 3. <html class="dark"> ou <body class="dark">
  if (/<(html|body)[^>]*\bclass=["'][^"']*\bdark\b/i.test(html)) return true;
  // 4. Maior parte do conteúdo usa text-white / text-slate-50 — sinal forte
  const whiteTextHits = (html.match(/\btext-(white|slate-50|slate-100|gray-50|gray-100|zinc-50|neutral-50)\b/gi) ?? []).length;
  if (whiteTextHits >= 5) return true;
  return false;
}

/**
 * Used when Stitch is unreachable or returns nothing. The "prompt" string is
 * scanned for color keywords so the fallback at least loosely matches the
 * customer's intent (e.g. "azul" → blue, "vermelho" → red).
 */
export function fallbackTokens(prompt: string): ExtractedTokens {
  const lower = prompt.toLowerCase();
  let primary = "#3B82F6";
  // Order matters — earthy tones must be checked before generic colors to avoid
  // "ocre amarelo" matching "amarelo" instead of "ocre".
  if (/(terracota|terracotta|tijolo)/.test(lower)) primary = "#B45309";
  else if (/(marrom|brown|caf[ée]|chocolate|sepia|s[ée]pia)/.test(lower)) primary = "#92400E";
  else if (/(bege|beige|areia|sand|nude)/.test(lower)) primary = "#D6A972";
  else if (/(dourad|gold|champagne)/.test(lower)) primary = "#C99A2E";
  else if (/(s[áa]lvia|salvia|oliva|olive|musgo|verde[\s-]?escur)/.test(lower)) primary = "#4D7C0F";
  else if (/(turquesa|turquoise|ciano|cyan|cerúl|cerul)/.test(lower)) primary = "#0891B2";
  else if (/(navy|n[áa]utico|marinho|petróleo|petroleo)/.test(lower)) primary = "#1E3A8A";
  else if (/(vermelho|red|carmesi|carmim|escarlate|bord[ôo]|bordo|vinho)/.test(lower)) primary = "#DC2626";
  else if (/(verde|green|esmerald)/.test(lower)) primary = "#059669";
  else if (/(roxo|purple|violeta|lil[áa]s|lavanda|amet[ií]sta)/.test(lower)) primary = "#7C3AED";
  else if (/(amarelo|ocre|yellow|mostarda|mustard)/.test(lower)) primary = "#EAB308";
  else if (/(rosa|pink|magenta|coral|sal[ãa]o)/.test(lower)) primary = "#DB2777";
  else if (/(laranja|orange|p[êe]ssego|peach|abóbora|abobora)/.test(lower)) primary = "#EA580C";
  else if (/(preto|black|escuro|grafite|carv[ãa]o|carvao)/.test(lower)) primary = "#111827";
  else if (/(cinza|gray|grey|prata|silver)/.test(lower)) primary = "#475569";
  else if (/(azul|blue)/.test(lower)) primary = "#2563EB";

  // Heurística de colorMode: tech/SaaS/varejo/saas/dark → dark; resto → light.
  const isDark =
    /(dark|escuro|preto|black|noturno|night|cyberpunk|hacker)/.test(lower) ||
    /(saas|software|tech|tecnolog|startup|api|cyber|seguranç|m3solutions|cloud|servidor|infraestrutura)/.test(lower);
  const colorMode: "dark" | "light" = isDark ? "dark" : "light";
  const backgroundColor = isDark ? "#0F172A" : "#FFFFFF";
  const surfaceColor = isDark ? "#1E293B" : "#F9FAFB";
  const textColor = isDark ? "#F8FAFC" : "#1F2937";
  const textLightColor = isDark ? "#94A3B8" : "#6B7280";

  return {
    primaryColor: primary,
    secondaryColor: darkenHex(primary, 0.22),
    accentColor: rotateHue(primary, 140),
    textColor,
    textLightColor,
    backgroundColor,
    surfaceColor,
    fontPrimary: "Inter, system-ui, sans-serif",
    fontHeading: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    styleType: isDark ? "tech-dark" : "corporate",
    colorMode,
  };
}
