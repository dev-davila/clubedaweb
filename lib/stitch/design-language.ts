import type { WizardAnswers } from "@/lib/wizard/types";
import { detectUserColorMode, pickTheme, themeBlock } from "@/lib/wizard/design-themes";

const TONE_REFERENCES: Record<string, string> = {
  corporativo: "consultoria premium nível McKinsey/Accenture — não template SaaS azul genérico. Referências: stripe.com, notion.so",
  moderno: "startup B2B nível Vercel/Linear — clean, espaçosa, tipografia dominante, sem gradiente roxo",
  acolhedor: "negócio de bairro premium — calor humano real, não ilustrações flat genéricas. Referências: sites de restaurantes premiados",
  elegante: "marca sofisticada nível LVMH/Apple — tipografia como elemento principal, espaço negativo intencional, zero clutter",
  jovem: "marca com energia e personalidade — Figma.com, Framer.com como referência de energia sem ser infantil",
  tradicional: "institucional de autoridade — legibilidade, densidade controlada, credibilidade acima de efeitos visuais",
};

function inferPaletteHint(answers: WizardAnswers): string {
  if (answers.colors?.trim()) return `Paleta do cliente: ${answers.colors.trim()}.`;
  const industry = (answers.industry ?? "").toLowerCase();
  if (/padaria|confeitaria|café|cafe|restaurante|gastronomia/.test(industry)) {
    return "Paleta quente: stone/amber/orange, fundos cream (#FAF6F0 ou stone-50).";
  }
  if (/saúde|clínica|odont|médic|wellness|fisioterap/.test(industry)) {
    return "Paleta saúde: emerald/teal com neutros slate, fundo claro higiênico.";
  }
  if (/advocacia|juríd|contábil|financ|consultoria/.test(industry)) {
    return "Paleta sóbria: slate/navy com um acento discreto (não azul #3B82F6 padrão).";
  }
  if (/tech|software|ti|digital|agência/.test(industry)) {
    return "Paleta tech: slate/indigo ou zinc com acento vibrante controlado.";
  }
  return `Paleta harmônica com tom "${answers.tone ?? "corporativo"}" — evite azul genérico salvo briefing.`;
}

/** Bloco DESIGN LANGUAGE para prompts Stitch (estilo gurbuzer/dalmaer). */
export function buildDesignLanguageBlock(answers: WizardAnswers): string {
  const tone = (answers.tone ?? "corporativo").toLowerCase();
  const ref =
    TONE_REFERENCES[tone] ??
    TONE_REFERENCES.corporativo;
  const company = answers.companyName?.trim() || "a empresa";
  const segment = answers.industry?.trim() || "serviços";

  // Tema rico do segmento — sempre emitido pra garantir MODO DE COR no prompt.
  // Quando o cliente pediu dark/light no `colors`, sobrepõe o default.
  const theme = pickTheme(answers.industry);
  const userMode = detectUserColorMode(answers.colors);
  const themeSection = themeBlock(theme, userMode);

  return [
    `## Design language`,
    `Site institucional **desktop-first**, uma página HTML responsiva (sm/md/lg). **Sem** bottom navigation, tabs de app mobile ou padrões de React Native/Flutter.`,
    `Marca: ${company} — segmento ${segment}. Tom: ${answers.tone ?? "corporativo"} (${ref}).`,
    inferPaletteHint(answers),
    themeSection,
    `Tipografia: combinar 2 fontes Google Fonts — 1 display/serif para títulos impactantes (Fraunces, DM Serif Display, Playfair Display, Cormorant) + 1 sans moderna para corpo (Inter, Manrope, Plus Jakarta Sans). Saltos dramáticos de tamanho entre display/h1/h2/body.`,
    `Layout com caráter: assimetria intencional, tipografia quebrando grid, sobreposição de elementos decorativos, seções com fundos alternados. Pense Awwwards, não template.`,
    `Micro-interações com JS vanilla: IntersectionObserver para scroll reveal, contadores animados para stats/métricas, sticky header que muda opacity/blur ao scrollar, hover 3D-tilt em cards premium.`,
    `Componentes: cards com bordas sutis e hover:scale + shadow profunda; botões primários com gradiente ou fill sólido da paleta; badges como chips com cor de acento.`,
  ]
    .filter(Boolean)
    .join("\n");
}
