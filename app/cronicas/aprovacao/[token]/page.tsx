"use client";

import { useState, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { SITE_BASE_URL } from "@/lib/constants";
import { useParams } from "next/navigation";
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
  Globe,
  Share2,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  Calendar,
  Zap,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Eye
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
  scheduledFor: string | null;
  articleId: string;
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

interface SocialAccount {
  platform: string;
  username: string | null;
}

interface ApprovalData {
  chronicles: Chronicle[];
  categories: Category[];
  expiresAt: string;
  socialAccounts: SocialAccount[];
}

interface ChronicleSettings {
  categoryId: string;
  publishToSocial: boolean;
  publishOption: "immediate" | "scheduled";
  scheduledDate: string;
  scheduledTime: string;
  showPreview: boolean;
}

function cleanContent(content: string): string {
  return content
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getMinDate(): string {
  // Permite agendar para o mesmo dia (data atual)
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Social Media Preview Component
function SocialMediaPreview({ 
  chronicle, 
  onClose 
}: { 
  chronicle: Chronicle; 
  onClose: () => void;
}) {
  const cleanedContent = stripHtml(cleanContent(chronicle.content));
  const excerpt = cleanedContent.substring(0, 200) + (cleanedContent.length > 200 ? '...' : '');
  const imageUrl = chronicle.featuredImage || chronicle.article?.imageUrl || '/images/blog-default.jpg';
  const siteUrl = SITE_BASE_URL;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-xl border-2 border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview das Redes Sociais
        </h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* LinkedIn Preview */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-[#0A66C2] text-white flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            <span className="font-medium text-sm">LinkedIn</span>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-sm">M3Solutions</div>
                <div className="text-xs text-gray-500">Tecnologia & Seguranca</div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3 line-clamp-3">{excerpt}</p>
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video relative bg-gray-100">
                <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="p-2 bg-gray-50 border-t">
                <div className="text-xs text-gray-500 truncate">{siteUrl}</div>
                <div className="font-medium text-sm text-gray-900 line-clamp-2">{chronicle.title}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Twitter/X Preview */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-black text-white flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            <span className="font-medium text-sm">X (Twitter)</span>
          </div>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm">M3Solutions</span>
                  <span className="text-gray-500 text-sm">@m3solutions</span>
                </div>
                <p className="text-sm text-gray-900 mt-1 line-clamp-3">
                  {excerpt.substring(0, 140)}...
                </p>
                <div className="mt-2 border rounded-xl overflow-hidden">
                  <div className="aspect-video relative bg-gray-100">
                    <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-2 border-t">
                    <div className="text-xs text-gray-500 truncate">{siteUrl}</div>
                    <div className="text-sm text-gray-900 line-clamp-1">{chronicle.title}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facebook Preview */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-[#1877F2] text-white flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            <span className="font-medium text-sm">Facebook</span>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-sm">M3Solutions</div>
                <div className="text-xs text-gray-500">Patrocinado</div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{excerpt}</p>
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video relative bg-gray-100">
                <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="p-3 bg-gray-50 border-t">
                <div className="text-xs text-gray-500 uppercase">{siteUrl.replace('https://', '')}</div>
                <div className="font-medium text-gray-900 mt-1">{chronicle.title}</div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-1">{excerpt.substring(0, 80)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Preview */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            <span className="font-medium text-sm">Instagram</span>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="font-medium text-sm">m3solutions</div>
            </div>
            <div className="aspect-square relative bg-gray-100 rounded-md overflow-hidden">
              <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-900">
                <span className="font-medium">m3solutions</span>{" "}
                <span className="line-clamp-2">{excerpt.substring(0, 100)}...</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">#tecnologia #seguranca #ti</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        * Preview ilustrativo. O visual final pode variar conforme a plataforma.
      </p>
    </div>
  );
}

export default function ApprovalPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApprovalData | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedChronicle, setExpandedChronicle] = useState<string | null>(null);
  const [chronicleSettings, setChronicleSettings] = useState<{ [key: string]: ChronicleSettings }>({});
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [editingChronicle, setEditingChronicle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; content: string }>({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/cronicas/aprovacao/${token}`);
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          return loadData(attempt + 1);
        }
        throw new Error("O servidor está temporariamente indisponível. Tente novamente em alguns segundos.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao carregar dados");
      }

      setData(result);
      
      // Inicializar configurações
      const settings: { [key: string]: ChronicleSettings } = {};
      result.chronicles.forEach((c: Chronicle) => {
        // Se já tem scheduledFor, usar agendado
        const hasSchedule = c.scheduledFor && new Date(c.scheduledFor) > new Date();
        settings[c.id] = {
          categoryId: c.categoryId || "",
          publishToSocial: c.publishToSocial || false,
          publishOption: hasSchedule ? "scheduled" : "immediate",
          scheduledDate: hasSchedule ? c.scheduledFor!.split("T")[0] : getMinDate(),
          scheduledTime: hasSchedule ? c.scheduledFor!.split("T")[1].substring(0, 5) : "09:00",
          showPreview: false
        };
      });
      setChronicleSettings(settings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (chronicleId: string, field: string, value: any) => {
    setChronicleSettings(prev => ({
      ...prev,
      [chronicleId]: { ...prev[chronicleId], [field]: value }
    }));

    // Não salvar preview ou publishOption no servidor ainda
    if (field === "showPreview" || field === "publishOption" || field === "scheduledDate" || field === "scheduledTime") {
      return;
    }

    // Salvar no servidor
    try {
      await fetch(`/api/cronicas/aprovacao/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chronicleId,
          action: "update",
          [field]: value
        })
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const handleApprove = async (chronicleId: string) => {
    const settings = chronicleSettings[chronicleId];
    
    // Validar agendamento
    let scheduledFor: string | null = null;
    if (settings.publishOption === "scheduled") {
      const dateTime = new Date(`${settings.scheduledDate}T${settings.scheduledTime}:00`);
      if (dateTime <= new Date()) {
        alert("A data de agendamento deve ser no futuro.");
        return;
      }
      scheduledFor = dateTime.toISOString();
    }

    setProcessing(chronicleId);
    try {
      const response = await fetch(`/api/cronicas/aprovacao/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chronicleId,
          action: "approve",
          categoryId: settings?.categoryId || null,
          publishToSocial: settings?.publishToSocial || false,
          scheduledFor
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Erro ao aprovar");
      }

      setApprovedCount(prev => prev + 1);
      setData(prev => prev ? {
        ...prev,
        chronicles: prev.chronicles.filter(c => c.id !== chronicleId)
      } : null);
    } catch (err: any) {
      alert("Erro ao aprovar: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const startEditing = (chronicle: Chronicle) => {
    setEditingChronicle(chronicle.id);
    setEditForm({
      title: chronicle.title,
      content: cleanContent(chronicle.content)
    });
    setExpandedChronicle(chronicle.id);
  };

  const cancelEditing = () => {
    setEditingChronicle(null);
    setEditForm({ title: "", content: "" });
  };

  const saveEdit = async (chronicleId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cronicas/aprovacao/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chronicleId,
          action: "update",
          title: editForm.title,
          content: editForm.content
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar");
      }

      setData(prev => prev ? {
        ...prev,
        chronicles: prev.chronicles.map(c => 
          c.id === chronicleId 
            ? { ...c, title: editForm.title, content: editForm.content }
            : c
        )
      } : null);

      setEditingChronicle(null);
      setEditForm({ title: "", content: "" });
    } catch (err: any) {
      alert("Erro ao salvar alteracoes: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (chronicleId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar esta cronica?")) return;
    
    setProcessing(chronicleId);
    try {
      const response = await fetch(`/api/cronicas/aprovacao/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chronicleId, action: "reject" })
      });

      if (!response.ok) {
        throw new Error("Erro ao rejeitar");
      }

      setRejectedCount(prev => prev + 1);
      setData(prev => prev ? {
        ...prev,
        chronicles: prev.chronicles.filter(c => c.id !== chronicleId)
      } : null);
    } catch (err: any) {
      alert("Erro ao rejeitar: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando cronicas...</p>
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
              onClick={() => loadData()}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data || data.chronicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Tudo Revisado!</h1>
          <p className="mt-2 text-gray-600">
            {approvedCount > 0 || rejectedCount > 0 ? (
              <>
                Voce aprovou <strong>{approvedCount}</strong> e rejeitou <strong>{rejectedCount}</strong> cronica(s).
              </>
            ) : (
              "Nao ha cronicas pendentes de aprovacao."
            )}
          </p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Aprovacao de Cronicas</h1>
              <p className="text-sm text-gray-500">M3Solutions - Modulo de Cronicas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {data.chronicles.length} cronica(s) pendente(s)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Revise cada cronica, defina categoria, agendamento e se sera publicada nas redes sociais.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Clock className="h-4 w-4" />
              <span>Link expira em {format(new Date(data.expiresAt), "dd/MM 'as' HH:mm", { locale: ptBR })}</span>
            </div>
          </div>

          {/* Redes Sociais Configuradas */}
          {data.socialAccounts && data.socialAccounts.length > 0 ? (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Redes sociais conectadas:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.socialAccounts.map((acc, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-full text-xs border">
                    {acc.platform === "linkedin" && <Linkedin className="h-3 w-3 text-[#0A66C2]" />}
                    {acc.platform === "twitter" && <Twitter className="h-3 w-3 text-black" />}
                    {acc.platform === "facebook" && <Facebook className="h-3 w-3 text-[#1877F2]" />}
                    {acc.platform === "instagram" && <Instagram className="h-3 w-3 text-[#E4405F]" />}
                    <span className="capitalize">{acc.platform}</span>
                    {acc.username && <span className="text-gray-500">@{acc.username}</span>}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Nenhuma rede social configurada. Publicar nas redes sociais nao tera efeito.
              </p>
            </div>
          )}

          {(approvedCount > 0 || rejectedCount > 0) && (
            <div className="mt-4 flex gap-4 text-sm">
              {approvedCount > 0 && (
                <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full">{approvedCount} aprovada(s)</span>
              )}
              {rejectedCount > 0 && (
                <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full">{rejectedCount} rejeitada(s)</span>
              )}
            </div>
          )}
        </div>

        {/* Chronicles List */}
        <div className="space-y-4">
          {data.chronicles.map((chronicle) => {
            const isExpanded = expandedChronicle === chronicle.id;
            const settings = chronicleSettings[chronicle.id] || { 
              categoryId: "", 
              publishToSocial: false, 
              publishOption: "immediate",
              scheduledDate: getMinDate(),
              scheduledTime: "09:00",
              showPreview: false
            };

            return (
              <div key={chronicle.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start gap-4">
                    {chronicle.article?.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-14 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image src={chronicle.article.imageUrl} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Globe className="h-3 w-3" />
                        <span>{chronicle.article?.site?.name}</span>
                        <a
                          href={chronicle.article?.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Original
                        </a>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                        {chronicle.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setExpandedChronicle(isExpanded ? null : chronicle.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Content Preview / Edit Form */}
                <div className="p-4">
                  {editingChronicle === chronicle.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conteudo</label>
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEditing} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(chronicle.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`prose prose-sm max-w-none text-gray-700 ${!isExpanded ? 'line-clamp-4' : ''}`}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanContent(chronicle.content)) }}
                      />
                      {!isExpanded && (
                        <button
                          onClick={() => setExpandedChronicle(chronicle.id)}
                          className="text-primary text-sm mt-2 hover:underline"
                        >
                          Ver conteudo completo...
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Settings */}
                <div className="px-4 py-4 bg-primary/5 border-t border-primary/20 space-y-4">
                  {/* Row 1: Categoria e Autor */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <select
                        value={settings.categoryId}
                        onChange={(e) => updateSetting(chronicle.id, "categoryId", e.target.value)}
                        className="text-sm px-3 py-1.5 border border-primary/30 rounded-lg bg-white"
                      >
                        <option value="">Selecionar categoria...</option>
                        {data.categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Por {chronicle.author?.name || "Márcio Petito"}</span>
                    </div>
                  </div>

                  {/* Row 2: Agendamento */}
                  <div className="p-3 bg-white rounded-lg border border-primary/30">
                    <p className="text-sm font-medium text-gray-700 mb-3">Quando publicar?</p>
                    <div className="flex flex-wrap gap-3">
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                        settings.publishOption === "immediate" ? "border-green-500 bg-green-50" : "border-gray-200"
                      }`}>
                        <input
                          type="radio"
                          name={`publish-${chronicle.id}`}
                          checked={settings.publishOption === "immediate"}
                          onChange={() => updateSetting(chronicle.id, "publishOption", "immediate")}
                        />
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Imediata</span>
                      </label>

                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                        settings.publishOption === "scheduled" ? "border-primary bg-primary/5" : "border-gray-200"
                      }`}>
                        <input
                          type="radio"
                          name={`publish-${chronicle.id}`}
                          checked={settings.publishOption === "scheduled"}
                          onChange={() => updateSetting(chronicle.id, "publishOption", "scheduled")}
                        />
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Agendar</span>
                      </label>

                      {settings.publishOption === "scheduled" && (
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={settings.scheduledDate}
                            min={getMinDate()}
                            onChange={(e) => updateSetting(chronicle.id, "scheduledDate", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="time"
                            value={settings.scheduledTime}
                            onChange={(e) => updateSetting(chronicle.id, "scheduledTime", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Redes Sociais */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.publishToSocial}
                        onChange={(e) => updateSetting(chronicle.id, "publishToSocial", e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-gray-300"
                      />
                      <Share2 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-gray-700">Publicar nas redes sociais</span>
                    </label>

                    {settings.publishToSocial && (
                      <button
                        onClick={() => updateSetting(chronicle.id, "showPreview", !settings.showPreview)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        {settings.showPreview ? "Ocultar preview" : "Ver preview"}
                      </button>
                    )}
                  </div>

                  {/* Social Media Preview */}
                  {settings.publishToSocial && settings.showPreview && (
                    <SocialMediaPreview 
                      chronicle={chronicle} 
                      onClose={() => updateSetting(chronicle.id, "showPreview", false)} 
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-3">
                  {editingChronicle !== chronicle.id && (
                    <>
                      <button
                        onClick={() => startEditing(chronicle)}
                        disabled={processing === chronicle.id}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 flex items-center gap-2 font-medium"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleReject(chronicle.id)}
                        disabled={processing === chronicle.id}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center gap-2 font-medium"
                      >
                        <X className="h-4 w-4" />
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleApprove(chronicle.id)}
                        disabled={processing === chronicle.id}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                      >
                        {processing === chronicle.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : settings.publishOption === "scheduled" ? (
                          <Calendar className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {settings.publishOption === "scheduled" ? "Aprovar e Agendar" : "Aprovar e Publicar"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          M3Solutions. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
