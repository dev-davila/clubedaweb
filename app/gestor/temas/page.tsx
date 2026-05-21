export const dynamic = "force-dynamic";

import { ThemeSelector } from "@/components/gestor/theme-selector";
import { StitchSiteSummary } from "@/components/gestor/stitch-site-summary";

export default function TemasPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tema do site</h1>
        <p className="text-gray-600 text-sm mt-1.5 max-w-2xl">
          O tema atual é o site gerado pelo Wizard. Os templates fixos abaixo só são usados quando não há site Stitch publicado.
        </p>
      </div>

      <StitchSiteSummary context="temas" />

      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-10">
        Templates fixos (usados como fallback)
      </div>
      <ThemeSelector />
    </div>
  );
}
