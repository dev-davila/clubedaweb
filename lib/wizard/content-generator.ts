import { logger } from "@/lib/logger";
import type { WizardAnswers } from "./types";

export interface GeneratedHero {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

export interface GeneratedFeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface GeneratedFeatures {
  title: string;
  subtitle: string;
  items: GeneratedFeatureItem[];
}

export interface GeneratedCta {
  title: string;
  text: string;
  buttonText: string;
  buttonLink: string;
}

export interface GeneratedContent {
  hero: GeneratedHero;
  features: GeneratedFeatures;
  cta: GeneratedCta;
  provider: "openai" | "abacus" | "fallback";
}

const SYSTEM_PROMPT = `Você é um copywriter sênior brasileiro especializado em sites institucionais.
Sua tarefa: a partir de um briefing curto, escrever textos para a página inicial.
Tom: profissional mas natural, sem clichês ("excelência em servir", "soluções inovadoras", "do tamanho do seu sonho").
Específico ao negócio descrito, não genérico.
Português do Brasil. Frases curtas. Verbos no ativo.

Você deve responder APENAS com um JSON válido seguindo EXATAMENTE este schema (sem comentários, sem markdown, sem prosa):

{
  "hero": {
    "badge": "string curta uppercase (max 28 chars, ex.: 'CONSULTORIA DE TI')",
    "title": "título principal da home (max 80 chars, sem ponto final)",
    "subtitle": "1-2 frases (max 200 chars)",
    "ctaText": "texto do CTA primário (max 24 chars, verbo no imperativo)",
    "ctaLink": "#contato",
    "secondaryCtaText": "texto do CTA secundário (max 28 chars)",
    "secondaryCtaLink": "#servicos"
  },
  "features": {
    "title": "título da seção de diferenciais (max 60 chars)",
    "subtitle": "subtítulo (max 140 chars)",
    "items": [
      { "icon": "nome de ícone Lucide PascalCase (ex.: 'Shield', 'Cpu', 'Heart')", "title": "título do card (max 36 chars)", "description": "descrição (max 140 chars)" },
      { "icon": "...", "title": "...", "description": "..." },
      { "icon": "...", "title": "...", "description": "..." }
    ]
  },
  "cta": {
    "title": "título da CTA final (max 60 chars)",
    "text": "parágrafo curto (max 200 chars)",
    "buttonText": "max 24 chars",
    "buttonLink": "#contato"
  }
}

Ícones Lucide sugeridos por tema (escolha 3 que façam sentido pro negócio):
- Tecnologia/TI: Cpu, Server, Code, Cloud, ShieldCheck, Zap, Database, Network
- Saúde/cuidado: Heart, Stethoscope, Activity, Users, Smile
- Alimentação: Coffee, Utensils, Wheat, Cookie, ChefHat
- Educação: BookOpen, GraduationCap, Lightbulb, PenTool
- Varejo/moda: ShoppingBag, Sparkles, Gift, Tag, Star
- Serviços profissionais: Briefcase, Award, Target, TrendingUp, Handshake
- Construção/indústria: Wrench, HardHat, Truck, Factory
- Segurança: Shield, Lock, Eye, AlertTriangle

Se faltar info no briefing, infira com bom senso pelo contexto. Nunca invente fatos específicos (nome de produto, ano de fundação, números de clientes) que não estejam no briefing.`;

function buildUserPrompt(answers: WizardAnswers): string {
  return [
    `Briefing:`,
    `- Empresa: ${answers.companyName ?? "(não informado)"}`,
    `- Atividade: ${answers.industry ?? "(não informado)"}`,
    `- Público-alvo: ${answers.audience ?? "(não informado)"}`,
    `- Tom da marca: ${answers.tone ?? "corporativo, sério"}`,
    `- Paleta de cores: ${answers.colors ?? "(sem preferência)"}`,
    `- Referências: ${(answers.references ?? []).join(", ") || "(nenhuma)"}`,
    ``,
    `Gere o JSON da home seguindo o schema do system prompt.`,
  ].join("\n");
}

function pickLLMConfig(): { url: string; key: string; model: string; provider: "openai" | "abacus" } | null {
  if (process.env.OPENAI_API_KEY) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      key: process.env.OPENAI_API_KEY,
      model: process.env.WIZARD_LLM_MODEL ?? "gpt-4o-mini",
      provider: "openai",
    };
  }
  if (process.env.ABACUSAI_API_KEY) {
    return {
      url: "https://routellm.abacus.ai/v1/chat/completions",
      key: process.env.ABACUSAI_API_KEY,
      model: process.env.WIZARD_LLM_MODEL ?? "gpt-4o-mini",
      provider: "abacus",
    };
  }
  return null;
}

function cleanupJsonString(raw: string): string {
  let s = raw.trim();
  // Strip markdown code fences if present
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  // Some models add prose before the JSON; find first '{' and last '}'
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first > 0 || last < s.length - 1) {
    if (first >= 0 && last > first) s = s.slice(first, last + 1);
  }
  return s;
}

function validateShape(obj: any): obj is Omit<GeneratedContent, "provider"> {
  if (!obj || typeof obj !== "object") return false;
  if (!obj.hero?.title || !obj.hero?.subtitle) return false;
  if (!obj.features?.items || !Array.isArray(obj.features.items) || obj.features.items.length < 1) return false;
  if (!obj.cta?.title || !obj.cta?.buttonText) return false;
  return true;
}

/** Gera copy da home (delega ao gerador do site completo). */
export async function generateContent(answers: WizardAnswers): Promise<GeneratedContent> {
  const { generateSiteContent } = await import("./site-content-generator");
  const site = await generateSiteContent(answers);
  const { hero, features, cta } = site.home;
  return {
    hero: {
      ...hero,
      secondaryCtaText: hero.secondaryCtaText ?? "Conheça nossos serviços",
      secondaryCtaLink: hero.secondaryCtaLink ?? "#servicos",
    },
    features: { ...features, subtitle: features.subtitle ?? "" },
    cta,
    provider: "fallback",
  };
}

export function fallbackContent(answers: WizardAnswers): GeneratedContent {
  const company = answers.companyName?.trim() || "Sua empresa";
  const industry = answers.industry?.trim() || "Soluções sob medida";
  const audience = answers.audience?.trim();
  const tone = (answers.tone ?? "").toLowerCase();
  const isPremium = /premium|exclusiv|sofisticad|luxo/.test(tone);
  const isTech = /tech|moderno|inovador|tecnol/.test(tone);
  const isCozy = /acolhedor|familiar|caloros|próximo|proximo/.test(tone);

  return {
    hero: {
      badge: (industry.split(/[.,;]/)[0] ?? "").trim().slice(0, 28).toUpperCase() || "NOVO",
      title: company,
      subtitle: audience
        ? `${industry}. Feito para ${audience.toLowerCase()}.`
        : industry,
      ctaText: "Fale com a gente",
      ctaLink: "#contato",
      secondaryCtaText: "Conheça nossos serviços",
      secondaryCtaLink: "#servicos",
    },
    features: {
      title: "O que entregamos",
      subtitle: "Três pilares que orientam tudo que fazemos.",
      items: [
        {
          icon: isTech ? "Cpu" : isPremium ? "Award" : isCozy ? "Heart" : "Sparkles",
          title: isTech ? "Tecnologia que entrega" : isPremium ? "Excelência reconhecida" : isCozy ? "Atendimento próximo" : "Qualidade comprovada",
          description: "Padrão consistente em cada entrega, com processos claros e suporte do começo ao fim.",
        },
        {
          icon: "ShieldCheck",
          title: "Confiabilidade",
          description: "Compromisso com prazos, transparência em cada etapa e responsabilidade no resultado.",
        },
        {
          icon: "Users",
          title: "Cliente no centro",
          description: "Soluções desenhadas pensando em quem usa, com flexibilidade pra adaptar ao seu contexto.",
        },
      ],
    },
    cta: {
      title: "Vamos conversar?",
      text: audience
        ? `Se você está procurando ${industry.toLowerCase()}, fale com nosso time.`
        : "Conte sua necessidade. A gente responde rápido.",
      buttonText: "Entrar em contato",
      buttonLink: "#contato",
    },
    provider: "fallback",
  };
}
