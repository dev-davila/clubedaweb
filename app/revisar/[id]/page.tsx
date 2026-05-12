"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle, Clock, User, Tag, FileText, Sparkles, ArrowLeft, Send, MessageSquare, Calendar, Zap } from "lucide-react";

interface ReviewPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  featuredImage: string | null;
  secondaryImage: string | null;
  imageAlt: string | null;
  status: string;
  category: { name: string; color: string } | null;
  author: { name: string; avatar: string | null } | null;
  tags: string[];
  createdBy: { name: string | null; email: string } | null;
  createdAt: string;
  briefCta: string | null;
  briefPersona: string | null;
  aiGenerated: boolean;
}

function getMinDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export default function ReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const token = searchParams?.get("token") || "";

  const [post, setPost] = useState<ReviewPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<{ type: string; message: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [publishOption, setPublishOption] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState(getMinDate());
  const [scheduledTime, setScheduledTime] = useState("09:00");

  useEffect(() => {
    if (!id || !token) return;
    fetchPost();
  }, [id, token]);

  async function fetchPost() {
    try {
      setLoading(true);
      const res = await fetch(`/api/revisar/${id}?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao carregar post");
      }
      const data = await res.json();
      setPost(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "approve" | "reject") {
    if (!post) return;

    // Validar agendamento
    let scheduledFor: string | null = null;
    if (action === "approve" && publishOption === "scheduled") {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (dateTime <= new Date()) {
        alert("A data de agendamento deve ser no futuro.");
        return;
      }
      scheduledFor = dateTime.toISOString();
    }

    setActionLoading(action);
    try {
      const res = await fetch(`/api/revisar/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          feedback: action === "reject" ? feedback : undefined,
          scheduledFor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar");
      setActionDone({
        type: action,
        message: data.message,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Token de revisão não fornecido. Verifique o link enviado por email.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-gray-600">Carregando pauta para revisão...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (actionDone) {
    const isScheduled = actionDone.type === "approve" && publishOption === "scheduled";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          {actionDone.type === "approve" ? (
            isScheduled ? (
              <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            )
          ) : (
            <ArrowLeft className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {actionDone.type === "approve"
              ? isScheduled
                ? "Pauta Aprovada e Agendada!"
                : "Pauta Aprovada!"
              : "Pauta Devolvida"}
          </h1>
          <p className="text-gray-600 mb-6">{actionDone.message}</p>
          {isScheduled && (
            <div className="bg-primary/5 border border-primary/30 rounded-lg p-3 mb-4 text-sm text-primary">
              <Calendar className="w-4 h-4 inline mr-1" />
              Publicação agendada para {scheduledDate.split("-").reverse().join("/")} às {scheduledTime}
            </div>
          )}
          <p className="text-sm text-gray-400">
            {actionDone.type === "approve"
              ? isScheduled
                ? "A equipe da M3Solutions foi notificada. A pauta será publicada na data agendada."
                : "A equipe da M3Solutions foi notificada e a pauta será publicada em breve."
              : "A equipe foi notificada e fará os ajustes necessários."}
          </p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isReview = post.status === "REVIEW";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white font-bold rounded-lg px-3 py-1.5 text-sm">M3</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Revisão de Pauta</p>
              <p className="text-xs text-gray-500">M3Solutions</p>
            </div>
          </div>
          {isReview && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Solicitar Ajustes
              </button>
              <button
                onClick={() => handleAction("approve")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading === "approve" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : publishOption === "scheduled" ? (
                  <Calendar size={16} />
                ) : (
                  <CheckCircle size={16} />
                )}
                {publishOption === "scheduled" ? "Aprovar e Agendar" : "Aprovar Pauta"}
              </button>
            </div>
          )}
          {!isReview && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              Status: {post.status === "APPROVED" ? "Aprovada" : post.status === "PUBLISHED" ? "Publicada" : post.status}
            </span>
          )}
        </div>
      </header>

      {/* Reject feedback modal */}
      {showRejectForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare size={20} className="text-orange-500" />
              Solicitar Ajustes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Descreva o que precisa ser alterado para que a equipe possa ajustar a pauta.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex: O título precisa ser mais direto, incluir menção ao produto X, ajustar o tom para ser mais técnico..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none h-32"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  handleAction("reject");
                }}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm disabled:opacity-50"
              >
                <Send size={16} />
                Enviar Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Status banner */}
        {isReview && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              <strong>Aguardando sua revisão.</strong> Revise o conteúdo abaixo e clique em &quot;Aprovar Pauta&quot; ou &quot;Solicitar Ajustes&quot;.
            </p>
          </div>
        )}

        {!isReview && (
          <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-primary">
              Esta pauta já foi processada. Status atual: <strong>{post.status === "APPROVED" ? "Aprovada" : post.status === "PUBLISHED" ? "Publicada" : post.status}</strong>.
            </p>
          </div>
        )}

        {/* Post metadata */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {post.category && (
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: post.category.color + "20", color: post.category.color }}>
                {post.category.name}
              </span>
            )}
            {post.aiGenerated && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                <Sparkles size={12} /> Gerado por IA
              </span>
            )}
            {post.tags.length > 0 && post.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 flex items-center gap-1">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>

          {post.excerpt && (
            <p className="text-gray-600 text-lg leading-relaxed mb-4">{post.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {post.author && (
              <div className="flex items-center gap-2">
                <User size={14} /> {post.author.name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={14} /> {new Date(post.createdAt).toLocaleDateString("pt-BR")}
            </div>
            {post.createdBy && (
              <div className="flex items-center gap-2">
                <FileText size={14} /> Criado por {post.createdBy.name || post.createdBy.email}
              </div>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Imagem Destacada</h3>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.featuredImage}
                alt={post.imageAlt || post.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            {post.imageAlt && <p className="text-xs text-gray-400 mt-2">Alt: {post.imageAlt}</p>}
          </div>
        )}

        {/* Secondary Image */}
        {post.secondaryImage && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Segunda Imagem</h3>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.secondaryImage}
                alt="Imagem secundária"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* Post content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">Conteúdo</h3>
          {post.contentHtml ? (
            <div
              className="prose prose-lg max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentHtml) }}
            />
          ) : post.content ? (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{post.content}</div>
          ) : (
            <p className="text-gray-400 italic">Conteúdo não disponível.</p>
          )}
        </div>

        {/* SEO Info */}
        {(post.metaTitle || post.metaDescription) && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">SEO</h3>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-primary text-lg font-medium mb-1">{post.metaTitle || post.title}</p>
              <p className="text-green-700 text-sm mb-1">m3solutions.com.br/noticias/{post.slug}</p>
              <p className="text-gray-600 text-sm">{post.metaDescription || post.excerpt}</p>
            </div>
            {post.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.keywords.map((kw) => (
                  <span key={kw} className="text-xs bg-primary/5 text-primary px-2 py-1 rounded">{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brief info */}
        {(post.briefPersona || post.briefCta) && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Direcionamento</h3>
            {post.briefPersona && (
              <p className="text-sm text-gray-600 mb-2"><strong>Público-alvo:</strong> {post.briefPersona}</p>
            )}
            {post.briefCta && (
              <p className="text-sm text-gray-600"><strong>Call to Action:</strong> {post.briefCta}</p>
            )}
          </div>
        )}

        {/* Scheduling + Action buttons (bottom) */}
        {isReview && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            {/* Quando publicar? */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/30">
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Quando publicar?
              </p>
              <div className="flex flex-wrap gap-3">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition ${
                  publishOption === "immediate" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
                }`}>
                  <input
                    type="radio"
                    name="publishOption"
                    checked={publishOption === "immediate"}
                    onChange={() => setPublishOption("immediate")}
                    className="accent-green-600"
                  />
                  <Zap size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-gray-800">Imediata</span>
                </label>

                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition ${
                  publishOption === "scheduled" ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                }`}>
                  <input
                    type="radio"
                    name="publishOption"
                    checked={publishOption === "scheduled"}
                    onChange={() => setPublishOption("scheduled")}
                    className="accent-blue-600"
                  />
                  <Calendar size={16} className="text-primary" />
                  <span className="text-sm font-medium text-gray-800">Agendar</span>
                </label>

                {publishOption === "scheduled" && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduledDate}
                      min={getMinDate()}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleAction("approve")}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
              >
                {actionLoading === "approve" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : publishOption === "scheduled" ? (
                  <Calendar size={18} />
                ) : (
                  <CheckCircle size={18} />
                )}
                {publishOption === "scheduled" ? "Aprovar e Agendar" : "Aprovar Pauta"}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition disabled:opacity-50 font-medium"
              >
                {actionLoading === "reject" ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                Solicitar Ajustes
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 text-center">
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} M3Solutions - Revisão de Conteúdo</p>
      </footer>
    </div>
  );
}
