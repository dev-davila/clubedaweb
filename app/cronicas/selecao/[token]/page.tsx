"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Newspaper,
  Clock,
  Globe,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  originalUrl: string;
  imageUrl: string | null;
  collectedAt: string;
  site: {
    id: string;
    name: string;
    url: string;
  };
}

interface SelectionData {
  valid: boolean;
  articles: Article[];
  expiresAt: string;
}

interface ArticleSelection {
  selected: boolean;
  publishOption: "immediate" | "scheduled";
  scheduledDate: string;
  scheduledTime: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

function getDefaultTime(): string {
  return "09:00";
}

export default function PublicSelectionPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<SelectionData | null>(null);
  const [articleSelections, setArticleSelections] = useState<{ [key: string]: ArticleSelection }>({});
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<{
    generatedCount: number;
    immediateCount: number;
    scheduledCount: number;
  } | null>(null);

  const MAX_SELECTIONS = 100;

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (token) {
      loadSelectionData();
    }
  }, [token]);

  const loadSelectionData = async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/cronicas/selecao/${token}`);
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Server returned HTML instead of JSON (e.g., during restart/deploy)
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          return loadSelectionData(attempt + 1);
        }
        throw new Error("O servidor está temporariamente indisponível. Tente novamente em alguns segundos.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao carregar dados");
      }

      setData(result);
      setRetryCount(0);
      
      // Initialize selection state for each article
      const initialSelections: { [key: string]: ArticleSelection } = {};
      result.articles.forEach((article: Article) => {
        initialSelections[article.id] = {
          selected: false,
          publishOption: "immediate",
          scheduledDate: getMinDate(),
          scheduledTime: getDefaultTime()
        };
      });
      setArticleSelections(initialSelections);
    } catch (err: any) {
      setError(err.message);
      setRetryCount(attempt);
    } finally {
      setLoading(false);
    }
  };

  const toggleArticle = (articleId: string) => {
    const currentSelection = articleSelections[articleId];
    const selectedCount = Object.values(articleSelections).filter(s => s.selected).length;
    
    if (!currentSelection.selected && selectedCount >= MAX_SELECTIONS) {
      alert(`Voce pode selecionar no maximo ${MAX_SELECTIONS} materias.`);
      return;
    }
    
    setArticleSelections(prev => ({
      ...prev,
      [articleId]: { ...prev[articleId], selected: !prev[articleId].selected }
    }));
  };

  const updateArticleOption = (articleId: string, field: keyof ArticleSelection, value: any) => {
    setArticleSelections(prev => ({
      ...prev,
      [articleId]: { ...prev[articleId], [field]: value }
    }));
  };

  const selectAll = () => {
    const updated = { ...articleSelections };
    let count = 0;
    Object.keys(updated).forEach(id => {
      if (count < MAX_SELECTIONS) {
        updated[id].selected = true;
        count++;
      }
    });
    setArticleSelections(updated);
  };

  const deselectAll = () => {
    const updated = { ...articleSelections };
    Object.keys(updated).forEach(id => {
      updated[id].selected = false;
    });
    setArticleSelections(updated);
  };

  const setAllImmediate = () => {
    const updated = { ...articleSelections };
    Object.keys(updated).forEach(id => {
      if (updated[id].selected) {
        updated[id].publishOption = "immediate";
      }
    });
    setArticleSelections(updated);
  };

  const setAllScheduled = (date: string, time: string) => {
    const updated = { ...articleSelections };
    Object.keys(updated).forEach(id => {
      if (updated[id].selected) {
        updated[id].publishOption = "scheduled";
        updated[id].scheduledDate = date;
        updated[id].scheduledTime = time;
      }
    });
    setArticleSelections(updated);
  };

  const selectedCount = Object.values(articleSelections).filter(s => s.selected).length;
  const immediateCount = Object.values(articleSelections).filter(s => s.selected && s.publishOption === "immediate").length;
  const scheduledCount = Object.values(articleSelections).filter(s => s.selected && s.publishOption === "scheduled").length;

  const handleSubmit = async () => {
    if (selectedCount === 0) {
      alert("Selecione pelo menos uma materia.");
      return;
    }

    // Build articles with individual scheduling
    const articlesData = Object.entries(articleSelections)
      .filter(([_, sel]) => sel.selected)
      .map(([id, sel]) => {
        let scheduledFor: string | null = null;
        if (sel.publishOption === "scheduled") {
          const dateTime = new Date(`${sel.scheduledDate}T${sel.scheduledTime}:00`);
          if (dateTime <= new Date()) {
            throw new Error(`Data de agendamento invalida para uma materia.`);
          }
          scheduledFor = dateTime.toISOString();
        }
        return { articleId: id, scheduledFor };
      });

    try {
      setSubmitting(true);
      const response = await fetch(`/api/cronicas/selecao/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: articlesData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar selecao");
      }

      setGenerationResult({
        generatedCount: result.generatedCount || selectedCount,
        immediateCount,
        scheduledCount
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isTemporaryError = error.includes("indisponível") || error.includes("Unexpected") || error.includes("JSON");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className={`h-16 w-16 mx-auto ${isTemporaryError ? "text-yellow-500" : "text-red-500"}`} />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {isTemporaryError ? "Servidor Temporariamente Indisponível" : "Link Inválido ou Expirado"}
          </h1>
          <p className="mt-2 text-gray-600">
            {isTemporaryError 
              ? "O servidor está se reiniciando. Clique abaixo para tentar novamente."
              : error}
          </p>
          {isTemporaryError && (
            <button
              onClick={() => loadSelectionData()}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Gerando Cronicas...</h1>
          <p className="mt-2 text-gray-600">
            Estamos usando IA para criar {selectedCount} cronica(s).
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Cronicas Geradas!</h1>
          <p className="mt-2 text-gray-600">
            {generationResult?.generatedCount} cronica(s) foram geradas!
          </p>
          <div className="mt-4 space-y-2 text-sm">
            {generationResult?.immediateCount ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Zap className="h-4 w-4" />
                <span>{generationResult.immediateCount} para publicacao imediata</span>
              </div>
            ) : null}
            {generationResult?.scheduledCount ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Calendar className="h-4 w-4" />
                <span>{generationResult.scheduledCount} agendada(s)</span>
              </div>
            ) : null}
          </div>
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              Um email foi enviado para aprovacao.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Selecao de Materias</h1>
              <p className="text-sm text-gray-500">M3Solutions - Modulo de Cronicas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Ola!</h2>
          <p className="mt-2 text-gray-600">
            Selecione as materias e configure quando cada uma sera publicada.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Este link expira em {data?.expiresAt && formatDateTime(data.expiresAt)}</span>
          </div>
        </div>

        {/* Selection Counter & Actions */}
        <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <span className="text-primary font-medium">
                {selectedCount} de {data?.articles.length || 0} materias selecionadas
              </span>
              {selectedCount > 0 && (
                <div className="text-sm text-primary mt-1">
                  {immediateCount} imediata(s) | {scheduledCount} agendada(s)
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={selectAll} className="text-sm text-primary hover:underline">
                  Selecionar todas
                </button>
                <span className="text-gray-400">|</span>
                <button onClick={deselectAll} className="text-sm text-primary hover:underline">
                  Limpar
                </button>
                <span className="text-gray-400">|</span>
                <button onClick={setAllImmediate} className="text-sm text-green-600 hover:underline">
                  Todas imediatas
                </button>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Check className="h-4 w-4" />
              Confirmar ({selectedCount})
            </button>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="space-y-4">
          {data?.articles.map((article) => {
            const selection = articleSelections[article.id];
            const isSelected = selection?.selected || false;
            const isExpanded = expandedArticle === article.id;

            return (
              <div
                key={article.id}
                className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-gray-200"
                }`}
              >
                {/* Article Header - Clickable */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleArticle(article.id)}
                >
                  <div className="flex gap-4">
                    {/* Selection Indicator */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "bg-primary border-primary text-white" : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>

                    {/* Article Image */}
                    {article.imageUrl && (
                      <div className="flex-shrink-0 w-24 h-16 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />
                      </div>
                    )}

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{article.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {article.site.name}
                        </span>
                        <span>{formatDate(article.collectedAt)}</span>
                        <a
                          href={article.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Original
                        </a>
                      </div>
                    </div>

                    {/* Expand/Collapse for scheduling */}
                    {isSelected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedArticle(isExpanded ? null : article.id); }}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    )}
                  </div>

                  {/* Quick Status Badge */}
                  {isSelected && !isExpanded && (
                    <div className="mt-3 ml-10">
                      {selection.publishOption === "immediate" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <Zap className="h-3 w-3" /> Publicacao imediata
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          <Calendar className="h-3 w-3" /> {selection.scheduledDate} as {selection.scheduledTime}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Scheduling Options - Expanded */}
                {isSelected && isExpanded && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="pt-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">Quando publicar esta cronica?</p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Immediate */}
                        <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer flex-1 ${
                          selection.publishOption === "immediate" ? "border-green-500 bg-green-50" : "border-gray-200"
                        }`}>
                          <input
                            type="radio"
                            name={`publish-${article.id}`}
                            checked={selection.publishOption === "immediate"}
                            onChange={() => updateArticleOption(article.id, "publishOption", "immediate")}
                          />
                          <Zap className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Imediata</span>
                        </label>

                        {/* Scheduled */}
                        <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer flex-1 ${
                          selection.publishOption === "scheduled" ? "border-primary bg-primary/5" : "border-gray-200"
                        }`}>
                          <input
                            type="radio"
                            name={`publish-${article.id}`}
                            checked={selection.publishOption === "scheduled"}
                            onChange={() => updateArticleOption(article.id, "publishOption", "scheduled")}
                          />
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Agendar</span>
                        </label>
                      </div>

                      {/* Date/Time inputs */}
                      {selection.publishOption === "scheduled" && (
                        <div className="flex gap-3 mt-2">
                          <input
                            type="date"
                            value={selection.scheduledDate}
                            min={getMinDate()}
                            onChange={(e) => updateArticleOption(article.id, "scheduledDate", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="time"
                            value={selection.scheduledTime}
                            onChange={(e) => updateArticleOption(article.id, "scheduledTime", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {data?.articles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Newspaper className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-500">Nenhuma materia disponivel para selecao.</p>
          </div>
        )}

        {/* Bottom Submit Button */}
        {(data?.articles.length ?? 0) > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0}
              className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
            >
              <Check className="h-5 w-5" />
              Confirmar Selecao ({selectedCount})
            </button>
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          M3Solutions. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
