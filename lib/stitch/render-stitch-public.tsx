import { StitchPageView } from "@/components/stitch/stitch-page-view";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import { applyMenuLabels } from "./apply-menu-labels";
import { getStitchMenuItems } from "./menu-items";
import { getPublishedStitchHtml } from "./published-pages";

/** Retorna o componente Stitch se a página estiver publicada nesse modo; senão null. */
export async function tryRenderStitchPublicPage(pageType: RequiredPageType) {
  const html = await getPublishedStitchHtml(pageType);
  if (!html) return null;
  // Aplica labels de menu editados pelo gestor (header).
  const menuItems = await getStitchMenuItems();
  const finalHtml = applyMenuLabels(html, menuItems);
  return <StitchPageView html={finalHtml} fullViewport />;
}
