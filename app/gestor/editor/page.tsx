export const dynamic = "force-dynamic";

import { StitchPagesGrid } from "@/components/gestor/stitch-pages-grid";

export default function EditorListPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Editor visual</h1>
          <p className="text-gray-600 text-sm mt-1.5 max-w-2xl">
            Clique numa página pra editar texto, HTML ou pedir uma regeneração com IA. Use o card &quot;Nova página&quot; pra pedir uma página adicional via chat.
          </p>
        </div>
      </div>

      <StitchPagesGrid editable />
    </div>
  );
}
