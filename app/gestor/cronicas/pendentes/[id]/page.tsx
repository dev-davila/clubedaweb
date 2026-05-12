"use client";

import { useState, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Newspaper,
  Clock,
  Globe,
  ArrowLeft,
  Pencil,
  Share2,
  Tag,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Chronicle {
  id: string;
  title: string;
  content: string;
  featuredImage: string | null;
  sourceReference: string;
  status: string;
  publishToSocial: boolean;
  categoryId: string | null;
  createdAt: string;
  article: {
    id: string;
    title: string;
    excerpt: string;
    originalUrl: string;
    imageUrl: string | null;
    site: { name: string };
  };
  category: { id: string; name: string; color: string } | null;
  author: { name: string; avatarUrl: string | null } | null;
}

// Função para limpar conteúdo de markdown artifacts
function cleanContent(content: string): string {
  return content
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export default function ChronicleApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const chronicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [chronicle, setChronicle] = useState<Chronicle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Campos editáveis
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [publishToSocial, setPublishToSocial] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (chronicleId) {
      loadChronicle();
      loadCategories();
    }
  }, [chronicleId]);

  const loadChronicle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cronicas/${chronicleId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao carregar crônica");
      }

      setChronicle(result);
      setSelectedCategory(result.categoryId || "");
      setPublishToSocial(result.publishToSocial || false);
      setEditedTitle(result.title);
      setEditedContent(result.content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/gestor/categories");
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/cronicas/${chronicleId}/atualizar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory || null,
          publishToSocial
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar alterações");
      }

      const updated = await response.json();
      setChronicle(prev => prev ? { ...prev, ...updated } : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      
      // Primeiro salva as configurações
      await fetch(`/api/cronicas/${chronicleId}/atualizar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory || null,
          publishToSocial
        })
      });

      // Depois aprova
      const response = await fetch(`/api/cronicas/${chronicleId}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishNow: true })
      });

      if (!response.ok) {
        throw new Error("Erro ao aprovar crônica");
      }

      setSuccess("Crônica aprovada e publicada com sucesso!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Tem certeza que deseja rejeitar esta crônica?")) return;
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/cronicas/${chronicleId}/rejeitar`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Erro ao rejeitar crônica");
      }

      setSuccess("Crônica rejeitada.");
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
          <p className="mt-4 text-gray-600">Carregando crônica...</p>
        </div>
      </div>
    );
  }

  if (error && !chronicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Crônica Não Encontrada</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            href="/gestor/cronicas/pendentes"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Pendentes
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Sucesso!</h1>
          <p className="mt-2 text-gray-600">{success}</p>
          <Link
            href="/gestor/cronicas/pendentes"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Pendentes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/gestor/cronicas/pendentes"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Newspaper className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Aprovação de Crônica</h1>
                <p className="text-sm text-gray-500">M3Solutions - Módulo de Crônicas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Source Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-4">
            {chronicle?.article?.imageUrl && (
              <div className="flex-shrink-0 w-24 h-18 relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={chronicle.article.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Globe className="h-4 w-4" />
                <span>Matéria Original: {chronicle?.article?.site?.name}</span>
              </div>
              <h3 className="font-medium text-gray-700">{chronicle?.article?.title}</h3>
              <a
                href={chronicle?.article?.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Ver matéria original
              </a>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Configurações da Publicação
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecionar categoria...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Redes Sociais */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redes Sociais
              </label>
              <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={publishToSocial}
                  onChange={(e) => setPublishToSocial(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Publicar nas redes sociais</span>
                </div>
              </label>
            </div>
          </div>

          {/* Autor */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Autor: <strong>{chronicle?.author?.name || "Márcio Petito"}</strong></span>
          </div>
        </div>

        {/* Chronicle Content */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Chronicle Header */}
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {chronicle?.title}
            </h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {chronicle?.createdAt && format(new Date(chronicle.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              {chronicle?.category && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: chronicle.category.color + "20", 
                    color: chronicle.category.color 
                  }}
                >
                  {chronicle.category.name}
                </span>
              )}
            </div>
          </div>

          {/* Chronicle Body */}
          <div className="p-6">
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanContent(chronicle?.content || "")) }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition"
          >
            <X className="h-5 w-5" />
            Rejeitar Crônica
          </button>
          
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg transition"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            Aprovar e Publicar
          </button>
        </div>

        {!selectedCategory && (
          <p className="text-center mt-3 text-sm text-amber-600">
            Recomendamos selecionar uma categoria antes de aprovar.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} M3Solutions. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
