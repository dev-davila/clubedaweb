// Mapa de segmento → tema visual rico (paleta + tipografia + sensação).
// Usado por buildDesignLanguageBlock pra dar mais material ao Stitch quando
// o briefing tem só "industry" e nenhuma cor/referência explícita.
//
// Diferente de inferPaletteHint (1 linha de paleta), esse mapa dá um bloco
// completo de "design system sugerido" para o Stitch interpretar.

export interface SegmentTheme {
  name: string;
  palette: {
    primary: string;
    accent: string;
    darkBg: string;
    lightBg: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  iconSet: string;
  moodWords: string[];
}

const THEMES: Record<string, SegmentTheme> = {
  advocacia: {
    name: "Advocacia Premium",
    palette: {
      primary: "#1E3A5F",
      accent: "#C9A84C",
      darkBg: "#1A1A2E",
      lightBg: "#F8F9FA",
    },
    typography: {
      heading: "Playfair Display, Georgia, serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "balança, escudo, livros, certificados",
    moodWords: ["sério", "tradicional", "confiável", "premium"],
  },
  saude: {
    name: "Saúde Acolhedora",
    palette: {
      primary: "#0F7B8A",
      accent: "#7FC8A9",
      darkBg: "#0E2A3A",
      lightBg: "#F5FBFA",
    },
    typography: {
      heading: "DM Serif Display, Georgia, serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "coração, cruz médica, sorriso, pessoas",
    moodWords: ["acolhedor", "limpo", "humano", "confiável"],
  },
  tech: {
    name: "Tech / SaaS Moderno",
    palette: {
      primary: "#0B1020",
      accent: "#22D3EE",
      darkBg: "#050813",
      lightBg: "#F4F6FB",
    },
    typography: {
      heading: "Space Grotesk, Inter, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "linhas geométricas, gradientes sutis, dashboard mockups",
    moodWords: ["moderno", "dinâmico", "preciso", "inovador"],
  },
  financeiro: {
    name: "Contábil / Financeiro",
    palette: {
      primary: "#0F3D2E",
      accent: "#D4AF37",
      darkBg: "#0A1F18",
      lightBg: "#F6F7F4",
    },
    typography: {
      heading: "Source Serif Pro, Georgia, serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "gráficos, cálculo, prédios corporativos",
    moodWords: ["sólido", "seguro", "transparente", "experiente"],
  },
  educacao: {
    name: "Educação / Cursos",
    palette: {
      primary: "#2D2A6E",
      accent: "#F59E0B",
      darkBg: "#1A1840",
      lightBg: "#FAF7F0",
    },
    typography: {
      heading: "Fraunces, Georgia, serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "livros, certificado, vídeo, comunidade",
    moodWords: ["acessível", "inspirador", "didático", "premium"],
  },
  varejo: {
    name: "Varejo / E-commerce",
    palette: {
      primary: "#111111",
      accent: "#E11D48",
      darkBg: "#0A0A0A",
      lightBg: "#FFFFFF",
    },
    typography: {
      heading: "Inter Tight, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "produto, carrinho, entrega, etiqueta",
    moodWords: ["direto", "vibrante", "conversor", "atual"],
  },
  gastronomia: {
    name: "Gastronomia / Padaria",
    palette: {
      primary: "#7C2D12",
      accent: "#F59E0B",
      darkBg: "#1C0A05",
      lightBg: "#FAF6F0",
    },
    typography: {
      heading: "Fraunces, Georgia, serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "trigo, café, garfo, chef",
    moodWords: ["quente", "artesanal", "acolhedor", "saboroso"],
  },
  default: {
    name: "Corporativo Neutro",
    palette: {
      primary: "#1F2937",
      accent: "#2563EB",
      darkBg: "#0F172A",
      lightBg: "#F8FAFC",
    },
    typography: {
      heading: "Inter Tight, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
    iconSet: "ícones lineares neutros",
    moodWords: ["profissional", "claro", "confiável"],
  },
};

const SEGMENT_RULES: Array<{ pattern: RegExp; theme: keyof typeof THEMES }> = [
  { pattern: /advoca|jur[ií]dic|tribut[áa]ri|escrit[óo]rio de/i, theme: "advocacia" },
  { pattern: /sa[úu]de|cl[íi]nic|odonto|m[ée]dic|fisio|psic|hospital|wellness/i, theme: "saude" },
  { pattern: /software|saas|tech|tecnolog|plataforma|api|dev|startup|digital/i, theme: "tech" },
  { pattern: /cont[áa]bil|contador|fiscal|financeir|auditori|investiment|banco/i, theme: "financeiro" },
  { pattern: /educa|curso|ensino|treinament|escola|academia/i, theme: "educacao" },
  { pattern: /varejo|loja|e-?commerce|moda|marketplace/i, theme: "varejo" },
  { pattern: /padaria|confeitaria|café|cafe|restaurante|gastronomia|culinári/i, theme: "gastronomia" },
];

export function pickTheme(industry: string | null | undefined): SegmentTheme {
  const normalized = String(industry ?? "").toLowerCase();
  for (const rule of SEGMENT_RULES) {
    if (rule.pattern.test(normalized)) return THEMES[rule.theme];
  }
  return THEMES.default;
}

/**
 * Bloco de design system sugerido — vai para o prompt do Stitch quando o
 * cliente não definiu paleta/cores explícitas. Substitui a hint de 1 linha
 * por um direcionamento concreto.
 */
export function themeBlock(theme: SegmentTheme): string {
  return [
    `### Design system sugerido (segmento: ${theme.name})`,
    `Paleta:`,
    `  - Primária: ${theme.palette.primary}`,
    `  - Accent: ${theme.palette.accent}`,
    `  - Background escuro (footer/hero invertido): ${theme.palette.darkBg}`,
    `  - Background claro: ${theme.palette.lightBg}`,
    `Tipografia: títulos em "${theme.typography.heading}"; corpo em "${theme.typography.body}".`,
    `Elementos visuais: ${theme.iconSet}.`,
    `Sensação: ${theme.moodWords.join(", ")}.`,
  ].join("\n");
}
