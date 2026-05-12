import { FileText, Image, Sparkles, LayoutTemplate } from "lucide-react";

export default function TemplatePostPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-blue-600" size={24} />
          Templates de Post
        </h1>
        <p className="text-gray-500 mt-1">
          Configure os templates de formatação e estrutura dos posts
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LayoutTemplate size={20} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Estrutura do Post</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Defina a estrutura padrão dos posts (introdução, corpo, conclusão).
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Image size={20} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Imagens</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Configure tamanhos e estilos de imagens nos posts.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles size={20} className="text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Tom de Voz IA</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Defina o tom de voz e estilo de escrita da IA.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
