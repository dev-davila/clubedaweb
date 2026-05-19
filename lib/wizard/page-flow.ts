import { REQUIRED_PAGE_TYPES, SITE_PAGE_ROUTES, type RequiredPageType } from "@/lib/themes/required-pages";

/** Ordem de geração e aprovação página a página. */
export const WIZARD_PAGE_ORDER: readonly RequiredPageType[] = REQUIRED_PAGE_TYPES;

export const PAGE_LABEL_PT: Record<RequiredPageType, string> = {
  home: "Home",
  about: "Quem somos",
  contact: "Contato",
  services: "Serviços",
  blog: "Blog",
};

export const PAGE_BLOCKS_HINT: Record<RequiredPageType, string> = {
  home: "Hero · 3 diferenciais · CTA",
  about: "Hero · texto institucional · CTA",
  contact: "Hero · canais de contato · CTA",
  services: "Hero · 3 serviços/produtos · CTA",
  blog: "Hero · introdução do blog",
};

export function pageIndex(pageType: RequiredPageType): number {
  return WIZARD_PAGE_ORDER.indexOf(pageType);
}

export function nextPageAfter(current: RequiredPageType): RequiredPageType | null {
  const i = pageIndex(current);
  if (i < 0 || i >= WIZARD_PAGE_ORDER.length - 1) return null;
  return WIZARD_PAGE_ORDER[i + 1];
}

export function firstWizardPage(): RequiredPageType {
  return WIZARD_PAGE_ORDER[0];
}

export function allPagesApproved(approved: RequiredPageType[]): boolean {
  return WIZARD_PAGE_ORDER.every((p) => approved.includes(p));
}

export function pageProgressLabel(pageType: RequiredPageType): string {
  const n = pageIndex(pageType) + 1;
  return `${PAGE_LABEL_PT[pageType]} (${n}/${WIZARD_PAGE_ORDER.length})`;
}

export function publicRoute(pageType: RequiredPageType): string {
  return SITE_PAGE_ROUTES[pageType];
}
