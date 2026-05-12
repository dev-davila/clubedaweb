import { Globe, Palette, Layout, Type } from "lucide-react";

export default function TemplateSitePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="text-blue-600" size={24} />
          Templates do Site
        </h1>
        <p className="text-gray-500 mt-1">
          Configure os templates visuais e de conteúdo do site
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette size={20} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Cores e Identidade</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Defina as cores primárias, secundárias e a paleta de cores do site.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Layout size={20} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Layout</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Configure o layout padrão das páginas, header e footer.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Type size={20} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Tipografia</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Escolha as fontes e estilos de texto do site.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
