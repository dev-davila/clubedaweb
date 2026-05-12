import type { TemplateManifest } from "../types";
import { BitdefenderHero } from "./sections/hero";
import { BitdefenderStatsStrip } from "./sections/stats-strip";
import { BitdefenderAwards } from "./sections/awards";
import { BitdefenderFeaturesGrid } from "./sections/features-grid";
import { BitdefenderComparisonTable } from "./sections/comparison-table";
import { BitdefenderUseCases } from "./sections/use-cases";
import { BitdefenderFaqs } from "./sections/faqs";
import { BitdefenderCta } from "./sections/cta";

export const bitdefenderTemplate: TemplateManifest = {
  key: "bitdefender",
  name: "Bitdefender",
  description: "Template para páginas Bitdefender — vermelho dominante, identidade da marca de produto, header/logo M3.",
  defaultBrand: {
    primaryColor: "#CC0000",
    secondaryColor: "#8B0000",
    accentColor: "#3B82F6",
  },
  sections: {
    hero: {
      key: "hero",
      label: "Hero Bitdefender",
      fields: [
        { key: "badge", type: "text", label: "Badge superior", placeholder: "BITDEFENDER GRAVITYZONE" },
        { key: "icon", type: "text", label: "Ícone (lucide)", placeholder: "Shield" },
        { key: "title", type: "text", label: "Título", required: true },
        { key: "subtitle", type: "textarea", label: "Subtítulo" },
        {
          key: "bullets",
          type: "array",
          label: "Bullets (lista)",
          itemSchema: [{ key: "value", type: "text", label: "Texto" }],
        },
        { key: "ctaText", type: "text", label: "CTA primário (texto)" },
        { key: "ctaLink", type: "text", label: "CTA primário (link)" },
        { key: "secondaryCtaText", type: "text", label: "CTA secundário (texto)" },
        { key: "secondaryCtaLink", type: "text", label: "CTA secundário (link)" },
      ],
      Component: BitdefenderHero,
    },
    "stats-strip": {
      key: "stats-strip",
      label: "Faixa de estatísticas",
      fields: [
        {
          key: "items",
          type: "array",
          label: "Estatísticas",
          itemSchema: [
            { key: "value", type: "text", label: "Valor", placeholder: "500M+" },
            { key: "label", type: "text", label: "Rótulo" },
          ],
        },
      ],
      Component: BitdefenderStatsStrip,
    },
    awards: {
      key: "awards",
      label: "Prêmios e reconhecimento",
      fields: [
        { key: "title", type: "text", label: "Título" },
        {
          key: "items",
          type: "array",
          label: "Prêmios",
          itemSchema: [
            { key: "org", type: "text", label: "Organização" },
            { key: "description", type: "text", label: "Descrição" },
            { key: "year", type: "text", label: "Ano" },
          ],
        },
      ],
      Component: BitdefenderAwards,
    },
    "features-grid": {
      key: "features-grid",
      label: "Grid de recursos",
      fields: [
        { key: "title", type: "text", label: "Título" },
        { key: "subtitle", type: "textarea", label: "Subtítulo" },
        {
          key: "items",
          type: "array",
          label: "Recursos",
          itemSchema: [
            { key: "icon", type: "text", label: "Ícone (lucide)" },
            { key: "title", type: "text", label: "Título" },
            { key: "description", type: "textarea", label: "Descrição" },
          ],
        },
      ],
      Component: BitdefenderFeaturesGrid,
    },
    "comparison-table": {
      key: "comparison-table",
      label: "Tabela comparativa",
      fields: [
        { key: "title", type: "text", label: "Título" },
        { key: "subtitle", type: "textarea", label: "Subtítulo" },
        {
          key: "columns",
          type: "array",
          label: "Colunas (edições)",
          itemSchema: [{ key: "value", type: "text", label: "Nome" }],
        },
        { key: "highlightColumn", type: "text", label: "Índice da coluna destacada (-1 nenhum)" },
        {
          key: "rows",
          type: "array",
          label: "Linhas (recursos)",
          itemSchema: [
            { key: "feature", type: "text", label: "Recurso" },
            {
              key: "values",
              type: "array",
              label: "Valores (true/false)",
              itemSchema: [{ key: "value", type: "toggle", label: "Disponível?" }],
            },
          ],
        },
      ],
      Component: BitdefenderComparisonTable,
    },
    "use-cases": {
      key: "use-cases",
      label: "Casos de uso",
      fields: [
        { key: "title", type: "text", label: "Título" },
        {
          key: "items",
          type: "array",
          label: "Casos",
          itemSchema: [
            { key: "icon", type: "text", label: "Ícone (lucide)" },
            { key: "title", type: "text", label: "Título" },
            { key: "description", type: "textarea", label: "Descrição" },
            {
              key: "benefits",
              type: "array",
              label: "Benefícios",
              itemSchema: [{ key: "value", type: "text", label: "Benefício" }],
            },
          ],
        },
      ],
      Component: BitdefenderUseCases,
    },
    faqs: {
      key: "faqs",
      label: "Perguntas frequentes",
      fields: [
        { key: "title", type: "text", label: "Título" },
        {
          key: "items",
          type: "array",
          label: "Perguntas",
          itemSchema: [
            { key: "q", type: "text", label: "Pergunta" },
            { key: "a", type: "textarea", label: "Resposta" },
          ],
        },
      ],
      Component: BitdefenderFaqs,
    },
    cta: {
      key: "cta",
      label: "CTA Bitdefender",
      fields: [
        { key: "title", type: "text", label: "Título" },
        { key: "subtitle", type: "textarea", label: "Subtítulo" },
        { key: "buttonText", type: "text", label: "Botão (texto)" },
        { key: "buttonLink", type: "text", label: "Botão (link)" },
        { key: "phoneText", type: "text", label: "Telefone (opcional)" },
      ],
      Component: BitdefenderCta,
    },
  },
};
