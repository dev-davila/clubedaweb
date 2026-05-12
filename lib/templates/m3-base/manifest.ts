import type { TemplateManifest } from "../types";
import { HeroSection } from "./sections/hero";
import { ContentSection } from "./sections/content";
import { CtaSection } from "./sections/cta";
import { FeaturesGridSection } from "./sections/features-grid";

export const m3BaseTemplate: TemplateManifest = {
  key: "m3-base",
  name: "M3 Base",
  description: "Template padrão M3 com hero, conteúdo livre, grid de recursos e CTA.",
  sections: {
    hero: {
      key: "hero",
      label: "Hero",
      description: "Cabeçalho principal com título, subtítulo e CTAs.",
      fields: [
        { key: "badge", type: "text", label: "Tag/Badge" },
        { key: "title", type: "text", label: "Título", required: true },
        { key: "subtitle", type: "textarea", label: "Subtítulo" },
        { key: "ctaText", type: "text", label: "CTA primário (texto)" },
        { key: "ctaLink", type: "text", label: "CTA primário (link)" },
        { key: "secondaryCtaText", type: "text", label: "CTA secundário (texto)" },
        { key: "secondaryCtaLink", type: "text", label: "CTA secundário (link)" },
        { key: "backgroundImage", type: "image", label: "Imagem de fundo" },
      ],
      Component: HeroSection,
    },
    content: {
      key: "content",
      label: "Conteúdo",
      description: "Bloco de texto rico (Markdown/HTML).",
      fields: [
        { key: "html", type: "richtext", label: "Conteúdo" },
        { key: "maxWidth", type: "select", label: "Largura", options: ["4xl", "5xl", "6xl"] },
      ],
      Component: ContentSection,
    },
    "features-grid": {
      key: "features-grid",
      label: "Grid de recursos",
      description: "Grid de cards com ícone, título e descrição.",
      fields: [
        { key: "title", type: "text", label: "Título da seção" },
        { key: "subtitle", type: "textarea", label: "Subtítulo" },
        {
          key: "items",
          type: "array",
          label: "Itens",
          itemSchema: [
            { key: "icon", type: "text", label: "Ícone (lucide)", placeholder: "Shield" },
            { key: "title", type: "text", label: "Título", required: true },
            { key: "description", type: "textarea", label: "Descrição" },
          ],
        },
      ],
      Component: FeaturesGridSection,
    },
    cta: {
      key: "cta",
      label: "CTA",
      description: "Seção de chamada pra ação.",
      fields: [
        { key: "title", type: "text", label: "Título" },
        { key: "text", type: "textarea", label: "Texto" },
        { key: "buttonText", type: "text", label: "Botão (texto)" },
        { key: "buttonLink", type: "text", label: "Botão (link)" },
      ],
      Component: CtaSection,
    },
  },
};
