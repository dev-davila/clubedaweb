"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Newspaper,
  Clock,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string | null;
  publishedAt: string;
  status: string;
}

interface SelectionData {
  recipientName: string;
  recipientEmail: string;
  expiresAt: string;
  articles: Article[];
  maxSelections: number;
}

export default function SelectionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<SelectionData | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

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
      // Pre-select articles that are already selected
      const preSelected = result.articles
        .filter((a: Article) => a.status === "selected")
        .map((a: Article) => a.id);
      setSelectedArticles(preSelected);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleArticle = (articleId: string) => {
    if (selectedArticles.includes(articleId)) {
      setSelectedArticles(selectedArticles.filter(id => id !== articleId));
    } else {
      if (data && selectedArticles.length >= data.maxSelections) {
        alert(`Você pode selecionar no máximo ${data.maxSelections} matérias.`);
        return;
      }
      setSelectedArticles([...selectedArticles, articleId]);
    }
  };

  const [generationResult, setGenerationResult] = useState<{
    generatedCount: number;
    message: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (selectedArticles.length === 0) {
      alert("Selecione pelo menos uma matéria.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/cronicas/selecao/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: selectedArticles })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar seleção");
      }

      setGenerationResult({
        generatedCount: result.generatedCount || selectedArticles.length,
        message: result.message || "Crônicas geradas com sucesso!"
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
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
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
          {isTemporaryError ? (
            <button
              onClick={() => loadSelectionData()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Se você acredita que isso é um erro, entre em contato com o administrador.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Gerando Crônicas...</h1>
          <p className="mt-2 text-gray-600">
            Estamos usando IA para criar {selectedArticles.length} crônica(s) baseadas nas matérias selecionadas.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Isso pode levar alguns segundos. Por favor, aguarde...
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
          <h1 className="mt-4 text-xl font-bold text-gray-900">Crônicas Geradas!</h1>
          <p className="mt-2 text-gray-600">
            {generationResult?.generatedCount || selectedArticles.length} crônica(s) foram geradas com sucesso!
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Um email foi enviado com as crônicas para revisão e aprovação.
          </p>
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ As crônicas estão aguardando aprovação no painel do gestor.
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Seleção de Matérias</h1>
              <p className="text-sm text-gray-500">M3Solutions - Módulo de Crônicas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Olá, {data?.recipientName}!</h2>
          <p className="mt-2 text-gray-600">
            Selecione as matérias que você deseja transformar em crônicas. 
            Você pode escolher até <strong>{data?.maxSelections}</strong> matérias.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              Este link expira em{" "}
              {data?.expiresAt && format(new Date(data.expiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Selection Counter */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-blue-700 font-medium">
              {selectedArticles.length} de {data?.maxSelections} matérias selecionadas
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedArticles.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirmar Seleção
          </button>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-4">
          {data?.articles.map((article) => {
            const isSelected = selectedArticles.includes(article.id);
            return (
              <div
                key={article.id}
                onClick={() => toggleArticle(article.id)}
                className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex gap-4">
                  {/* Selection Indicator */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300"
                  }`}>
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>

                  {/* Article Image */}
                  {article.imageUrl && (
                    <div className="flex-shrink-0 w-32 h-24 relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Article Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {article.sourceName}
                      </span>
                      <span>
                        {format(new Date(article.publishedAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver original
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data?.articles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Newspaper className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-500">Nenhuma matéria disponível para seleção.</p>
          </div>
        )}

        {/* Bottom Submit Button */}
        {(data?.articles.length ?? 0) > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedArticles.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Confirmar Seleção ({selectedArticles.length})
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} M3Solutions. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
