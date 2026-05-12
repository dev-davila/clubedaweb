"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  Send,
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  RotateCcw
} from "lucide-react";

interface SocialPreview {
  platform: string;
  text: string;
  characterCount: number;
  maxCharacters: number;
  hashtags: string[];
  connected: boolean;
  tokenValid: boolean;
  autoPostEnabled: boolean;
  accountName: string | null;
  accountImage: string | null;
  expiresAt: string | null;
  lastError: string | null;
}

interface ExistingPublication {
  platform: string;
  postUrl: string | null;
  publishedAt: string;
}

interface SocialMediaPreviewProps {
  postId: string;
  postStatus: string;
  onPublish?: (results: any) => void;
}

const platformConfig = {
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    bgColor: "bg-[#0A66C2]/10",
    borderColor: "border-[#0A66C2]/30",
    textColor: "text-[#0A66C2]"
  },
  twitter: {
    name: "X (Twitter)",
    icon: Twitter,
    color: "#000000",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    textColor: "text-gray-900"
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/30",
    textColor: "text-[#1877F2]"
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-gradient-to-r from-[#833AB4]/10 via-[#E4405F]/10 to-[#FCAF45]/10",
    borderColor: "border-[#E4405F]/30",
    textColor: "text-[#E4405F]"
  }
};

export function SocialMediaPreview({ postId, postStatus, onPublish }: SocialMediaPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState<SocialPreview[]>([]);
  const [existingPublications, setExistingPublications] = useState<ExistingPublication[]>([]);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({});
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; url?: string; error?: string }>>({});
  const [deleteResults, setDeleteResults] = useState<Record<string, { success: boolean; message?: string; error?: string; canForceDelete?: boolean; requiresManualDeletion?: boolean }>>({});
  const [postUrl, setPostUrl] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadPreviews();
  }, [postId]);

  const loadPreviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gestor/posts/${postId}/social-preview`);
      if (res.ok) {
        const data = await res.json();
        setPreviews(data.previews);
        setExistingPublications(data.existingPublications || []);
        setPostUrl(data.postUrl);
        setFeaturedImage(data.featuredImage);

        // Inicializar textos customizados e seleções
        const texts: Record<string, string> = {};
        const selected: Record<string, boolean> = {};
        const expanded: Record<string, boolean> = {};
        
        data.previews.forEach((p: SocialPreview) => {
          texts[p.platform] = p.text;
          // Por padrão, selecionar plataformas conectadas com autoPost ativo
          selected[p.platform] = p.connected && p.tokenValid && p.autoPostEnabled;
          expanded[p.platform] = false;
        });
        
        setCustomTexts(texts);
        setSelectedPlatforms(selected);
        setExpandedPlatforms(expanded);
      }
    } catch (error) {
      console.error("Erro ao carregar previews:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const toggleExpanded = (platform: string) => {
    setExpandedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handleTextChange = (platform: string, text: string) => {
    setCustomTexts(prev => ({
      ...prev,
      [platform]: text
    }));
  };

  const resetText = (platform: string) => {
    const preview = previews.find(p => p.platform === platform);
    if (preview) {
      setCustomTexts(prev => ({
        ...prev,
        [platform]: preview.text
      }));
    }
  };

  // Função para renovar token e publicar (especialmente para Twitter)
  const refreshTokenAndPublish = async (platform: string) => {
    setPublishing(prev => ({ ...prev, [platform]: true }));
    try {
      // Tentar renovar o token primeiro
      const refreshRes = await fetch(`/api/social/${platform}/refresh-token`, {
        method: "POST"
      });

      if (!refreshRes.ok) {
        const refreshData = await refreshRes.json();
        // Se falhar a renovação, ainda tenta publicar (pode ser que o token ainda esteja válido)
        console.log("Token refresh failed, trying to publish anyway:", refreshData);
      }

      // Depois publicar
      await publishToSingle(platform);
    } catch (error) {
      console.error("Error in refreshTokenAndPublish:", error);
      setPublishResults(prev => ({
        ...prev,
        [platform]: { success: false, error: "Erro ao renovar token" }
      }));
    } finally {
      setPublishing(prev => ({ ...prev, [platform]: false }));
    }
  };

  const publishToSingle = async (platform: string) => {
    setPublishing(prev => ({ ...prev, [platform]: true }));
    try {
      const res = await fetch(`/api/social/${platform}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogPostId: postId,
          customText: customTexts[platform]
        })
      });

      const data = await res.json();
      setPublishResults(prev => ({
        ...prev,
        [platform]: {
          success: data.success,
          url: data.postUrl,
          error: data.error
        }
      }));

      if (data.success) {
        // Atualizar publicações existentes
        setExistingPublications(prev => [
          ...prev.filter(p => p.platform !== platform),
          { platform, postUrl: data.postUrl, publishedAt: new Date().toISOString() }
        ]);
      }
    } catch (error: any) {
      setPublishResults(prev => ({
        ...prev,
        [platform]: {
          success: false,
          error: error.message || "Erro ao publicar"
        }
      }));
    } finally {
      setPublishing(prev => ({ ...prev, [platform]: false }));
    }
  };

  const publishToAll = async () => {
    const platformsToPublish = Object.entries(selectedPlatforms)
      .filter(([_, selected]) => selected)
      .map(([platform]) => platform);

    for (const platform of platformsToPublish) {
      await publishToSingle(platform);
    }

    if (onPublish) {
      onPublish(publishResults);
    }
  };

  // Função para excluir publicação
  const deleteFromPlatform = async (platform: string, forceDelete: boolean = false) => {
    setDeleting(prev => ({ ...prev, [platform]: true }));
    setDeleteResults(prev => {
      const newResults = { ...prev };
      delete newResults[platform];
      return newResults;
    });

    try {
      const res = await fetch(`/api/social/${platform}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogPostId: postId,
          forceDelete
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Remover da lista de publicações existentes
        setExistingPublications(prev => prev.filter(p => p.platform !== platform));
        setShowDeleteConfirm(null);
        setDeleteResults(prev => ({
          ...prev,
          [platform]: { success: true, message: data.message }
        }));
        // Limpar após 3 segundos
        setTimeout(() => {
          setDeleteResults(prev => {
            const newResults = { ...prev };
            delete newResults[platform];
            return newResults;
          });
        }, 3000);
      } else {
        setDeleteResults(prev => ({
          ...prev,
          [platform]: { 
            success: false, 
            error: data.error,
            canForceDelete: data.canForceDelete,
            requiresManualDeletion: data.requiresManualDeletion
          }
        }));
      }
    } catch (error: any) {
      setDeleteResults(prev => ({
        ...prev,
        [platform]: { success: false, error: error.message || "Erro ao excluir" }
      }));
    } finally {
      setDeleting(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Função para repostar (excluir e publicar novamente)
  const repostToPlatform = async (platform: string) => {
    // Primeiro excluir
    setDeleting(prev => ({ ...prev, [platform]: true }));
    try {
      const deleteRes = await fetch(`/api/social/${platform}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogPostId: postId,
          forceDelete: true
        })
      });

      if (deleteRes.ok) {
        // Remover da lista local
        setExistingPublications(prev => prev.filter(p => p.platform !== platform));
      }
    } catch (error) {
      console.error("Error deleting before repost:", error);
    } finally {
      setDeleting(prev => ({ ...prev, [platform]: false }));
    }

    // Depois publicar novamente
    if (platform === "twitter") {
      await refreshTokenAndPublish(platform);
    } else {
      await publishToSingle(platform);
    }
  };

  const getExistingPublication = (platform: string) => {
    return existingPublications.find(p => p.platform === platform);
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Carregando previews...</span>
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(selectedPlatforms).filter(Boolean).length;
  const connectedCount = previews.filter(p => p.connected && p.tokenValid).length;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Publicar nas Redes Sociais</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {connectedCount} de 4 conectadas
            </span>
            <Link
              href="/gestor/redes-sociais"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Configurar
            </Link>
          </div>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="p-4 space-y-3">
        {previews.map((preview) => {
          const config = platformConfig[preview.platform as keyof typeof platformConfig];
          const Icon = config.icon;
          const isExpanded = expandedPlatforms[preview.platform];
          const isSelected = selectedPlatforms[preview.platform];
          const existingPub = getExistingPublication(preview.platform);
          const daysUntilExpiry = getDaysUntilExpiry(preview.expiresAt);
          const charCount = customTexts[preview.platform]?.length || 0;
          const isOverLimit = charCount > preview.maxCharacters;
          const publishResult = publishResults[preview.platform];

          return (
            <div
              key={preview.platform}
              className={`rounded-lg border transition-all ${
                existingPub
                  ? "bg-green-50 border-green-200"
                  : isSelected
                  ? `${config.bgColor} ${config.borderColor}`
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {/* Platform Header */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Checkbox de seleção */}
                    <button
                      onClick={() => togglePlatform(preview.platform)}
                      disabled={!preview.connected || !preview.tokenValid || !!existingPub}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        existingPub
                          ? "bg-green-500 border-green-500 cursor-not-allowed"
                          : isSelected && preview.connected && preview.tokenValid
                          ? `bg-[${config.color}] border-[${config.color}]`
                          : "bg-white border-gray-300"
                      } ${!preview.connected || !preview.tokenValid ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"}`}
                      style={{
                        backgroundColor: existingPub ? "#22c55e" : (isSelected && preview.connected ? config.color : undefined),
                        borderColor: existingPub ? "#22c55e" : (isSelected && preview.connected ? config.color : undefined)
                      }}
                    >
                      {(isSelected || existingPub) && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Icon e Nome */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.color + "20" }}
                      >
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{config.name}</span>
                          {preview.autoPostEnabled && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Auto</span>
                          )}
                        </div>
                        {preview.accountName && (
                          <span className="text-xs text-gray-500">{preview.accountName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status e Ações */}
                  <div className="flex items-center gap-2">
                    {/* Status de conexão */}
                    {!preview.connected ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Desconectado
                      </span>
                    ) : !preview.tokenValid ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Token expirado
                      </span>
                    ) : daysUntilExpiry !== null && daysUntilExpiry <= 7 ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expira em {daysUntilExpiry}d
                      </span>
                    ) : existingPub ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Publicado
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Conectado
                      </span>
                    )}

                    {/* Botão expandir */}
                    <button
                      onClick={() => toggleExpanded(preview.platform)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mensagem de erro */}
                {preview.lastError && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {preview.lastError}
                  </div>
                )}

                {/* Link do post publicado e ações */}
                {existingPub && (
                  <div className="mt-2 space-y-2">
                    {existingPub.postUrl && (
                      <a
                        href={existingPub.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver publicação
                      </a>
                    )}

                    {/* Botões de ação: Excluir e Repostar */}
                    {showDeleteConfirm === preview.platform ? (
                      <div className="flex flex-col gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-xs text-red-700 font-medium">
                          Tem certeza que deseja excluir?
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteFromPlatform(preview.platform)}
                            disabled={deleting[preview.platform]}
                            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
                          >
                            {deleting[preview.platform] ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : (
                              "Sim, excluir"
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(preview.platform)}
                          disabled={deleting[preview.platform] || publishing[preview.platform]}
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                        <button
                          onClick={() => repostToPlatform(preview.platform)}
                          disabled={deleting[preview.platform] || publishing[preview.platform]}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded transition-all disabled:opacity-50"
                        >
                          {(deleting[preview.platform] || publishing[preview.platform]) ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              Repostar
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Resultado da exclusão */}
                    {deleteResults[preview.platform] && (
                      <div className={`text-xs p-2 rounded ${
                        deleteResults[preview.platform].success 
                          ? "bg-green-50 text-green-700" 
                          : "bg-red-50 text-red-700"
                      }`}>
                        {deleteResults[preview.platform].success ? (
                          <div className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {deleteResults[preview.platform].message}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                              <X className="w-3 h-3" />
                              {deleteResults[preview.platform].error}
                            </div>
                            {deleteResults[preview.platform].canForceDelete && (
                              <button
                                onClick={() => deleteFromPlatform(preview.platform, true)}
                                disabled={deleting[preview.platform]}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
                              >
                                {deleting[preview.platform] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-3 h-3" />
                                    Remover do Sistema
                                  </>
                                )}
                              </button>
                            )}
                            {deleteResults[preview.platform].requiresManualDeletion && (
                              <span className="text-xs text-gray-600">
                                ⚠️ Exclua o post manualmente no app do Instagram
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Resultado da publicação */}
                {publishResult && (
                  <div className={`mt-2 text-xs p-2 rounded ${
                    publishResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    {publishResult.success ? (
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Publicado com sucesso!
                        {publishResult.url && (
                          <a href={publishResult.url} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                            Ver post
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <X className="w-3 h-3" />
                          {publishResult.error}
                        </div>
                        {/* Botão Repostar para publicações que falharam */}
                        <button
                          onClick={() => {
                            // Limpar resultado anterior e tentar novamente
                            setPublishResults(prev => {
                              const newResults = { ...prev };
                              delete newResults[preview.platform];
                              return newResults;
                            });
                            // Se for Twitter, renovar token primeiro
                            if (preview.platform === "twitter") {
                              refreshTokenAndPublish(preview.platform);
                            } else {
                              publishToSingle(preview.platform);
                            }
                          }}
                          disabled={publishing[preview.platform]}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
                        >
                          {publishing[preview.platform] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Tentando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Tentar Novamente
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conteúdo Expandido - Preview e Editor */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                  {/* Preview Visual */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-2">Preview do Post</div>
                    <div className="bg-white rounded-lg border p-3">
                      {/* Simulação do post */}
                      <div className="flex items-start gap-2 mb-2">
                        {preview.accountImage ? (
                          <Image
                            src={preview.accountImage}
                            alt={preview.accountName || ""}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{preview.accountName || "M3Solutions"}</div>
                          <div className="text-xs text-gray-500">Agora</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                        {customTexts[preview.platform]?.substring(0, 500)}
                        {(customTexts[preview.platform]?.length || 0) > 500 && "..."}
                      </div>
                      {featuredImage && (
                        <div className="mt-2 rounded-lg overflow-hidden bg-gray-100 aspect-video relative">
                          <Image
                            src={featuredImage}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editor de Texto */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Editar Texto</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resetText(preview.platform)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Resetar
                        </button>
                        <span className={`text-xs ${isOverLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          {charCount}/{preview.maxCharacters}
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={customTexts[preview.platform] || ""}
                      onChange={(e) => handleTextChange(preview.platform, e.target.value)}
                      className={`w-full text-sm border rounded-lg p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isOverLimit ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                      rows={6}
                      disabled={!preview.connected || !preview.tokenValid}
                    />
                  </div>

                  {/* Botão de publicar individual */}
                  {preview.connected && preview.tokenValid && !existingPub && (
                    <div className="mt-3">
                      <button
                        onClick={() => publishToSingle(preview.platform)}
                        disabled={publishing[preview.platform] || isOverLimit}
                        className="w-full py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: config.color }}
                      >
                        {publishing[preview.platform] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Publicando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Publicar no {config.name}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer - Botão Publicar em Todas */}
      {connectedCount > 0 && selectedCount > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <button
            onClick={publishToAll}
            disabled={Object.values(publishing).some(Boolean)}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {Object.values(publishing).some(Boolean) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publicar em {selectedCount} rede{selectedCount > 1 ? "s" : ""} selecionada{selectedCount > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      )}

      {/* Aviso se post não está publicado */}
      {postStatus !== "PUBLISHED" && (
        <div className="px-4 py-3 border-t bg-yellow-50">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <AlertCircle className="w-4 h-4" />
            <span>
              O post ainda não foi publicado no blog. Publique primeiro para compartilhar nas redes sociais.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
