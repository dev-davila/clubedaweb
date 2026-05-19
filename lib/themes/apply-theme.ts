import { prisma } from "@/lib/db";
import type { ThemePreset } from "./presets";
import {
  assertThemeHasRequiredPages,
  getRequiredPageDefinition,
  pageLayoutConfigKey,
  REQUIRED_PAGE_TYPES,
  type RequiredPageType,
} from "./required-pages";

/**
 * Persiste layouts obrigatórios em siteConfig e garante DynamicPage
 * para páginas que o editor/visual precisam referenciar.
 */
export async function persistRequiredPageLayouts(preset: ThemePreset): Promise<void> {
  assertThemeHasRequiredPages(preset.key, preset.pages);

  for (const pageType of REQUIRED_PAGE_TYPES) {
    const layout = preset.pages[pageType];
    const def = getRequiredPageDefinition(pageType);

    await prisma.siteConfig.upsert({
      where: { key: pageLayoutConfigKey(pageType) },
      update: {
        value: JSON.stringify({
          templateKey: layout.templateKey,
          route: def.route,
          routeKind: def.routeKind,
          layoutConfig: layout.layoutConfig,
          metaTitle: layout.metaTitle,
          metaDescription: layout.metaDescription,
        }),
        category: "pages",
        label: `Layout: ${def.title}`,
      },
      create: {
        key: pageLayoutConfigKey(pageType),
        value: JSON.stringify({
          templateKey: layout.templateKey,
          route: def.route,
          routeKind: def.routeKind,
          layoutConfig: layout.layoutConfig,
          metaTitle: layout.metaTitle,
          metaDescription: layout.metaDescription,
        }),
        category: "pages",
        label: `Layout: ${def.title}`,
      },
    });

    if (def.routeKind === "static-route" || def.routeKind === "dynamic-page") {
      await upsertDynamicPageFromLayout(def.type, def, layout.metaTitle, layout.metaDescription, layout.layoutConfig);
    }
  }

  await prisma.siteConfig.upsert({
    where: { key: "required_pages_manifest" },
    update: {
      value: JSON.stringify(
        REQUIRED_PAGE_TYPES.map((t) => {
          const d = getRequiredPageDefinition(t);
          return { type: t, route: d.route, slug: d.slug, navLabel: d.navLabel };
        }),
      ),
      category: "pages",
    },
    create: {
      key: "required_pages_manifest",
      value: JSON.stringify(
        REQUIRED_PAGE_TYPES.map((t) => {
          const d = getRequiredPageDefinition(t);
          return { type: t, route: d.route, slug: d.slug, navLabel: d.navLabel };
        }),
      ),
      category: "pages",
      label: "Páginas obrigatórias do site",
    },
  });
}

async function upsertDynamicPageFromLayout(
  pageType: RequiredPageType,
  def: ReturnType<typeof getRequiredPageDefinition>,
  metaTitle?: string,
  metaDescription?: string,
  layoutConfig?: object,
) {
  const existing = await prisma.dynamicPage.findUnique({ where: { slug: def.slug } });
  const layoutJson = JSON.stringify({
    template: (layoutConfig as { template?: string })?.template,
    requiredPageType: pageType,
    ...(layoutConfig as object),
  });

  const data = {
    title: def.title,
    pageType: def.dynamicPageType,
    metaTitle: metaTitle ?? def.title,
    metaDescription: metaDescription ?? null,
    layoutConfig: layoutJson,
    status: "PUBLISHED" as const,
    publishedAt: new Date(),
  };

  if (existing) {
    await prisma.dynamicPage.update({
      where: { id: existing.id },
      data: {
        ...data,
        // Não sobrescreve HTML legado se já existir conteúdo editorial
        content: existing.content,
      },
    });
  } else {
    await prisma.dynamicPage.create({
      data: {
        slug: def.slug,
        excerpt: metaDescription,
        ...data,
      },
    });
  }
}

export async function applyThemePreset(preset: ThemePreset): Promise<void> {
  assertThemeHasRequiredPages(preset.key, preset.pages);

  const existing = await prisma.brandTokens.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  const brandData = {
    ...preset.brand,
    logoIconUrl: null,
    iconStyle: "solid",
    active: true,
  };
  if (existing) {
    await prisma.brandTokens.update({ where: { id: existing.id }, data: brandData });
  } else {
    await prisma.brandTokens.create({ data: brandData });
  }

  const layoutVariant = preset.key === "bitdefender" ? "bd" : "m3";
  const generalConfig = { ...preset.siteConfig, theme_layout: layoutVariant };
  for (const [key, value] of Object.entries(generalConfig)) {
    await prisma.siteConfig.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value, category: "general", label: key },
    });
  }

  const homeMap: Record<string, unknown> = {
    home_hero: preset.home.hero,
    home_services: preset.home.services,
    home_solutions: preset.home.solutions,
    home_features: preset.home.features,
    home_testimonials: preset.home.testimonials,
  };
  for (const [key, value] of Object.entries(homeMap)) {
    await prisma.siteConfig.upsert({
      where: { key },
      update: { value: JSON.stringify(value), updatedAt: new Date() },
      create: { key, value: JSON.stringify(value), category: "home", label: key },
    });
  }

  await persistRequiredPageLayouts(preset);
}
