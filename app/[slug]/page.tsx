export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StitchPageView } from "@/components/stitch/stitch-page-view";
import { applyActiveMenu } from "@/lib/stitch/apply-active-menu";
import { applyCurrentContacts } from "@/lib/stitch/apply-current-contacts";
import { applyMenuLabels } from "@/lib/stitch/apply-menu-labels";
import { injectFormHandler } from "@/lib/stitch/inject-form-handler";
import { injectHeroOverlay } from "@/lib/stitch/inject-hero-overlay";
import { getStitchMenuItems } from "@/lib/stitch/menu-items";
import {
  getPublishedStitchCustomHtml,
  isStitchSitePublished,
} from "@/lib/stitch/published-pages";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const html = (await isStitchSitePublished())
    ? await getPublishedStitchCustomHtml(slug)
    : null;
  if (!html) return { title: "Página não encontrada" };
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? `/${slug}`;
  return { title };
}

export default async function StitchCustomPage({ params }: Props) {
  const { slug } = await params;
  if (!(await isStitchSitePublished())) notFound();
  const html = await getPublishedStitchCustomHtml(slug);
  if (!html) notFound();

  const menuItems = await getStitchMenuItems();
  let finalHtml = applyMenuLabels(html, menuItems);
  finalHtml = applyActiveMenu(finalHtml, `/${slug}`);
  finalHtml = injectHeroOverlay(finalHtml);
  finalHtml = injectFormHandler(finalHtml);
  finalHtml = await applyCurrentContacts(finalHtml);
  return <StitchPageView html={finalHtml} fullViewport />;
}
