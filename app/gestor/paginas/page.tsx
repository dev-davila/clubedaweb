export const dynamic = "force-dynamic";

import { PagesAdmin } from "@/components/gestor/cms/pages-admin";
import { StitchPagesGrid } from "@/components/gestor/stitch-pages-grid";

export default function PaginasPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Páginas do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          As páginas geradas pelo Wizard são o site principal. Páginas dinâmicas legadas ficam abaixo.
        </p>
      </div>

      <StitchPagesGrid />

      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-10">
        Páginas dinâmicas legadas (template antigo)
      </div>
      <PagesAdmin />
    </div>
  );
}
