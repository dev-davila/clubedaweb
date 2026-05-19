import { logger } from "@/lib/logger";
import { SITE_PAGE_ROUTES } from "@/lib/themes/required-pages";
import { chatCompletion, pickLlmConfig } from "./llm-client";
import type { WizardAnswers } from "./types";
import type { SitePageCopy } from "./site-content-types";
import { fallbackContent } from "./content-generator";

const SYSTEM_PROMPT = `Você é copywriter sênior brasileiro para sites institucionais.
Responda APENAS JSON válido (sem markdown) com textos para as 5 páginas obrigatórias do site.
Tom profissional e específico ao negócio. Português do Brasil. Sem clichês vazios.
Não invente telefone, endereço, CNPJ ou números que não estejam no briefing.

Schema exato:
{
  "home": {
    "hero": { "badge": "max 28 chars uppercase", "title": "max 80", "subtitle": "max 200", "ctaText": "max 24", "ctaLink": "#contato", "secondaryCtaText": "max 28", "secondaryCtaLink": "#servicos" },
    "features": { "title": "max 60", "subtitle": "max 140", "items": [ { "icon": "Lucide PascalCase", "title": "max 36", "description": "max 140" }, ...3 itens ] },
    "cta": { "title": "max 60", "text": "max 200", "buttonText": "max 24", "buttonLink": "#contato" }
  },
  "about": {
    "hero": { "badge": "INSTITUCIONAL", "title": "...", "subtitle": "...", "ctaText": "...", "ctaLink": "${SITE_PAGE_ROUTES.contact}" },
    "content": { "title": "...", "paragraphs": ["...", "..."] },
    "cta": { "title": "...", "text": "...", "buttonText": "...", "buttonLink": "${SITE_PAGE_ROUTES.contact}" }
  },
  "contact": {
    "hero": { "badge": "CONTATO", "title": "...", "subtitle": "...", "ctaText": "...", "ctaLink": "#form" },
    "content": { "title": "Como falar conosco", "paragraphs": ["...", "..."] },
    "cta": { "title": "...", "text": "...", "buttonText": "...", "buttonLink": "#form" }
  },
  "services": {
    "hero": { "badge": "SERVIÇOS", "title": "...", "subtitle": "...", "ctaText": "...", "ctaLink": "${SITE_PAGE_ROUTES.contact}" },
    "features": { "title": "...", "subtitle": "...", "items": [ ...3 ] },
    "cta": { "title": "...", "text": "...", "buttonText": "...", "buttonLink": "${SITE_PAGE_ROUTES.contact}" }
  },
  "blog": {
    "hero": { "badge": "BLOG", "title": "...", "subtitle": "...", "ctaText": "Ver artigos", "ctaLink": "#posts" },
    "content": { "title": "...", "paragraphs": ["Introdução da listagem de artigos..."] }
  }
}`;

function cleanupJson(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

export function isValidSiteCopy(obj: unknown): obj is SitePageCopy {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as SitePageCopy;
  return Boolean(
    o.home?.hero?.title &&
      o.home?.features?.items?.length >= 3 &&
      o.about?.content?.paragraphs?.length >= 1 &&
      o.contact?.content?.paragraphs?.length >= 1 &&
      o.services?.features?.items?.length >= 3 &&
      o.blog?.content?.paragraphs?.length >= 1,
  );
}

function buildContactParagraphs(answers: WizardAnswers): string[] {
  const lines: string[] = [];
  if (answers.contactPhone) lines.push(`Telefone: ${answers.contactPhone}`);
  if (answers.contactWhatsapp) lines.push(`WhatsApp: ${answers.contactWhatsapp}`);
  if (answers.contactEmail) lines.push(`E-mail: ${answers.contactEmail}`);
  if (answers.contactAddress) lines.push(`Endereço: ${answers.contactAddress}`);
  if (answers.contactHours) lines.push(`Horário: ${answers.contactHours}`);
  if (lines.length === 0 && answers.contactInfo) {
    return answers.contactInfo.split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 5);
  }
  if (lines.length === 0) {
    return ["Use o formulário nesta página ou nossos canais digitais.", "Retornamos o mais rápido possível."];
  }
  lines.push("Estamos prontos para ouvir você.");
  return lines;
}

function offeringsToFeatureItems(offerings?: string): SitePageCopy["home"]["features"]["items"] {
  const lines = (offerings ?? "")
    .split(/\n/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  return lines.slice(0, 3).map((line, i) => {
    const [title, ...rest] = line.split(/[—\-:]/);
    return {
      icon: ["Sparkles", "ShieldCheck", "Users"][i] ?? "Star",
      title: (title ?? line).trim().slice(0, 36),
      description: (rest.join("—") || line).trim().slice(0, 140),
    };
  });
}

function differentiatorsToFeatureItems(
  differentiators?: string[],
): SitePageCopy["home"]["features"]["items"] {
  if (!Array.isArray(differentiators) || differentiators.length === 0) return [];
  const icons = ["Sparkles", "ShieldCheck", "Zap", "Award", "Target", "Users"];
  return differentiators.slice(0, 3).map((line, i) => {
    const cleaned = line.replace(/^\s*\d+[.)]\s*/, "").trim();
    const [title, ...rest] = cleaned.split(/[—\-:]/);
    const descSource = rest.join("—") || cleaned;
    return {
      icon: icons[i] ?? "Star",
      title: (title ?? cleaned).trim().slice(0, 36),
      description: descSource.trim().slice(0, 140) || cleaned.slice(0, 140),
    };
  });
}

export function fallbackSiteContent(answers: WizardAnswers): SitePageCopy {
  const home = fallbackContent(answers);
  const company = answers.companyName?.trim() || "Sua empresa";
  const industry = answers.industry?.trim() || "Soluções sob medida";
  const tag = industry.split(/[.,;]/)[0]?.trim() || industry;
  // Prioriza diferenciais ricos (port stitch-advocacia) sobre offerings string.
  const richItems = differentiatorsToFeatureItems(answers.differentiators);
  const offeringItems = richItems.length >= 3 ? richItems : offeringsToFeatureItems(answers.offerings);
  const homeHero = {
    ...home.hero,
    subtitle: answers.homePitch?.trim() || home.hero.subtitle,
    ctaText: answers.mainCta?.trim().slice(0, 24) || home.hero.ctaText,
  };
  const homeFeatures =
    offeringItems.length >= 3
      ? { ...home.features, items: offeringItems }
      : home.features;

  return {
    home: {
      hero: homeHero,
      features: homeFeatures,
      cta: home.cta,
    },
    about: {
      hero: {
        badge: "INSTITUCIONAL",
        title: `Quem somos — ${company}`,
        subtitle: tag,
        ctaText: "Fale conosco",
        ctaLink: SITE_PAGE_ROUTES.contact,
      },
      content: {
        title: "Nossa história",
        paragraphs: answers.aboutText
          ? answers.aboutText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean).slice(0, 4)
          : [
              `A ${company} atua em ${industry.toLowerCase()} com foco em resultado e parceria de longo prazo.`,
              "Acreditamos em processos claros, comunicação transparente e entregas consistentes.",
            ],
      },
      cta: {
        title: "Quer conhecer melhor?",
        text: "Fale com nosso time e montamos a melhor proposta para você.",
        buttonText: "Entrar em contato",
        buttonLink: SITE_PAGE_ROUTES.contact,
      },
    },
    contact: {
      hero: {
        badge: "CONTATO",
        title: "Fale conosco",
        subtitle: "Estamos prontos para ouvir você e responder o mais rápido possível.",
        ctaText: "Enviar mensagem",
        ctaLink: "#form",
      },
      content: {
        title: "Canais de atendimento",
        paragraphs: buildContactParagraphs(answers),
      },
      cta: {
        title: "Vamos conversar?",
        text: "Conte sua necessidade — respondemos com agilidade.",
        buttonText: "Enviar mensagem",
        buttonLink: "#form",
      },
    },
    services: {
      hero: {
        badge: "SERVIÇOS",
        title: "Nossas soluções",
        subtitle: `O que a ${company} oferece para o seu momento.`,
        ctaText: "Solicitar proposta",
        ctaLink: SITE_PAGE_ROUTES.contact,
      },
      features: {
        title: "Como podemos ajudar",
        subtitle: "Três frentes principais de atuação.",
        items: offeringItems.length >= 3 ? offeringItems : home.features.items,
      },
      cta: home.cta,
    },
    blog: {
      hero: {
        badge: "BLOG",
        title: "Notícias e insights",
        subtitle: `Conteúdos sobre ${tag.toLowerCase()} e tendências do setor.`,
        ctaText: "Ver artigos",
        ctaLink: "#posts",
      },
      content: {
        title: "Artigos recentes",
        paragraphs: [
          "Acompanhe novidades, dicas e boas práticas publicadas pela nossa equipe.",
          "A listagem abaixo é atualizada automaticamente quando novos posts são publicados.",
        ],
      },
    },
  };
}

/** Garante copy completo das 5 páginas (ignora JSON legado só da home). */
export function ensureSiteCopy(answers: WizardAnswers, raw?: unknown): SitePageCopy {
  if (isValidSiteCopy(raw)) return raw;
  return fallbackSiteContent(answers);
}

export async function generateSiteContent(answers: WizardAnswers): Promise<SitePageCopy> {
  if (!pickLlmConfig()) {
    logger.warn("[wizard:site-content] sem LLM — fallback");
    return fallbackSiteContent(answers);
  }

  const userLines: string[] = ["Briefing completo do cliente:"];
  userLines.push(`- Empresa: ${answers.companyName ?? ""}`);
  userLines.push(`- Segmento: ${answers.industry ?? ""}`);
  if (answers.foundedYear) userLines.push(`- Fundada em: ${answers.foundedYear}`);
  if (answers.cityState) userLines.push(`- Cidade/UF: ${answers.cityState}`);
  userLines.push(`- Público-alvo (persona): ${answers.audience ?? ""}`);
  if (answers.mainPain) userLines.push(`- Dor que resolve: ${answers.mainPain}`);
  userLines.push(`- Pitch da home (5s): ${answers.homePitch ?? ""}`);
  userLines.push(`- CTA principal (texto exato do botão): ${answers.mainCta ?? ""}`);
  if (answers.siteGoal) userLines.push(`- Objetivo de conversão: ${answers.siteGoal}`);

  // Diferenciais — CRÍTICO para os feature-cards. Quando presentes, use literais.
  if (answers.differentiators?.length) {
    userLines.push(
      `- DIFERENCIAIS CONCRETOS (USE ESTES no features.items da home e services — 1 por card):`,
    );
    for (const d of answers.differentiators) userLines.push(`    • ${d}`);
  } else if (answers.offerings) {
    userLines.push(`- Ofertas (livre): ${answers.offerings}`);
  }

  if (answers.productName || answers.productDescription) {
    userLines.push(
      `- Produto principal: ${answers.productName ?? ""}${answers.productDescription ? " — " + answers.productDescription : ""}`,
    );
  }

  if (answers.howItWorks?.length) {
    userLines.push(`- Etapas reais do processo:`);
    for (const s of answers.howItWorks) userLines.push(`    • ${s}`);
  }

  if (answers.pricingModel) userLines.push(`- Modelo de preço: ${answers.pricingModel}`);

  if (answers.proofPoints?.skip) {
    userLines.push(`- Prova social: cliente declarou que NÃO TEM cases — não inventar números, depoimentos ou faixa de confiança`);
  } else if (answers.proofPoints?.items?.length) {
    userLines.push(`- Prova social (use estes literais):`);
    for (const p of answers.proofPoints.items) userLines.push(`    • ${p}`);
  }

  if (answers.faq?.length) {
    userLines.push(`- FAQ literal (não usar diretamente no copy, mas reflete tom):`);
    for (const f of answers.faq.slice(0, 3))
      userLines.push(`    • P: ${f.q} R: ${f.a}`);
  }

  userLines.push(`- Sobre: ${answers.aboutText ?? ""}`);
  if (answers.existingWebsite) userLines.push(`- Site referência: ${answers.existingWebsite}`);
  userLines.push(
    `- Contato: ${answers.contactPhone ?? ""} ${answers.contactWhatsapp ?? ""} ${answers.contactEmail ?? ""} ${answers.contactAddress ?? ""}`.trim(),
  );
  userLines.push(`- Tom: ${answers.tone ?? "corporativo"}`);
  if (answers.colors) userLines.push(`- Cores: ${answers.colors}`);
  if (answers.references?.length)
    userLines.push(`- Benchmarks: ${answers.references.join(", ")}`);

  userLines.push(
    "",
    "REGRAS:",
    "- Use SOMENTE dados acima. Nunca invente telefone, endereço, CNPJ, preço ou número.",
    "- Para home.features.items e services.features.items, use os DIFERENCIAIS literais quando fornecidos (1 por item, ícone Lucide adequado).",
    "- Copy ESPECÍFICA: linguagem do segmento, sem clichês ('soluções inovadoras', 'qualidade excepcional').",
    "- Headline da home deve ligar à DOR + público (não genérica).",
    "- Gere JSON das 5 páginas conforme schema.",
  );

  const user = userLines.join("\n");

  try {
    const raw = await chatCompletion({
      system: SYSTEM_PROMPT,
      user,
      timeoutMs: 45_000,
      temperature: 0.7,
      jsonMode: true,
    });
    const parsed = JSON.parse(cleanupJson(raw));
    if (!isValidSiteCopy(parsed)) {
      logger.warn("[wizard:site-content] shape inválido — fallback");
      return fallbackSiteContent(answers);
    }
    return parsed;
  } catch (err) {
    logger.error("[wizard:site-content] falhou", String(err));
    return fallbackSiteContent(answers);
  }
}
