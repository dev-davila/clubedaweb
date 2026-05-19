/**
 * @deprecated Prefer importing from `@/lib/cms/site-block-standard`.
 * Mantido para compatibilidade com imports existentes.
 */

import type { RequiredPageType } from "@/lib/themes/required-pages";
import {
  CANONICAL_BLOCK_KEYS,
  STANDARD_PAGE_BLOCKS,
  BLOCK_STANDARD_SPECS as BLOCK_CATALOG,
  assertPageBlocks,
  type CanonicalBlockKey,
} from "./site-block-standard";

export type TemplateSectionKey = CanonicalBlockKey;

export const TEMPLATE_SECTION_KEYS = CANONICAL_BLOCK_KEYS;

export const REQUIRED_PAGE_BLOCKS = STANDARD_PAGE_BLOCKS;

export const WIZARD_HOME_BLOCK_KEYS = ["hero", "features", "cta"] as const;
export type WizardHomeBlockKey = (typeof WIZARD_HOME_BLOCK_KEYS)[number];

export const REQUIRED_HOME_CHAT_BLOCKS: readonly WizardHomeBlockKey[] = [
  "hero",
  "features",
  "cta",
];

export const REQUIRED_HOME_THEME_LAYOUT_BLOCKS = STANDARD_PAGE_BLOCKS.home;

export const WIZARD_TO_TEMPLATE_BLOCK: Record<WizardHomeBlockKey, CanonicalBlockKey> = {
  hero: "hero",
  features: "features-grid",
  cta: "cta",
};

export const LEGACY_BLOCK_ALIASES: Record<string, CanonicalBlockKey> = {
  services: "features-grid",
  solutions: "features-grid",
  whyUs: "features-grid",
  whyus: "features-grid",
  content: "content",
  text: "content",
  features: "features-grid",
  "features-grid": "features-grid",
  cta: "cta",
  hero: "hero",
};

export function normalizeBlockKey(raw: string): CanonicalBlockKey | null {
  const k = raw.trim();
  if ((CANONICAL_BLOCK_KEYS as readonly string[]).includes(k)) {
    return k as CanonicalBlockKey;
  }
  return LEGACY_BLOCK_ALIASES[k] ?? LEGACY_BLOCK_ALIASES[k.toLowerCase()] ?? null;
}

export function assertHomeChatContent(blocks: Partial<Record<WizardHomeBlockKey, unknown>>): void {
  const missing = REQUIRED_HOME_CHAT_BLOCKS.filter((b) => blocks[b] == null);
  if (missing.length > 0) {
    throw new Error(`Conteúdo da home (chat) incompleto. Faltam: ${missing.join(", ")}`);
  }
}

export function assertPageLayoutBlocks(
  pageType: RequiredPageType,
  sectionKeys: string[],
): void {
  assertPageBlocks(pageType, sectionKeys);
}

/** Home legada (app/page.tsx) — fora do padrão Stitch; mantido para referência. */
export const LEGACY_HOME_SECTION_KEYS = [
  "hero",
  "logos",
  "services",
  "solutions",
  "whyUs",
  "testimonials",
  "faq",
  "partners",
  "news",
  "cta",
] as const;

export const REQUIRED_HOME_LEGACY_M3_BLOCKS = [
  "hero",
  "services",
  "solutions",
  "whyUs",
  "testimonials",
  "partners",
  "news",
  "cta",
] as const;

export const REQUIRED_HOME_LEGACY_BD_BLOCKS = [
  "hero",
  "logos",
  "services",
  "solutions",
  "whyUs",
  "testimonials",
  "faq",
  "partners",
  "news",
  "cta",
] as const;

export const REQUIRED_HOME_CHAT_PREVIEW_SECTIONS = ["hero", "features-grid", "cta"] as const;

export { BLOCK_CATALOG };
