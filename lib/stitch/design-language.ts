import type { WizardAnswers } from "@/lib/wizard/types";
import { pickTheme, themeBlock } from "@/lib/wizard/design-themes";

const TONE_REFERENCES: Record<string, string> = {
  corporativo: "consultoria premium e confiável — não template SaaS azul genérico",
  moderno: "startup B2B polida — limpa, espaçosa, sem clichês de gradiente roxo",
  acolhedor: "negócio de bairro premium — calor humano, convite à visita",
  elegante: "marca sofisticada — tipografia refinada, poucos elementos, alto contraste",
  jovem: "marca dinâmica — energia sem parecer app de jogos",
  tradicional: "institucional clássico — seriedade e legibilidade acima de efeitos",
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

  // Tema rico do segmento — só injetado quando o cliente não passou cores
  // próprias (senão honra o briefing dele).
  const theme = pickTheme(answers.industry);
  const hasClientPalette = (answers.colors?.trim().length ?? 0) >= 3;
  const themeSection = hasClientPalette ? "" : themeBlock(theme);

  return [
    `## Design language`,
    `Site institucional **desktop-first**, uma página HTML responsiva (sm/md/lg). **Sem** bottom navigation, tabs de app mobile ou padrões de React Native/Flutter.`,
    `Marca: ${company} — segmento ${segment}. Tom: ${answers.tone ?? "corporativo"} (${ref}).`,
    inferPaletteHint(answers),
    themeSection,
    `Tipografia: sans-serif moderna (Inter, Manrope ou Plus Jakarta Sans) nos corpos; títulos podem usar contraste serif só se combinar com o tom.`,
    `Componentes: cards \`rounded-xl\` com sombra suave; botões primários \`rounded-lg\`; hover com \`transition\` Tailwind apenas.`,
    `Micro-interações: estados focus em formulários e hover em cards — sem JavaScript, sem confetti ou animações pesadas.`,
  ]
    .filter(Boolean)
    .join("\n");
}
