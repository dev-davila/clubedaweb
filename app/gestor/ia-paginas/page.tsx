"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Pencil, Plus, Clock, Loader2, Send, ExternalLink,
  Link2, X, Check, Undo2, Eye, AlertCircle, ChevronRight,
  Globe, FileText, Trash2, RefreshCw
} from "lucide-react";
import Link from "next/link";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: "cms" | "static";
}

interface ScrapedUrl {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  textContent: string;
  sections: string[];
  images: { src: string; alt: string }[];
  domain: string;
}

interface HistoryItem {
  id: string;
  pageId: string | null;
  pageTitle: string;
  pageSlug: string;
  action: string;
  prompt: string;
  status: string;
  provider: string | null;
  createdAt: string;
  referenceUrls: string | null;
}

type TabType = "edit" | "create" | "history";

export default function IAPaginasPage() {
  const [activeTab, setActiveTab] = useState<TabType>("edit");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit tab state
  const [selectedPageId, setSelectedPageId] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editProcessing, setEditProcessing] = useState(false);
  const [editResult, setEditResult] = useState<any>(null);
  const [editModId, setEditModId] = useState<string | null>(null);

  // Create tab state
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedRefPages, setSelectedRefPages] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalRefs, setExternalRefs] = useState<ScrapedUrl[]>([]);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [createProcessing, setCreateProcessing] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);
  const [createModId, setCreateModId] = useState<string | null>(null);

  // History tab state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Confirming/reverting
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  // Fetch pages
  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/gestor/pages?includeStatic=true");
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (e) {
      console.error("Error fetching pages:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/gestor/pages/ai-history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.modifications || []);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  // Auto-generate slug from title
  useEffect(() => {
    if (newTitle && !newSlug) {
      const slug = newTitle
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setNewSlug(slug);
    }
  }, [newTitle, newSlug]);

  // Scrape external URL
  const handleScrapeUrl = async () => {
    if (!externalUrl.trim()) return;
    setScrapingUrl(true);
    try {
      const res = await fetch("/api/gestor/pages/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: externalUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setExternalRefs(prev => [...prev, data.data]);
        setExternalUrl("");
      } else {
        alert(data.error || "Erro ao acessar URL");
      }
    } catch (e) {
      alert("Erro ao acessar URL");
    } finally {
      setScrapingUrl(false);
    }
  };

  const removeExternalRef = (url: string) => {
    setExternalRefs(prev => prev.filter(r => r.url !== url));
  };

  // Edit page with AI
  const handleEditPage = async () => {
    if (!selectedPageId || !editPrompt.trim()) return;
    setEditProcessing(true);
    setEditResult(null);
    setEditModId(null);
    try {
      const res = await fetch("/api/gestor/pages/ai-modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPageId, prompt: editPrompt, preview: true })
      });
      const data = await res.json();
      if (data.success) {
        setEditResult(data);
        setEditModId(data.modificationId);
      } else {
        alert(data.error || "Erro ao gerar preview");
      }
    } catch (e) {
      alert("Erro ao processar");
    } finally {
      setEditProcessing(false);
    }
  };

  // Create page with AI
  const handleCreatePage = async () => {
    if (!newTitle || !newSlug || !newDescription) return;
    setCreateProcessing(true);
    setCreateResult(null);
    setCreateModId(null);
    try {
      const res = await fetch("/api/gestor/pages/ai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug,
          description: newDescription,
          referencePageIds: selectedRefPages,
          externalReferences: externalRefs
        })
      });
      const data = await res.json();
      if (data.success) {
        setCreateResult(data);
        setCreateModId(data.modificationId);
      } else {
        alert(data.error || "Erro ao gerar página");
      }
    } catch (e) {
      alert("Erro ao processar");
    } finally {
      setCreateProcessing(false);
    }
  };

  // Confirm modification
  const handleConfirm = async (modId: string) => {
    setConfirming(true);
    setConfirmMessage(null);
    try {
      const res = await fetch("/api/gestor/pages/ai-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modificationId: modId })
      });
      const data = await res.json();
      if (data.success) {
        setConfirmMessage(data.message);
        // Reset forms
        if (editModId === modId) {
          setEditResult(null);
          setEditModId(null);
          setEditPrompt("");
        }
        if (createModId === modId) {
          setCreateResult(null);
          setCreateModId(null);
          setNewTitle("");
          setNewSlug("");
          setNewDescription("");
          setSelectedRefPages([]);
          setExternalRefs([]);
        }
        fetchHistory();
      } else {
        alert(data.error || "Erro ao confirmar");
      }
    } catch (e) {
      alert("Erro ao confirmar");
    } finally {
      setConfirming(false);
    }
  };

  // Discard preview (delete pending modification)
  const handleDiscard = async (modId: string) => {
    try {
      // Just update status to reverted since it was never applied
      await fetch("/api/gestor/pages/ai-revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modificationId: modId })
      });
    } catch {}
    if (editModId === modId) {
      setEditResult(null);
      setEditModId(null);
    }
    if (createModId === modId) {
      setCreateResult(null);
      setCreateModId(null);
    }
  };

  // Revert applied modification
  const handleRevert = async (modId: string) => {
    if (!confirm("Tem certeza que deseja desfazer esta modificação?")) return;
    try {
      const res = await fetch("/api/gestor/pages/ai-revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modificationId: modId })
      });
      const data = await res.json();
      if (data.success) {
        fetchHistory();
      } else {
        alert(data.error || "Erro ao desfazer");
      }
    } catch (e) {
      alert("Erro ao desfazer");
    }
  };

  const toggleRefPage = (pageId: string) => {
    setSelectedRefPages(prev =>
      prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]
    );
  };

  const selectedPage = pages.find(p => p.id === selectedPageId);

  const quickSuggestions = [
    "Melhorar textos para SEO",
    "Otimizar CTAs para conversão",
    "Atualizar descrições dos serviços",
    "Adicionar seção de FAQ",
    "Melhorar meta description",
  ];

  // Render section preview
  const renderContentPreview = (content: any) => {
    if (!content) return null;
    const sections = content.sections || [];
    return (
      <div className="space-y-4">
        {content.title && (
          <div className="pb-3 border-b">
            <h3 className="font-bold text-gray-900 text-lg">{content.title}</h3>
            {content.metaTitle && <p className="text-xs text-purple-600 mt-1">{content.metaTitle}</p>}
            {content.metaDescription && <p className="text-xs text-gray-500 mt-1">{content.metaDescription}</p>}
          </div>
        )}
        {sections.map((section: any, idx: number) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-mono rounded">
                {section.sectionKey}
              </span>
            </div>
            {section.content?.title && (
              <h4 className="font-semibold text-gray-800 text-sm">{section.content.title}</h4>
            )}
            {section.content?.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{section.content.subtitle}</p>
            )}
            {section.content?.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{section.content.description}</p>
            )}
            {section.content?.items && Array.isArray(section.content.items) && (
              <div className="mt-2 space-y-1">
                {section.content.items.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <ChevronRight size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>{item.title || item.question || item.name || item.label || item.value || JSON.stringify(item).slice(0, 80)}</span>
                  </div>
                ))}
                {section.content.items.length > 4 && (
                  <p className="text-[10px] text-gray-400">+ {section.content.items.length - 4} mais...</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/gestor" className="hover:text-purple-600">Gestor</Link>
          <ChevronRight size={14} />
          <span className="text-purple-600 font-medium">IA Páginas</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Sparkles className="text-purple-600" size={24} />
            </div>
            Editor de Páginas com IA
          </h1>
        </div>
      </div>

      {/* Success message */}
      {confirmMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in">
          <Check size={20} className="text-green-600" />
          <span className="text-green-800 text-sm font-medium">{confirmMessage}</span>
          <button onClick={() => setConfirmMessage(null)} className="ml-auto text-green-400 hover:text-green-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "edit" as TabType, label: "Editar Página", icon: Pencil },
          { key: "create" as TabType, label: "Criar Página Nova", icon: Plus },
          { key: "history" as TabType, label: "Histórico", icon: Clock },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.key
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== TAB: EDITAR ========== */}
      {activeTab === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1: Select Page */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="font-semibold text-gray-900">Escolha a Página</h3>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={16} className="animate-spin" /> Carregando...</div>
              ) : (
                <select
                  value={selectedPageId}
                  onChange={(e) => { setSelectedPageId(e.target.value); setEditResult(null); setEditModId(null); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                  <option value="">Selecione uma página...</option>
                  {pages.filter(p => p.type === "cms").length > 0 && (
                    <optgroup label="Páginas CMS">
                      {pages.filter(p => p.type === "cms").map(p => (
                        <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
              {selectedPage && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
                  <AlertCircle size={14} className="text-purple-500" />
                  <span className="text-xs text-purple-700">
                    Selecionada: <strong>{selectedPage.title}</strong> — {selectedPage.type === "cms" ? "CMS" : "Estática"}
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Describe Changes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="font-semibold text-gray-900">Descreva as Alterações</h3>
              </div>
              <textarea
                rows={6}
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                placeholder="Ex: Alterar o título do hero para 'Soluções de TI que transformam seu negócio'. Adicionar uma nova seção de depoimentos..."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Sugestões:</span>
                {quickSuggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setEditPrompt(prev => prev ? `${prev}\n${s}` : s)}
                    className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleEditPage}
              disabled={!selectedPageId || !editPrompt.trim() || editProcessing}
              className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
            >
              {editProcessing ? (
                <><Loader2 size={18} className="animate-spin" /> Gerando preview...</>
              ) : (
                <><Sparkles size={18} /> Gerar Preview das Alterações</>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">A IA vai gerar um preview. Nada é alterado até você confirmar.</p>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col min-h-[500px]">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="px-3 py-1 bg-white rounded-md border text-xs text-gray-500">
                    {selectedPage ? `m3solutions.com.br/p/${selectedPage.slug}` : "Selecione uma página"}
                  </div>
                </div>
                {editResult && editModId && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDiscard(editModId)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Descartar
                    </button>
                    <button
                      onClick={() => handleConfirm(editModId)}
                      disabled={confirming}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {confirming ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Aplicar Alterações
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {editResult?.newContent ? (
                  renderContentPreview(editResult.newContent)
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Eye className="text-purple-400" size={32} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Preview aparecerá aqui</p>
                      <p className="text-gray-400 text-xs mt-1">Selecione uma página e descreva as alterações</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: CRIAR ========== */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1: References */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="font-semibold text-gray-900">Páginas de Referência</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Selecione páginas internas e/ou cole links externos como modelo.
              </p>

              {/* External URL input */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <Globe size={12} /> Links externos
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                    placeholder="https://exemplo.com/pagina"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleScrapeUrl}
                    disabled={!externalUrl.trim() || scrapingUrl}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {scrapingUrl ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    Adicionar
                  </button>
                </div>
                {/* External refs chips */}
                {externalRefs.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {externalRefs.map(ref => (
                      <div key={ref.url} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                        <Globe size={14} className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{ref.title || ref.domain}</p>
                          <p className="text-[10px] text-gray-500 truncate">{ref.url}</p>
                        </div>
                        <button onClick={() => removeExternalRef(ref.url)} className="text-gray-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal pages */}
              <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <FileText size={12} /> Páginas internas
              </label>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {pages.filter(p => p.type === "cms").map(p => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-2.5 border-2 rounded-xl cursor-pointer transition ${
                      selectedRefPages.includes(p.id)
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRefPages.includes(p.id)}
                      onChange={() => toggleRefPage(p.id)}
                      className="accent-purple-600 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{p.title}</div>
                      <div className="text-xs text-gray-400">/{p.slug}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                      p.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {p.status === "PUBLISHED" ? "PUBLICADA" : "RASCUNHO"}
                    </span>
                  </label>
                ))}
                {pages.filter(p => p.type === "cms").length === 0 && (
                  <p className="text-xs text-gray-400 py-2">Nenhuma página CMS encontrada.</p>
                )}
              </div>
              {(selectedRefPages.length > 0 || externalRefs.length > 0) && (
                <div className="mt-3 text-xs text-purple-600 font-medium">
                  {selectedRefPages.length + externalRefs.length} referência(s) selecionada(s)
                </div>
              )}
            </div>

            {/* Step 2: Describe New Page */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="font-semibold text-gray-900">Descreva a Nova Página</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Título da Página</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Consultoria em Cibersegurança"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Slug (URL)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-500">/p/</span>
                    <input
                      type="text"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-xl text-sm focus:ring-2 focus:ring-purple-500"
                      placeholder="consultoria-ciberseguranca"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">O que espera nessa página</label>
                  <textarea
                    rows={5}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Descreva o conteúdo, objetivo, seções desejadas...&#10;&#10;Ex: Página focada em consultoria de cibersegurança.&#10;- Hero com título impactante&#10;- Lista de serviços&#10;- FAQ com 5 perguntas&#10;- CTA para contato"
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleCreatePage}
              disabled={!newTitle || !newSlug || !newDescription || createProcessing}
              className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
            >
              {createProcessing ? (
                <><Loader2 size={18} className="animate-spin" /> Gerando página...</>
              ) : (
                <><Sparkles size={18} /> Gerar Página com IA</>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">A página será criada como rascunho. Você revisa antes de publicar.</p>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col min-h-[500px]">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="px-3 py-1 bg-white rounded-md border text-xs text-gray-500">
                    {newSlug ? `m3solutions.com.br/p/${newSlug}` : "Nova página"}
                  </div>
                </div>
                {createResult && createModId && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDiscard(createModId)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Descartar
                    </button>
                    <button
                      onClick={() => handleConfirm(createModId)}
                      disabled={confirming}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {confirming ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Criar Página
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {createResult?.newContent ? (
                  renderContentPreview(createResult.newContent)
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="text-green-400" size={32} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Preview da nova página aparecerá aqui</p>
                      <p className="text-gray-400 text-xs mt-1">Selecione referências e descreva o que espera</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: HISTÓRICO ========== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Modificações por IA</h3>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <RefreshCw size={14} className={historyLoading ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
          {historyLoading ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Carregando...
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-500 text-sm">Nenhuma modificação registrada ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.action === "create" ? "bg-green-100" : "bg-purple-100"
                  }`}>
                    {item.action === "create" ? (
                      <Plus size={20} className="text-green-600" />
                    ) : (
                      <Pencil size={20} className="text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {item.pageTitle} — {item.action === "create" ? "Página criada" : "Editada"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      &ldquo;{item.prompt.slice(0, 100)}{item.prompt.length > 100 ? "..." : ""}&rdquo;
                    </div>
                    {item.referenceUrls && (
                      <div className="flex items-center gap-1 mt-1">
                        <Globe size={10} className="text-blue-400" />
                        <span className="text-[10px] text-blue-600">
                          {JSON.parse(item.referenceUrls).length} ref. externa(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className={`text-xs font-medium mt-0.5 ${
                      item.status === "applied" ? "text-green-600" :
                      item.status === "reverted" ? "text-red-600" :
                      item.status === "pending" ? "text-yellow-600" : "text-gray-400"
                    }`}>
                      {item.status === "applied" ? "✓ Aplicado" :
                       item.status === "reverted" ? "✕ Desfeito" :
                       item.status === "pending" ? "⏳ Pendente" : item.status}
                    </div>
                  </div>
                  {item.status === "applied" && item.action === "edit" && (
                    <button
                      onClick={() => handleRevert(item.id)}
                      className="px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition flex items-center gap-1"
                    >
                      <Undo2 size={12} /> Desfazer
                    </button>
                  )}
                  {item.status === "applied" && item.pageId && (
                    <Link
                      href={`/p/${item.pageSlug}?preview=true`}
                      target="_blank"
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Ver
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
