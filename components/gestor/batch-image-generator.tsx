"use client";

import { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Loader2, Play, Square, CheckCircle2, XCircle, Sparkles, ImageOff, ChevronDown, FolderOpen } from "lucide-react";

interface ImageGenStatus {
  running: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentPost: string;
  errors: string[];
  startedAt: string;
  finishedAt: string | null;
  serviceType?: string;
}

interface ServiceOption {
  name: string;
  totalPosts: number;
  postsWithoutImage: number;
}

interface BatchImageGeneratorProps {
  /** Lista de serviceTypes disponíveis (extraída do groupedPosts) */
  serviceTypes?: string[];
  /** Posts agrupados por serviceType para contar posts sem imagem */
  posts?: Array<{ id: string; serviceType: string | null; featuredImage: string | null }>;
  /** Callback quando terminar */
  onComplete?: () => void;
}

export function BatchImageGenerator({ serviceTypes = [], posts = [], onComplete }: BatchImageGeneratorProps) {
  const [status, setStatus] = useState<ImageGenStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Calcular posts sem imagem por serviceType
  const serviceOptions: ServiceOption[] = serviceTypes.map(st => {
    const servicePosts = posts.filter(p => (p.serviceType || "Outros") === st);
    const withoutImage = servicePosts.filter(p => !p.featuredImage || p.featuredImage === '' || p.featuredImage.includes('blog-default')).length;
    return { name: st, totalPosts: servicePosts.length, postsWithoutImage: withoutImage };
  }).filter(s => s.postsWithoutImage > 0); // Só mostrar serviços com posts pendentes

  const totalWithoutImage = posts.filter(p => !p.featuredImage || p.featuredImage === '' || (p.featuredImage && p.featuredImage.includes('blog-default'))).length;

  // Verificar status periodicamente
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/posts/generate-images-batch", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.running !== undefined) {
          setStatus(data);
          if (data.running === false && data.finishedAt) {
            onComplete?.();
          }
        }
      }
    } catch {}
  }, [onComplete]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleStart = async () => {
    if (!selectedService) {
      alert("Selecione uma matéria/serviço para gerar imagens.");
      return;
    }
    setStarting(true);
    try {
      const body: any = { useAI, filter: { serviceType: selectedService } };
      const res = await fetch("/api/gestor/posts/generate-images-batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.total === 0) {
        alert(`✅ Todos os posts de "${selectedService}" já possuem imagem!`);
      }
    } catch (error) {
      alert("Erro ao iniciar geração de imagens");
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await fetch("/api/gestor/posts/generate-images-batch", {
        method: "DELETE",
        credentials: "include"
      });
      checkStatus();
    } catch {}
  };

  const isRunning = status?.running === true;
  const isFinished = status?.running === false && status?.finishedAt;
  const progress = status ? Math.round((status.processed / Math.max(status.total, 1)) * 100) : 0;

  // Se não tem posts sem imagem, não mostrar o componente
  if (totalWithoutImage === 0 && !isRunning && !isFinished) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <ImageIcon size={16} className="text-purple-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Geração de Imagens</h4>
            <p className="text-xs text-gray-500">
              {totalWithoutImage} post{totalWithoutImage !== 1 ? 's' : ''} sem imagem
            </p>
          </div>
        </div>

        {isRunning && (
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium"
          >
            <Square size={14} />
            Cancelar
          </button>
        )}
      </div>

      {/* Seletor de Matéria + Controles */}
      {!isRunning && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
          {/* Dropdown de Matéria */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <FolderOpen size={14} className="text-gray-400 flex-shrink-0" />
                <span className={selectedService ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedService || 'Selecione a matéria...'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {selectedService && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                    {serviceOptions.find(s => s.name === selectedService)?.postsWithoutImage || 0} pendentes
                  </span>
                )}
                <ChevronDown size={14} className={`text-gray-400 transition ${showDropdown ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showDropdown && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {serviceOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-gray-400">
                    Todos os serviços já possuem imagens
                  </div>
                ) : (
                  serviceOptions.map(option => (
                    <button
                      key={option.name}
                      onClick={() => {
                        setSelectedService(option.name);
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-purple-50 transition text-left ${
                        selectedService === option.name ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate font-medium">{option.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] text-gray-400">
                          {option.totalPosts} posts
                        </span>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                          {option.postsWithoutImage} sem foto
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Opção IA + Botão Iniciar */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <Sparkles size={12} className="text-purple-500" />
              IA
            </label>
            <button
              onClick={handleStart}
              disabled={starting || !selectedService}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Gerar Imagens
            </button>
          </div>
        </div>
      )}

      {/* Running - show which service */}
      {isRunning && status?.serviceType && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-purple-50 rounded-lg">
          <FolderOpen size={12} className="text-purple-500" />
          <span className="text-xs font-medium text-purple-700">{status.serviceType}</span>
        </div>
      )}

      {/* Progress */}
      {(isRunning || isFinished) && status && (
        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isRunning ? 'bg-purple-500 animate-pulse' : status.failed > 0 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-gray-500">
                {status.processed}/{status.total} processados
              </span>
              {status.succeeded > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={12} /> {status.succeeded}
                </span>
              )}
              {status.failed > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle size={12} /> {status.failed}
                </span>
              )}
            </div>
            <span className="text-gray-400">
              {isRunning ? `${progress}%` : 'Concluído'}
            </span>
          </div>

          {isRunning && status.currentPost && (
            <p className="text-xs text-gray-500 truncate">
              🖼️ {status.currentPost}
            </p>
          )}

          {isFinished && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              status.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}>
              {status.failed === 0 ? (
                <><CheckCircle2 size={14} /> Todas as imagens foram geradas com sucesso!</>
              ) : (
                <><ImageOff size={14} /> {status.succeeded} geradas, {status.failed} falharam</>
              )}
            </div>
          )}

          {status.errors.length > 0 && (
            <details className="text-xs">
              <summary className="text-red-500 cursor-pointer hover:text-red-700">
                {status.errors.length} erro(s)
              </summary>
              <div className="mt-1 bg-red-50 rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
                {status.errors.slice(-5).map((err, i) => (
                  <p key={i} className="text-red-600 text-[11px]">• {err}</p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Hint when idle */}
      {!isRunning && !isFinished && (
        <p className="text-[11px] text-gray-400">
          {useAI ? '⚠️ Com IA: ~30s por imagem (melhor qualidade). Sem IA: imagens do acervo (instantâneo).' : 'Selecione a matéria e clique em "Gerar Imagens". Marque "IA" para gerar com inteligência artificial.'}
        </p>
      )}
    </div>
  );
}
