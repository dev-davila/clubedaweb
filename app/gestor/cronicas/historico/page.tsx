"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Loader2,
  ExternalLink,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  RefreshCw,
  Share2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Chronicle {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  linkedinPostUrl: string | null;
  twitterPostUrl: string | null;
  facebookPostUrl: string | null;
  instagramPostUrl: string | null;
  article: {
    id: string;
    title: string;
    originalUrl: string;
    site: { id: string; name: string };
  };
  category: { id: string; name: string } | null;
  author: { id: string; name: string } | null;
  blogPost: { id: string; slug: string; title: string } | null;
}

export default function HistoricoPage() {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [republishing, setRepublishing] = useState<string | null>(null);
  const [republishResult, setRepublishResult] = useState<{
    chronicleId: string;
    success: boolean;
    message: string;
  } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  useEffect(() => {
    loadHistory(1);
  }, []);

  const handleRepublish = async (chronicleId: string, platforms?: string[]) => {
    try {
      setRepublishing(chronicleId);
      setRepublishResult(null);
      
      const response = await fetch(`/api/cronicas/${chronicleId}/republicar-social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRepublishResult({
          chronicleId,
          success: true,
          message: data.message
        });
        // Recarregar para atualizar os ícones
        setTimeout(() => loadHistory(pagination.page), 1500);
      } else {
        setRepublishResult({
          chronicleId,
          success: false,
          message: data.error || "Erro ao republicar"
        });
      }
    } catch (error) {
      setRepublishResult({
        chronicleId,
        success: false,
        message: "Erro de conexão"
      });
    } finally {
      setRepublishing(null);
    }
  };

  const loadHistory = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cronicas/historico?page=${page}&limit=20`);
      const data = await response.json();
      setChronicles(data.chronicles);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (chronicle: Chronicle) => {
    const status = chronicle.status;
    const badges: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      published: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2, label: "Publicada" },
      approved: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle2, label: "Aprovada" },
      scheduled: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock, label: "Agendada" }
    };
    const badge = badges[status] || { bg: "bg-gray-100", text: "text-gray-700", icon: AlertCircle, label: status };
    const Icon = badge.icon;

    // Para status "scheduled", mostrar data de agendamento
    if (status === "scheduled" && chronicle.scheduledFor) {
      const scheduledDate = new Date(chronicle.scheduledFor);
      const now = new Date();
      const isPast = scheduledDate < now;
      return (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
            <Icon className="h-3 w-3" />
            {badge.label}
          </span>
          <span className={`text-[11px] font-medium ${isPast ? "text-red-600" : "text-amber-600"}`}>
            {isPast ? "⚠️ " : "📅 "}
            {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          {isPast && (
            <span className="text-[10px] text-red-500 font-medium">
              Deveria ter publicado
            </span>
          )}
        </div>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/gestor/cronicas" className="hover:text-blue-600">Crônicas</Link>
          <span>/</span>
          <span>Histórico</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Histórico de Crônicas</h1>
              <p className="text-gray-600">Crônicas publicadas, aprovadas e agendadas</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {pagination.total} crônica(s) no total
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : chronicles.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <History className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma crônica no histórico</h3>
          <p className="mt-2 text-gray-500">As crônicas publicadas aparecerão aqui.</p>
        </div>
      ) : (
        <>
          {/* Chronicles List */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crônica</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fonte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Redes Sociais</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {chronicles.map((chronicle) => {
                    const socialLinks = [
                      { platform: "linkedin", url: chronicle.linkedinPostUrl, icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-100" },
                      { platform: "twitter", url: chronicle.twitterPostUrl, icon: Twitter, color: "text-sky-500", bgColor: "bg-sky-100" },
                      { platform: "facebook", url: chronicle.facebookPostUrl, icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-100" },
                      { platform: "instagram", url: chronicle.instagramPostUrl, icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-100" }
                    ];
                    const publishedLinks = socialLinks.filter(s => s.url);

                    return (
                      <tr key={chronicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 line-clamp-1">{chronicle.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {chronicle.content.substring(0, 100)}...
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{chronicle.article.site.name}</p>
                            <a
                              href={chronicle.article.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver original
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {chronicle.category ? (
                            <span className="text-sm text-gray-700">{chronicle.category.name}</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(chronicle)}
                        </td>
                        <td className="px-4 py-4">
                          {publishedLinks.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {publishedLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                  <a
                                    key={link.platform}
                                    href={link.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-1.5 rounded-lg ${link.bgColor} ${link.color} hover:opacity-80 transition-opacity`}
                                    title={`Ver no ${link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </a>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Não publicado</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            {chronicle.publishedAt ? (
                              <div>
                                <span className="text-gray-700 font-medium">
                                  {format(new Date(chronicle.publishedAt), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="block text-[10px] text-green-600">Publicado</span>
                              </div>
                            ) : chronicle.status === "scheduled" && chronicle.scheduledFor ? (
                              <div>
                                <span className="text-amber-700 font-medium">
                                  {format(new Date(chronicle.scheduledFor), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="block text-[10px] text-amber-600">Agendado</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-gray-500">
                                  {format(new Date(chronicle.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="block text-[10px] text-gray-400">Criado</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {chronicle.blogPost ? (
                              <Link
                                href={`/noticias/${chronicle.blogPost.slug}`}
                                target="_blank"
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver no blog"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            ) : (
                              <span className="p-2 text-gray-300" title="Ainda não publicada no blog">
                                <Eye className="h-4 w-4" />
                              </span>
                            )}
                            
                            {/* Botão Republicar - só aparece se falta alguma rede */}
                            {chronicle.blogPost && publishedLinks.length < 4 && (
                              <button
                                onClick={() => handleRepublish(chronicle.id)}
                                disabled={republishing === chronicle.id}
                                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Republicar nas redes que faltam"
                              >
                                {republishing === chronicle.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Share2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {/* Resultado da republicação */}
                          {republishResult?.chronicleId === chronicle.id && (
                            <div className={`mt-1 text-xs px-2 py-1 rounded ${
                              republishResult.success 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }`}>
                              {republishResult.message}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadHistory(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => loadHistory(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
