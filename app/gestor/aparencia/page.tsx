export const dynamic = "force-dynamic";

import { getActiveBrand } from "@/lib/theme-config";
import { BrandEditor } from "@/components/gestor/brand-editor";

export default async function AparenciaPage() {
  const brand = await getActiveBrand();
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aparência do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          Configure paleta, tipografia, logos e raio de borda. As mudanças são aplicadas em todo o site após salvar.
        </p>
      </div>
      <BrandEditor initial={brand} />
    </div>
  );
}
