"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  ImageIcon,
  RefreshCw,
  Palette
} from "lucide-react";

const STYLE_PRESETS = [
  { id: "corporate", name: "Corporativo", description: "Estilo profissional e empresarial" },
  { id: "modern", name: "Moderno", description: "Design contemporâneo e minimalista" },
  { id: "tech", name: "Tecnologia", description: "Visão futurista e digital" },
  { id: "abstract", name: "Abstrato", description: "Formas e cores abstratas" },
  { id: "photorealistic", name: "Fotorealista", description: "Qualidade fotográfica" },
  { id: "illustration", name: "Ilustração", description: "Estilo ilustrado artístico" }
];

const ASPECT_RATIOS = [
  { id: "16:9", name: "16:9", description: "Widescreen" },
  { id: "4:3", name: "4:3", description: "Padrão" },
  { id: "1:1", name: "1:1", description: "Quadrado" },
  { id: "9:16", name: "9:16", description: "Vertical" }
];

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("corporate");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{
    id: string;
    url: string;
    prompt: string;
  }>>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Por favor, descreva a imagem que deseja gerar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedStyle = STYLE_PRESETS.find(s => s.id === style);
      const res = await fetch("/api/gestor/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: selectedStyle?.description,
          aspectRatio
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar imagem");
      }

      setGeneratedImages(prev => [{
        id: data.image.id,
        url: data.image.url,
        prompt
      }, ...prev]);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/gestor/paginas"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="text-purple-600" size={28} />
            Gerador de Imagens com IA
          </h1>
          <p className="text-gray-500 mt-1">
            Crie imagens profissionais usando inteligência artificial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wand2 className="text-purple-600" size={20} />
              Configurações
            </h2>

            {/* Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição da Imagem
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Descreva a imagem que você deseja gerar...

Ex: Equipe de profissionais de TI trabalhando em escritório moderno com computadores"
              />
            </div>

            {/* Style */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette size={14} className="inline mr-1" />
                Estilo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setStyle(preset.id)}
                    className={`p-3 rounded-lg border text-left transition ${
                      style === preset.id
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proporção
              </label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-center transition ${
                      aspectRatio === ratio.id
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm">{ratio.name}</p>
                    <p className="text-xs text-gray-500">{ratio.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Gerar Imagem
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
            <h3 className="font-semibold text-purple-900 mb-3">Dicas para melhores resultados</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li>• Seja específico na descrição</li>
              <li>• Mencione cores, iluminação e ambiente</li>
              <li>• Indique o contexto empresarial</li>
              <li>• Evite solicitar textos na imagem</li>
              <li>• Use termos como "profissional" e "corporativo"</li>
            </ul>
          </div>
        </div>

        {/* Generated Images */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="text-purple-600" size={20} />
              Imagens Geradas
              {generatedImages.length > 0 && (
                <span className="text-sm font-normal text-gray-500">({generatedImages.length})</span>
              )}
            </h2>

            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div
                    key={image.id || index}
                    className="group relative rounded-lg overflow-hidden border"
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => copyUrl(image.url)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition"
                        title="Copiar URL"
                      >
                        {copied === image.url ? (
                          <Check size={20} className="text-green-600" />
                        ) : (
                          <Copy size={20} />
                        )}
                      </button>
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition"
                        title="Abrir em nova aba"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                    <div className="p-3 bg-gray-50">
                      <p className="text-sm text-gray-600 line-clamp-2">{image.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Nenhuma imagem gerada ainda.</p>
                <p className="text-sm mt-1">Use o painel ao lado para criar sua primeira imagem.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
