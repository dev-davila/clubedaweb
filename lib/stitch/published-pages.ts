import { STITCH_PAGE_MIN_BYTES } from "@/lib/cms/site-block-standard";
import { prisma } from "@/lib/db";
import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "@/lib/themes/required-pages";

export const SITE_RENDER_MODE_KEY = "site_render_mode";
export const STITCH_RENDER_MODE = "stitch";

export function stitchHtmlConfigKey(pageType: RequiredPageType): string {
  return `stitch_html_${pageType}`;
}

/** Chave de SiteConfig pra uma página custom criada via chat. */
export function stitchCustomHtmlConfigKey(slug: string): string {
  return `stitch_html_custom_${slug}`;
}

/** Lê HTML de uma página custom publicada. */
export async function getPublishedStitchCustomHtml(slug: string): Promise<string | null> {
  try {
    const mode = await prisma.siteConfig.findUnique({
      where: { key: SITE_RENDER_MODE_KEY },
    });
    if (mode?.value !== STITCH_RENDER_MODE) return null;
    const row = await prisma.siteConfig.findUnique({
      where: { key: stitchCustomHtmlConfigKey(slug) },
    });
    const html = row?.value?.trim();
    return html && html.length > 0 ? html : null;
  } catch {
    return null;
  }
}

/** Lista todas as páginas custom publicadas (slug + bytes). */
export async function listStitchCustomPages(): Promise<{ slug: string; bytes: number; label?: string }[]> {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { startsWith: "stitch_html_custom_" } },
  });
  return rows.map((r) => ({
    slug: r.key.replace("stitch_html_custom_", ""),
    bytes: r.value?.length ?? 0,
    label: r.label ?? undefined,
  }));
}

export type StitchPagesMap = Partial<Record<RequiredPageType, string>>;

export interface PublishablePagesCheck {
  ok: boolean;
  missing: RequiredPageType[];
  tooShort: RequiredPageType[];
}

export function assertPublishablePages(pages: StitchPagesMap): PublishablePagesCheck {
  const missing: RequiredPageType[] = [];
  const tooShort: RequiredPageType[] = [];

  for (const pageType of REQUIRED_PAGE_TYPES) {
    const html = pages[pageType]?.trim();
    if (!html) {
      missing.push(pageType);
      continue;
    }
    if (html.length < STITCH_PAGE_MIN_BYTES[pageType]) {
      tooShort.push(pageType);
    }
  }

  return {
    ok: missing.length === 0 && tooShort.length === 0,
    missing,
    tooShort,
  };
}

export async function getPublishedStitchHtml(
  pageType: RequiredPageType,
): Promise<string | null> {
  try {
    const mode = await prisma.siteConfig.findUnique({
      where: { key: SITE_RENDER_MODE_KEY },
    });
    if (mode?.value !== STITCH_RENDER_MODE) return null;

    const row = await prisma.siteConfig.findUnique({
      where: { key: stitchHtmlConfigKey(pageType) },
    });
    const html = row?.value?.trim();
    return html && html.length > 0 ? html : null;
  } catch {
    return null;
  }
}

export async function isStitchSitePublished(): Promise<boolean> {
  const mode = await prisma.siteConfig.findUnique({
    where: { key: SITE_RENDER_MODE_KEY },
  });
  return mode?.value === STITCH_RENDER_MODE;
}

export async function publishStitchPages(pages: StitchPagesMap): Promise<void> {
  const upserts = [
    prisma.siteConfig.upsert({
      where: { key: SITE_RENDER_MODE_KEY },
      update: { value: STITCH_RENDER_MODE, category: "wizard" },
      create: {
        key: SITE_RENDER_MODE_KEY,
        value: STITCH_RENDER_MODE,
        category: "wizard",
        label: "Modo de renderização do site",
      },
    }),
  ];

  for (const pageType of REQUIRED_PAGE_TYPES) {
    const html = pages[pageType]?.trim();
    if (!html) continue;
    const key = stitchHtmlConfigKey(pageType);
    upserts.push(
      prisma.siteConfig.upsert({
        where: { key },
        update: { value: html.slice(0, 180_000), category: "wizard" },
        create: {
          key,
          value: html.slice(0, 180_000),
          category: "wizard",
          label: `HTML Stitch — ${pageType}`,
        },
      }),
    );
  }

  await prisma.$transaction(upserts);
}

export async function getAllPublishedStitchPages(): Promise<StitchPagesMap> {
  const keys = REQUIRED_PAGE_TYPES.map(stitchHtmlConfigKey);
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: keys } },
  });
  const map: StitchPagesMap = {};
  for (const row of rows) {
    const type = REQUIRED_PAGE_TYPES.find((t) => stitchHtmlConfigKey(t) === row.key);
    if (type && row.value?.trim()) map[type] = row.value;
  }
  return map;
}
