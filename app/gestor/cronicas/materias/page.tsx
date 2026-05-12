"use client";

import { useState, useEffect } from "react";
import { Newspaper, Loader2, ExternalLink, Sparkles, Clock, Filter, RefreshCw, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  originalUrl: string;
  imageUrl: string | null;
  status: string;
  collectedAt: string;
  site: { name: string };
  chronicle: { id: string; status: string } | null;
}

interface SyncResult {
  siteId: string;
  siteName: string;
  found: number;
  added: number;
  skipped: number;
  error?: string;
}

interface SyncResponse {
  success: boolean;
  summary: {
    sites: number;
    found: number;
    added: number;
    skipped: number;
    errors: number;
  };
  results: SyncResult[];
  emailsSent?: number;
  emailsFailed?: number;
}

export default function MateriasPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [filter, setFilter] = useState("pending");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [showSyncDetails, setShowSyncDetails] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cronicas/materias?status=${filter}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/cronicas/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao sincronizar");
      }
      setSyncResult(data);
      setShowSyncDetails(true);
      // Refresh articles list
      fetchArticles();
    } catch (error: any) {
      alert(error.message || "Erro ao sincronizar matérias");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateChronicle = async (articleId: string) => {
    setGenerating(articleId);
    try {
      const res = await fetch("/api/cronicas/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      fetchArticles();
    } catch (error: any) {
      alert(error.message || "Erro ao gerar crônica");
    } finally {
      setGenerating(null);
    }
  };

  // Gerar crônicas para todas as matérias selecionadas (sem crônica)
  const handleGenerateAllChronicles = async () => {
    const selectedWithoutChronicle = articles.filter(
      (a) => a.status === "selected" && !a.chronicle
    );
    
    if (selectedWithoutChronicle.length === 0) {
      alert("Não há matérias selecionadas sem crônica para gerar.");
      return;
    }

    if (!confirm(`Deseja gerar crônicas para ${selectedWithoutChronicle.length} matéria(s)? Isso pode levar alguns minutos.`)) {
      return;
    }

    setGeneratingAll(true);
    setGenerationProgress({ current: 0, total: selectedWithoutChronicle.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedWithoutChronicle.length; i++) {
      const article = selectedWithoutChronicle[i];
      setGenerationProgress({ current: i + 1, total: selectedWithoutChronicle.length });
      
      try {
        const res = await fetch("/api/cronicas/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: article.id })
        });
        
        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setGeneratingAll(false);
    setGenerationProgress({ current: 0, total: 0 });
    
    alert(`Geração concluída!\n✅ ${successCount} crônica(s) gerada(s)\n❌ ${errorCount} erro(s)`);
    fetchArticles();
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    selected: "bg-blue-100 text-blue-700",
    converted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-gray-100 text-gray-500"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matérias Coletadas</h1>
          <p className="text-gray-500 text-sm mt-1">Matérias coletadas dos sites monitorados</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
          >
            {syncing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Sincronizar Matérias
              </>
            )}
          </button>
          
          {/* Botão para gerar todas as crônicas selecionadas */}
          {filter === "selected" && articles.filter(a => a.status === "selected" && !a.chronicle).length > 0 && (
            <button
              onClick={handleGenerateAllChronicles}
              disabled={generatingAll}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium"
            >
              {generatingAll ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando {generationProgress.current}/{generationProgress.total}...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Gerar Todas as Crônicas
                </>
              )}
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pendentes</option>
              <option value="selected">Selecionadas</option>
              <option value="converted">Convertidas</option>
              <option value="rejected">Rejeitadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sync Results Modal */}
      {showSyncDetails && syncResult && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              Sincronização Concluída
            </h2>
            <button
              onClick={() => setShowSyncDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{syncResult.summary.sites}</p>
              <p className="text-xs text-gray-500">Sites Verificados</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{syncResult.summary.found}</p>
              <p className="text-xs text-gray-500">Matérias Encontradas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{syncResult.summary.added}</p>
              <p className="text-xs text-gray-500">Novas Adicionadas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">{syncResult.summary.skipped}</p>
              <p className="text-xs text-gray-500">Já Existentes</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{syncResult.emailsSent || 0}</p>
              <p className="text-xs text-gray-500">Emails Enviados</p>
            </div>
          </div>
          
          {/* Email status message */}
          {syncResult.summary.added > 0 && (
            <div className={`p-3 rounded-lg mb-4 ${syncResult.emailsSent && syncResult.emailsSent > 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
              {syncResult.emailsSent && syncResult.emailsSent > 0 ? (
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Email de seleção enviado para {syncResult.emailsSent} destinatário(s)
                </p>
              ) : (
                <p className="text-sm text-yellow-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Nenhum email enviado. Verifique se há destinatários cadastrados em Crônicas → Destinatários
                </p>
              )}
            </div>
          )}

          {/* Details per site */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Detalhes por Site:</p>
            {syncResult.results.map((result) => (
              <div
                key={result.siteId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.error ? "bg-red-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.error ? (
                    <AlertCircle size={16} className="text-red-500" />
                  ) : (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  <span className="font-medium text-gray-900">{result.siteName}</span>
                </div>
                {result.error ? (
                  <span className="text-sm text-red-600">{result.error}</span>
                ) : (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{result.found} encontradas</span>
                    <span className="text-green-600 font-medium">+{result.added} novas</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner informativo para matérias selecionadas */}
      {filter === "selected" && !loading && articles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-blue-800 font-medium">Matérias Selecionadas</p>
              <p className="text-blue-600 text-sm mt-1">
                Estas são as matérias que foram selecionadas para geração de crônicas. 
                {articles.filter(a => !a.chronicle).length > 0 && (
                  <span className="font-medium"> {articles.filter(a => !a.chronicle).length} matéria(s) ainda não tem crônica gerada.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma matéria encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">{article.site.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[article.status]}`}>
                      {article.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{article.title}</h3>
                  {article.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(article.collectedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    <a
                      href={article.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      Ver original
                    </a>
                  </div>
                </div>
                {/* Botão Gerar Crônica - para pending e selected sem crônica */}
                {(article.status === "pending" || article.status === "selected") && !article.chronicle && (
                  <button
                    onClick={() => handleGenerateChronicle(article.id)}
                    disabled={generating === article.id || generatingAll}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {generating === article.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Gerar Crônica
                  </button>
                )}
                {/* Indicador de crônica já existente */}
                {article.chronicle && (
                  <span className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg">
                    <CheckCircle size={14} />
                    Crônica Gerada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
