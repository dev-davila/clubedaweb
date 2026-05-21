export const dynamic = "force-dynamic";

import { StitchMenuEditor } from "@/components/gestor/stitch-menu-editor";
import { StitchSiteSummary } from "@/components/gestor/stitch-site-summary";
import { getStitchMenuItems } from "@/lib/stitch/menu-items";
import { isStitchSitePublished } from "@/lib/stitch/published-pages";

export default async function MenusPage() {
  const stitchPublished = await isStitchSitePublished();
  const stitchItems = stitchPublished ? await getStitchMenuItems() : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Menu do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          As 5 páginas publicadas pelo Wizard formam o menu principal. Edite labels e visibilidade — as alterações aparecem em todo o site imediatamente.
        </p>
      </div>

      <StitchSiteSummary context="menus" />

      {stitchPublished && (
        <div className="mt-8">
          <StitchMenuEditor initialItems={stitchItems} />
        </div>
      )}
    </div>
  );
}
