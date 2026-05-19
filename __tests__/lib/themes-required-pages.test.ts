import { THEME_PRESETS, THEME_LIST } from "@/lib/themes/presets";
import {
  REQUIRED_PAGE_TYPES,
  SITE_PAGE_ROUTES,
  assertThemeHasRequiredPages,
  pageRouteToSlug,
} from "@/lib/themes/required-pages";
import { buildRequiredPageLayouts } from "@/lib/themes/page-layouts";
import { getTemplate } from "@/lib/templates";

describe("required page layouts per theme", () => {
  it("uses international keys with Portuguese public URLs", () => {
    expect(SITE_PAGE_ROUTES).toEqual({
      home: "/",
      about: "/quem-somos",
      contact: "/contato",
      services: "/solucoes",
      blog: "/noticias",
    });
    expect(pageRouteToSlug(SITE_PAGE_ROUTES.about)).toBe("quem-somos");
    expect(pageRouteToSlug(SITE_PAGE_ROUTES.home)).toBe("home");
  });

  it("every registered theme defines all mandatory page layouts", () => {
    for (const theme of THEME_LIST) {
      assertThemeHasRequiredPages(theme.key, theme.pages);
      for (const pageType of REQUIRED_PAGE_TYPES) {
        const layout = theme.pages[pageType];
        expect(layout.templateKey).toBeTruthy();
        expect(layout.layoutConfig.template).toBe(layout.templateKey);
        expect(getTemplate(layout.templateKey)).not.toBeNull();
      }
    }
  });

  it("m3 and bitdefender use distinct visual templates", () => {
    expect(THEME_PRESETS.m3.pages.about.templateKey).toBe("m3-base");
    expect(THEME_PRESETS.bitdefender.pages.about.templateKey).toBe("bitdefender");
  });

  it("layout builder returns complete set", () => {
    const pages = buildRequiredPageLayouts("m3", "Acme", "Tag");
    expect(Object.keys(pages).sort()).toEqual([...REQUIRED_PAGE_TYPES].sort());
  });
});
