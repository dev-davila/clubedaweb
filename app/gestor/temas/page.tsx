export const dynamic = "force-dynamic";

import { ThemeSelector } from "@/components/gestor/theme-selector";

export default function TemasPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Selecionar tema</h1>
        <p className="text-gray-600 text-sm mt-1.5 max-w-2xl">
          Cada tema aplica de uma vez: cores, tipografia, logos, nome do site e conteúdo da home.
          Você pode ajustar individualmente depois em <strong>Aparência</strong> e no <strong>Editor visual</strong>.
        </p>
      </div>
      <ThemeSelector />
    </div>
  );
}
