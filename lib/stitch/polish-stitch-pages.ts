/**
 * Pipeline unificado de polish aplicado nas páginas Stitch geradas. Roda no
 * publish (orchestrator.applyPublished) e on-the-fly no preview pra que o
 * cliente veja a mesma coisa antes e depois de publicar.
 *
 * Etapas:
 *  1) sanitize HTML quebrado do Stitch
 *  2) padroniza CSS (tailwind config + fontes + body class) usando referência
 *     escolhida por colorMode
 *  3) padroniza header/footer entre páginas (chrome único)
 *  4) substitui contatos fake pelos do briefing
 *  5) reescreve <form> pra POST /api/contact
 *  6) injeta logo do cliente se houver
 */

import { logger } from "@/lib/logger";
import {
  REQUIRED_PAGE_TYPES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import type { WizardAnswers } from "@/lib/wizard/types";
import { detectUserColorMode } from "@/lib/wizard/design-themes";
import { applyMenuLabels } from "./apply-menu-labels";
import { injectClientLogo } from "./inject-logo";
import type { StitchMenuItem } from "./menu-items";
import { normalizeStitchForms } from "./normalize-forms";
import { replaceFakeContacts } from "./replace-contacts";
import { sanitizeStitchHtml } from "./sanitize-stitch-html";
import { standardizePageStyling } from "./share-page-styling";
import { standardizeSiteChrome } from "./standardize-chrome";
import { detectDarkMode } from "./theme-extractor";

export interface PolishOptions {
  answers: WizardAnswers;
  /** URL do logo cadastrado em siteConfig.logo_url, se houver. */
  logoUrl?: string | null;
  /** Itens do menu editáveis pelo gestor; sobrescreve labels do Stitch. */
  menuItems?: StitchMenuItem[];
}

/** Escolhe a página de referência pra styling (cf. orchestrator). */
function pickReferencePage(
  pages: Record<RequiredPageType, string>,
  userMode: "dark" | "light" | null,
): RequiredPageType {
  const exists = (t: RequiredPageType) => !!pages[t]?.trim();
  if (!userMode) {
    return exists("home") ? "home" : (REQUIRED_PAGE_TYPES.find(exists) ?? "home");
  }
  const order: RequiredPageType[] = userMode === "dark"
    ? ["about", "services", "contact", "blog", "home"]
    : ["home", "services", "about", "contact", "blog"];
  for (const t of order) {
    if (!exists(t)) continue;
    const isDark = detectDarkMode(pages[t]);
    if (userMode === "dark" && isDark) return t;
    if (userMode === "light" && !isDark) return t;
  }
  return exists("home") ? "home" : (REQUIRED_PAGE_TYPES.find(exists) ?? "home");
}

/**
 * Aplica TODA a cadeia de polish num conjunto de páginas Stitch.
 * Idempotente: pode rodar várias vezes sem efeito acumulado.
 */
export function polishStitchPages(
  rawPages: Partial<Record<RequiredPageType, string>>,
  opts: PolishOptions,
): Partial<Record<RequiredPageType, string>> {
  // 1) sanitize
  const sanitized: Partial<Record<RequiredPageType, string>> = {};
  for (const t of REQUIRED_PAGE_TYPES) {
    const html = rawPages[t]?.trim();
    if (html) sanitized[t] = sanitizeStitchHtml(html);
  }

  // 2/3) padronizações dependem de TODAS as páginas existirem
  const allPresent = REQUIRED_PAGE_TYPES.every((t) => sanitized[t]);
  let polished: Partial<Record<RequiredPageType, string>> = { ...sanitized };

  if (allPresent) {
    const userMode = detectUserColorMode(opts.answers.colors);
    const full = sanitized as Record<RequiredPageType, string>;
    const referenceKey = pickReferencePage(full, userMode);
    polished = standardizePageStyling(full, referenceKey) as Record<RequiredPageType, string>;
    try {
      polished = standardizeSiteChrome(
        polished as Record<RequiredPageType, string>,
        referenceKey,
      );
    } catch (err) {
      logger.warn("[polish] standardizeSiteChrome falhou: " + String(err));
    }
  }

  // 4) contatos fake → reais
  for (const t of REQUIRED_PAGE_TYPES) {
    if (polished[t]) polished[t] = replaceFakeContacts(polished[t]!, opts.answers);
  }

  // 5) forms → POST /api/contact
  for (const t of REQUIRED_PAGE_TYPES) {
    if (polished[t]) polished[t] = normalizeStitchForms(polished[t]!);
  }

  // 6) logo
  if (opts.logoUrl?.trim()) {
    for (const t of REQUIRED_PAGE_TYPES) {
      if (polished[t]) polished[t] = injectClientLogo(polished[t]!, opts.logoUrl, opts.answers);
    }
  }

  // 7) labels do menu editados pelo gestor sobrescrevem o que veio do Stitch
  if (opts.menuItems && opts.menuItems.length > 0) {
    for (const t of REQUIRED_PAGE_TYPES) {
      if (polished[t]) polished[t] = applyMenuLabels(polished[t]!, opts.menuItems);
    }
  }

  return polished;
}

/** Aplica polish numa única página — usado pelo /preview e /raw. */
export function polishStitchPage(
  pageType: RequiredPageType,
  rawPages: Partial<Record<RequiredPageType, string>>,
  opts: PolishOptions,
): string | null {
  const result = polishStitchPages(rawPages, opts);
  return result[pageType] ?? null;
}
