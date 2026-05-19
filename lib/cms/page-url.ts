import {
  REQUIRED_PAGE_DEFINITIONS,
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";

/** URL pública de uma página dinâmica (CMS). */
export function dynamicPagePublicPath(slug: string): string {
  return `/p/${slug}`;
}

export function systemPagePublicPath(type: RequiredPageType): string {
  return SITE_PAGE_ROUTES[type];
}

export interface SystemPageLink {
  type: RequiredPageType;
  title: string;
  url: string;
  navLabel: string;
  isCore: boolean;
}

export function listSystemPagesForMenu(): SystemPageLink[] {
  return REQUIRED_PAGE_DEFINITIONS.map((d) => ({
    type: d.type,
    title: d.title,
    url: d.route,
    navLabel: d.navLabel,
    isCore: true,
  }));
}
