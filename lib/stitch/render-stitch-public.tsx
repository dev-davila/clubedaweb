import { StitchPageView } from "@/components/stitch/stitch-page-view";
import {
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import { applyActiveMenu } from "./apply-active-menu";
import { applyCurrentContacts } from "./apply-current-contacts";
import { applyMenuLabels } from "./apply-menu-labels";
import { injectFormHandler } from "./inject-form-handler";
import { injectHeroOverlay } from "./inject-hero-overlay";
import { getStitchMenuItems } from "./menu-items";
import { getPublishedStitchHtml } from "./published-pages";

/** Retorna o componente Stitch se a página estiver publicada nesse modo; senão null. */
export async function tryRenderStitchPublicPage(pageType: RequiredPageType) {
  const html = await getPublishedStitchHtml(pageType);
  if (!html) return null;
  const menuItems = await getStitchMenuItems();
  let finalHtml = applyMenuLabels(html, menuItems);
  finalHtml = applyActiveMenu(finalHtml, SITE_PAGE_ROUTES[pageType]);
  finalHtml = injectHeroOverlay(finalHtml);
  finalHtml = injectFormHandler(finalHtml);
  finalHtml = await applyCurrentContacts(finalHtml);
  return <StitchPageView html={finalHtml} fullViewport />;
}
