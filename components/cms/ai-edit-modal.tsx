"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, X, Send, Loader2, ExternalLink } from "lucide-react";

interface AIEditModalProps {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
}

export default function AIEditModal({ pageId, pageTitle, pageSlug }: AIEditModalProps) {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("ai_edit") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleProcess = async () => {
    if (!prompt.trim()) return;
    
    setProcessing(true);
    setResult(null);
    
    try {
      const res = await fetch("/api/gestor/pages/ai-modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          prompt
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar");
      }
      
      setResult(data.message || "Alterações aplicadas com sucesso!");
      
      // Reload page after 2 seconds to show changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setResult(`Erro: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Remove ai_edit from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("ai_edit");
    window.history.replaceState({}, "", url.toString());
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 pt-20">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Modificar com IA</h2>
              <p className="text-sm text-gray-500">{pageTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/gestor/paginas/${pageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
              title="Abrir no Editor"
            >
              <ExternalLink size={20} />
            </a>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descreva as alterações que deseja realizar
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Altere o título para 'Novo Título', adicione um parágrafo sobre segurança, mude a cor do botão para azul..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px] resize-none"
              disabled={processing}
            />
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <strong>Dica:</strong> Você está visualizando a página em tempo real. 
              As alterações feitas pela IA serão aplicadas imediatamente e a página será recarregada.
            </p>
          </div>

          {result && (
            <div className={`p-4 rounded-xl ${
              result.startsWith("Erro") 
                ? "bg-red-50 text-red-700" 
                : "bg-green-50 text-green-700"
            }`}>
              {result}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Fechar
            </button>
            <button
              onClick={handleProcess}
              disabled={processing || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Aplicar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
