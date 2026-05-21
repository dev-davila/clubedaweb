export const dynamic = "force-dynamic";

import { MenuBuilder } from "@/components/gestor/cms/menu-builder";
import { StitchSiteSummary } from "@/components/gestor/stitch-site-summary";

export default function MenusPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Menus do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          Quando há site Stitch publicado, o menu vem das 5 páginas geradas pelo Wizard. O construtor abaixo só é usado pelo template legado.
        </p>
      </div>

      <StitchSiteSummary context="menus" />

      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-10">
        Construtor de menu (template legado)
      </div>
      <MenuBuilder />
    </div>
  );
}
