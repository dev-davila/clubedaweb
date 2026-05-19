import { StitchPageView } from "@/components/stitch/stitch-page-view";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import { getPublishedStitchHtml } from "./published-pages";

/** Retorna o componente Stitch se a página estiver publicada nesse modo; senão null. */
export async function tryRenderStitchPublicPage(pageType: RequiredPageType) {
  const html = await getPublishedStitchHtml(pageType);
  if (!html) return null;
  return <StitchPageView html={html} fullViewport />;
}
