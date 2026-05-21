export const dynamic = "force-dynamic";

import { StitchSiteSummary } from "@/components/gestor/stitch-site-summary";

export default function TemasPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tema do site</h1>
        <p className="text-gray-600 text-sm mt-1.5 max-w-2xl">
          O tema do site é o que foi gerado pelo Wizard. Pra mudar paleta, fontes ou estilo, regere pelo chat com novas instruções.
        </p>
      </div>
      <StitchSiteSummary context="temas" />
    </div>
  );
}
