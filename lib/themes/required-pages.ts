import type { PageLayoutConfig } from "@/lib/templates/types";

/**
 * Páginas obrigatórias do site.
 * - **type**: identificador internacional (código, siteConfig, API).
 * - **route**: URL pública em português (App Router).
 */
export const REQUIRED_PAGE_TYPES = [
  "home",
  "about",
  "contact",
  "services",
  "blog",
] as const;

export type RequiredPageType = (typeof REQUIRED_PAGE_TYPES)[number];

/**
 * Mapa canônico: chave internacional → path público em PT-BR.
 * Única fonte de verdade para URLs das páginas obrigatórias.
 */
export const SITE_PAGE_ROUTES: Record<RequiredPageType, string> = {
  home: "/",
  about: "/quem-somos",
  contact: "/contato",
  services: "/solucoes",
  blog: "/noticias",
};

/** Slug persistido (DynamicPage / referências sem barra inicial). */
export function pageRouteToSlug(route: string): string {
  if (route === "/") return "home";
  return route.replace(/^\//, "");
}

export function getPageRoute(type: RequiredPageType): string {
  return SITE_PAGE_ROUTES[type];
}

export type PageRouteKind = "site-config" | "static-route" | "dynamic-page";

export interface RequiredPageDefinition {
  type: RequiredPageType;
  slug: string;
  route: string;
  title: string;
  navLabel: string;
  routeKind: PageRouteKind;
  dynamicPageType: string;
}

const PAGE_META: Record<
  RequiredPageType,
  Pick<RequiredPageDefinition, "title" | "navLabel" | "routeKind" | "dynamicPageType">
> = {
  home: {
    title: "Home",
    navLabel: "Início",
    routeKind: "site-config",
    dynamicPageType: "landing",
  },
  about: {
    title: "Quem Somos",
    navLabel: "Quem Somos",
    routeKind: "static-route",
    dynamicPageType: "institutional",
  },
  contact: {
    title: "Contato",
    navLabel: "Contato",
    routeKind: "static-route",
    dynamicPageType: "institutional",
  },
  services: {
    title: "Soluções",
    navLabel: "Soluções",
    routeKind: "static-route",
    dynamicPageType: "service",
  },
  blog: {
    title: "Notícias",
    navLabel: "Notícias",
    routeKind: "static-route",
    dynamicPageType: "institutional",
  },
};

export const REQUIRED_PAGE_DEFINITIONS: RequiredPageDefinition[] =
  REQUIRED_PAGE_TYPES.map((type) => {
    const route = SITE_PAGE_ROUTES[type];
    return {
      type,
      route,
      slug: pageRouteToSlug(route),
      ...PAGE_META[type],
    };
  });

export function getRequiredPageDefinition(
  type: RequiredPageType,
): RequiredPageDefinition {
  const def = REQUIRED_PAGE_DEFINITIONS.find((d) => d.type === type);
  if (!def) throw new Error(`Página obrigatória desconhecida: ${type}`);
  return def;
}

/** Chave em `siteConfig`: `page_layout_{type}` (type em inglês). */
export function pageLayoutConfigKey(type: RequiredPageType): string {
  return `page_layout_${type}`;
}

export interface ThemePageLayout {
  templateKey: string;
  layoutConfig: PageLayoutConfig;
  metaTitle?: string;
  metaDescription?: string;
}

export type ThemeRequiredPages = Record<RequiredPageType, ThemePageLayout>;

export function assertThemeHasRequiredPages(
  themeKey: string,
  pages: Partial<ThemeRequiredPages> | undefined,
): asserts pages is ThemeRequiredPages {
  if (!pages) {
    throw new Error(`Tema "${themeKey}" não define páginas obrigatórias.`);
  }
  const missing = REQUIRED_PAGE_TYPES.filter((t) => !pages[t]?.templateKey);
  if (missing.length > 0) {
    throw new Error(
      `Tema "${themeKey}" incompleto. Faltam layouts: ${missing.join(", ")}`,
    );
  }
}
