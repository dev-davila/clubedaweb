"use client";

import { useState, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import Link from "next/link";
import { FileText, Loader2, Pencil, Check, X, Clock, Sparkles, ExternalLink, Eye, CheckCircle, Send, Mail, Share2 } from "lucide-react";
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
  createdAt: string;
  publishToSocial: boolean;
  categoryId: string | null;
  article: {
    title: string;
    originalUrl: string;
    site: { name: string };
  };
  category: { id: string; name: string; color: string } | null;
  author: { name: string } | null;
}

interface SendEmailResult {
  success: boolean;
  chroniclesCount: number;
  emailsSent: number;
  emailsFailed: number;
  recipients: string[];
  message: string;
  error?: string;
}

// Função para limpar conteúdo de markdown artifacts
function cleanContent(content: string): string {
  return content
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export default function PendentesPage() {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewingChronicle, setViewingChronicle] = useState<Chronicle | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<SendEmailResult | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchChronicles = async () => {
    try {
      const res = await fetch("/api/cronicas/pendentes");
      const data = await res.json();
      setChronicles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/gestor/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchChronicles();
    fetchCategories();
  }, []);

  const handleUpdateChronicle = async (id: string, field: string, value: any) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/cronicas/${id}/atualizar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setChronicles(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  const handleApprove = async (id: string, publishNow: boolean) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/cronicas/${id}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishNow })
      });
      if (!res.ok) throw new Error("Erro ao aprovar");
      fetchChronicles();
    } catch (error) {
      alert("Erro ao aprovar crônica");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tem certeza que deseja rejeitar esta crônica?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/cronicas/${id}/rejeitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejeitado pelo usuário" })
      });
      if (!res.ok) throw new Error("Erro ao rejeitar");
      fetchChronicles();
    } catch (error) {
      alert("Erro ao rejeitar crônica");
    } finally {
      setProcessing(null);
    }
  };

  const handleSendForApproval = async () => {
    if (!confirm(`Enviar ${chronicles.length} crônica(s) por email para aprovação do cliente?`)) return;
    
    setSendingEmail(true);
    setEmailResult(null);
    
    try {
      const res = await fetch("/api/cronicas/enviar-para-aprovacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar email");
      }
      
      setEmailResult(data);
    } catch (error: any) {
      setEmailResult({
        success: false,
        chroniclesCount: 0,
        emailsSent: 0,
        emailsFailed: 0,
        recipients: [],
        message: "",
        error: error.message
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crônicas Pendentes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Revise, edite e aprove as crônicas geradas pela IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          {chronicles.length > 0 && (
            <>
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-medium">
                {chronicles.length} crônica(s) aguardando aprovação
              </div>
              <button
                onClick={handleSendForApproval}
                disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar para Cliente
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Resultado do envio de email */}
      {emailResult && (
        <div className={`rounded-xl p-4 ${emailResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {emailResult.success ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <X className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              {emailResult.success ? (
                <>
                  <p className="text-green-800 font-medium">Email enviado com sucesso!</p>
                  <p className="text-green-600 text-sm mt-1">
                    {emailResult.chroniclesCount} crônica(s) enviada(s) para {emailResult.emailsSent} destinatário(s):
                  </p>
                  <ul className="text-green-600 text-sm mt-2 list-disc list-inside">
                    {emailResult.recipients.map(email => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-red-800 font-medium">Erro ao enviar email</p>
                  <p className="text-red-600 text-sm mt-1">{emailResult.error}</p>
                </>
              )}
            </div>
            <button
              onClick={() => setEmailResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {chronicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma crônica pendente de revisão</p>
          <Link href="/gestor/cronicas/materias" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Ver matérias disponíveis para gerar crônicas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {chronicles.map((chronicle) => (
            <div key={chronicle.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                {chronicle.featuredImage && (
                  <img
                    src={chronicle.featuredImage}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">{chronicle.article.site.name}</span>
                    <a
                      href={chronicle.article.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{chronicle.title}</h3>
                  <div
                    className="text-sm text-gray-600 line-clamp-3 prose prose-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanContent(chronicle.content).substring(0, 300) + "...") }}
                  />
                  
                  {/* Linha de configurações */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                    {/* Dropdown Categoria */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Categoria:</label>
                      <select
                        value={chronicle.categoryId || ""}
                        onChange={(e) => handleUpdateChronicle(chronicle.id, "categoryId", e.target.value || null)}
                        disabled={updating === chronicle.id}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="">Sem categoria</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Checkbox Redes Sociais */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chronicle.publishToSocial || false}
                        onChange={(e) => handleUpdateChronicle(chronicle.id, "publishToSocial", e.target.checked)}
                        disabled={updating === chronicle.id}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Share2 size={12} />
                        Postar nas redes sociais
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    {chronicle.category && (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: chronicle.category.color + "20", color: chronicle.category.color }}
                      >
                        {chronicle.category.name}
                      </span>
                    )}
                    <span>{chronicle.author?.name || "Márcio Petito"}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(chronicle.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    {chronicle.publishToSocial && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Share2 size={12} />
                        Será postado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {/* Botão Visualizar */}
                  <button
                    onClick={() => setViewingChronicle(chronicle)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    <Eye size={14} />
                    Visualizar
                  </button>
                  {/* Botão Editar */}
                  <Link
                    href={`/gestor/cronicas/pendentes/${chronicle.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Pencil size={14} />
                    Editar
                  </Link>
                  {/* Botão Aprovar */}
                  <button
                    onClick={() => handleApprove(chronicle.id, true)}
                    disabled={processing === chronicle.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {processing === chronicle.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                    Aprovar e Publicar
                  </button>
                  {/* Botão Rejeitar */}
                  <button
                    onClick={() => handleReject(chronicle.id)}
                    disabled={processing === chronicle.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                  >
                    <X size={14} />
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Visualização */}
      {viewingChronicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm mb-1">Fonte: {viewingChronicle.article.site.name}</p>
                  <h2 className="text-xl font-bold">{viewingChronicle.title}</h2>
                </div>
                <button
                  onClick={() => setViewingChronicle(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {viewingChronicle.featuredImage && (
                <img
                  src={viewingChronicle.featuredImage}
                  alt=""
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
              )}
              
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                {viewingChronicle.category && (
                  <span
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: viewingChronicle.category.color + "20", color: viewingChronicle.category.color }}
                  >
                    {viewingChronicle.category.name}
                  </span>
                )}
                <span>Por {viewingChronicle.author?.name || "Márcio Petito"}</span>
                <span>{format(new Date(viewingChronicle.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              </div>

              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanContent(viewingChronicle.content)) }}
              />

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  <strong>Matéria original:</strong>{" "}
                  <a
                    href={viewingChronicle.article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {viewingChronicle.article.title}
                  </a>
                </p>
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setViewingChronicle(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Fechar
              </button>
              <div className="flex gap-3">
                <Link
                  href={`/gestor/cronicas/pendentes/${viewingChronicle.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  <Pencil size={16} />
                  Editar
                </Link>
                <button
                  onClick={() => {
                    handleApprove(viewingChronicle.id, true);
                    setViewingChronicle(null);
                  }}
                  disabled={processing === viewingChronicle.id}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {processing === viewingChronicle.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Aprovar e Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
