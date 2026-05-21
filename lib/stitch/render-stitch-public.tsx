import { StitchPageView } from "@/components/stitch/stitch-page-view";
import {
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import { applyActiveMenu } from "./apply-active-menu";
import { applyMenuLabels } from "./apply-menu-labels";
import { getStitchMenuItems } from "./menu-items";
import { getPublishedStitchHtml } from "./published-pages";

/** Retorna o componente Stitch se a página estiver publicada nesse modo; senão null. */
export async function tryRenderStitchPublicPage(pageType: RequiredPageType) {
  const html = await getPublishedStitchHtml(pageType);
  if (!html) return null;
  // Aplica labels customizados pelo gestor + marca o item ativo no menu
  // baseado na rota canônica da página atual.
  const menuItems = await getStitchMenuItems();
  let finalHtml = applyMenuLabels(html, menuItems);
  finalHtml = applyActiveMenu(finalHtml, SITE_PAGE_ROUTES[pageType]);
  return <StitchPageView html={finalHtml} fullViewport />;
}
