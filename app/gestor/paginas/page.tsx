export const dynamic = "force-dynamic";

import { NewPageDialog } from "@/components/gestor/new-page-dialog";
import { StitchPagesGrid } from "@/components/gestor/stitch-pages-grid";

export default function PaginasPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Páginas do site</h1>
          <p className="text-gray-600 text-sm mt-1">
            Páginas geradas pelo Wizard. Clique em qualquer uma pra editar conteúdo ou crie uma nova com IA.
          </p>
        </div>
        <NewPageDialog />
      </div>
      <StitchPagesGrid editable />
    </div>
  );
}
