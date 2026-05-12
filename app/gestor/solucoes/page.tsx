"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save, Loader2, Plus, Trash2, Search, ChevronDown, ChevronUp,
  Edit, Eye, EyeOff, ArrowUpDown, X, Check, AlertTriangle, FolderPlus, Layers
} from "lucide-react";

interface SolutionCategoryData {
  id: string;
  slug: string;
  label: string;
  subtitle: string | null;
  displayOrder: number;
  active: boolean;
  gridCols: number;
  bgVariant: string;
  defaultCardVariant: string;
  parentSlug: string | null;
  partnerLogos: { name: string; logo: string }[] | null;
}

const CARD_VARIANTS = [
  { value: "card", label: "Card Padrão" },
  { value: "cloud", label: "Cloud (com logo)" },
  { value: "security", label: "Segurança (com logo)" },
  { value: "partner", label: "Parceiro (com logo)" },
];

const ICON_OPTIONS = [
  "Lightbulb", "Settings", "Laptop", "Monitor", "FolderKanban", "Headphones",
  "Cloud", "Server", "Shield", "Key", "Lock", "Database", "HardDrive",
  "Users", "FileKey", "Cpu", "Globe", "Building2", "Zap", "Award"
];

interface Solution {
  id: string;
  slug: string;
  category: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  icon: string | null;
  logo: string | null;
  description: string | null;
  longDescription: string | null;
  benefits: string[] | null;
  features: { title: string; description: string; link?: string }[] | null;
  highlights: string[] | null;
  extraSections: any[] | null;
  partnerLogos: string[] | null;
  dataCenterPartners: any[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  cardVariant: string | null;
  displayOrder: number;
  active: boolean;
}

export default function GestorSolucoesPage() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [categories, setCategories] = useState<SolutionCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/solucoes/categorias");
      if (!res.ok) throw new Error("Erro ao carregar categorias");
      const data = await res.json();
      setCategories(data);
    } catch (e: any) {
      console.error("Error fetching categories:", e);
    }
  }, []);

  const fetchSolutions = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/solucoes");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();
      setSolutions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSolutions(); fetchCategories(); }, [fetchSolutions, fetchCategories]);

  const handleSave = async (solution: Solution) => {
    setSaving(true);
    setError(null);
    try {
      const isNew = !solution.id;
      const url = isNew ? "/api/gestor/solucoes" : `/api/gestor/solucoes/${solution.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(solution),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      await fetchSolutions();
      setEditingSolution(null);
      setShowNewForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gestor/solucoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchSolutions();
      setDeleteConfirm(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleActive = async (solution: Solution) => {
    try {
      const res = await fetch(`/api/gestor/solucoes/${solution.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !solution.active }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      await fetchSolutions();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = solutions.filter(s => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q);
    }
    return true;
  });

  const categoryOptions = categories.map(c => ({ value: c.slug, label: c.label }));

  const grouped = categories.map(cat => ({
    value: cat.slug,
    label: cat.label,
    items: filtered.filter(s => s.category === cat.slug),
  })).filter(g => !filterCategory || g.value === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soluções</h1>
          <p className="text-gray-500 text-sm mt-1">{solutions.length} soluções cadastradas</p>
        </div>
        <div className="flex gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4" /> Salvo!
            </span>
          )}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            <Layers className="w-4 h-4" /> Categorias
          </button>
          <button
            onClick={() => {
              setShowNewForm(true);
              setEditingSolution({
                id: "",
                slug: "",
                category: categories[0]?.slug || "services",
                title: "",
                subtitle: null,
                image: null,
                icon: null,
                logo: null,
                description: null,
                longDescription: null,
                benefits: [],
                features: [],
                highlights: [],
                extraSections: [],
                partnerLogos: [],
                dataCenterPartners: [],
                metaTitle: null,
                metaDescription: null,
                cardVariant: "card",
                displayOrder: 0,
                active: true,
              });
            }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Nova Solução
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, slug ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Solutions List */}
      {grouped.map(group => (
        group.items.length > 0 && (
          <div key={group.value} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">{group.label}</h2>
              <p className="text-xs text-gray-500">{group.items.length} soluções</p>
            </div>
            <div className="divide-y divide-gray-100">
              {group.items.map(sol => (
                <div key={sol.id} className={`px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition ${!sol.active ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{sol.title}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">/{sol.slug}</span>
                      {sol.displayOrder >= 100 && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">sub-produto</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{sol.description || "Sem descrição"}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(sol)}
                      className={`p-2 rounded-lg transition ${sol.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={sol.active ? "Desativar" : "Ativar"}
                    >
                      {sol.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingSolution({ ...sol }); setShowNewForm(false); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {deleteConfirm === sol.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(sol.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(sol.id)}
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhuma solução encontrada.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingSolution && (
        <SolutionEditor
          solution={editingSolution}
          isNew={showNewForm}
          saving={saving}
          categories={categoryOptions}
          onSave={handleSave}
          onCancel={() => { setEditingSolution(null); setShowNewForm(false); }}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onRefresh={() => { fetchCategories(); fetchSolutions(); }}
        />
      )}
    </div>
  );
}

// ==================== SOLUTION EDITOR ====================

function SolutionEditor({
  solution,
  isNew,
  saving,
  categories,
  onSave,
  onCancel,
}: {
  solution: Solution;
  isNew: boolean;
  saving: boolean;
  categories: { value: string; label: string }[];
  onSave: (s: Solution) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<Solution>(solution);
  const [activeTab, setActiveTab] = useState<"geral" | "conteudo" | "recursos" | "extra">("geral");

  const updateField = (field: keyof Solution, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Benefits management
  const addBenefit = () => updateField("benefits", [...(data.benefits || []), ""]);
  const updateBenefit = (idx: number, val: string) => {
    const benefits = [...(data.benefits || [])];
    benefits[idx] = val;
    updateField("benefits", benefits);
  };
  const removeBenefit = (idx: number) => {
    updateField("benefits", (data.benefits || []).filter((_: any, i: number) => i !== idx));
  };

  // Features management
  const addFeature = () => updateField("features", [...(data.features || []), { title: "", description: "" }]);
  const updateFeature = (idx: number, field: string, val: string) => {
    const features = [...(data.features || [])];
    features[idx] = { ...features[idx], [field]: val };
    updateField("features", features);
  };
  const removeFeature = (idx: number) => {
    updateField("features", (data.features || []).filter((_: any, i: number) => i !== idx));
  };

  // Highlights management
  const addHighlight = () => updateField("highlights", [...(data.highlights || []), ""]);
  const updateHighlight = (idx: number, val: string) => {
    const highlights = [...(data.highlights || [])];
    highlights[idx] = val;
    updateField("highlights", highlights);
  };
  const removeHighlight = (idx: number) => {
    updateField("highlights", (data.highlights || []).filter((_: any, i: number) => i !== idx));
  };

  // Extra Sections management
  const addExtraSection = () => {
    updateField("extraSections", [...(data.extraSections || []), { title: "", description: "", items: [] }]);
  };
  const updateExtraSection = (idx: number, field: string, val: any) => {
    const sections = [...(data.extraSections || [])];
    sections[idx] = { ...sections[idx], [field]: val };
    updateField("extraSections", sections);
  };
  const removeExtraSection = (idx: number) => {
    updateField("extraSections", (data.extraSections || []).filter((_: any, i: number) => i !== idx));
  };
  const addExtraSectionItem = (sectionIdx: number) => {
    const sections = [...(data.extraSections || [])];
    sections[sectionIdx] = { ...sections[sectionIdx], items: [...(sections[sectionIdx].items || []), ""] };
    updateField("extraSections", sections);
  };
  const updateExtraSectionItem = (sectionIdx: number, itemIdx: number, val: string) => {
    const sections = [...(data.extraSections || [])];
    const items = [...(sections[sectionIdx].items || [])];
    items[itemIdx] = val;
    sections[sectionIdx] = { ...sections[sectionIdx], items };
    updateField("extraSections", sections);
  };
  const removeExtraSectionItem = (sectionIdx: number, itemIdx: number) => {
    const sections = [...(data.extraSections || [])];
    sections[sectionIdx] = { ...sections[sectionIdx], items: sections[sectionIdx].items.filter((_: any, i: number) => i !== itemIdx) };
    updateField("extraSections", sections);
  };

  // Partner Logos management
  const addPartnerLogo = () => updateField("partnerLogos", [...(data.partnerLogos || []), ""]);
  const updatePartnerLogo = (idx: number, val: string) => {
    const logos = [...(data.partnerLogos || [])];
    logos[idx] = val;
    updateField("partnerLogos", logos);
  };
  const removePartnerLogo = (idx: number) => {
    updateField("partnerLogos", (data.partnerLogos || []).filter((_: any, i: number) => i !== idx));
  };

  const TABS = [
    { key: "geral" as const, label: "Geral" },
    { key: "conteudo" as const, label: "Conteúdo" },
    { key: "recursos" as const, label: "Recursos & Benefícios" },
    { key: "extra" as const, label: "Seções Extras" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{isNew ? "Nova Solução" : `Editar: ${solution.title}`}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "geral" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={data.title} onChange={e => updateField("title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input type="text" value={data.slug} onChange={e => updateField("slug", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: minha-solucao" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input type="text" value={data.subtitle || ""} onChange={e => updateField("subtitle", e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select value={data.category} onChange={e => updateField("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variante do Card</label>
                  <select value={data.cardVariant || "card"} onChange={e => updateField("cardVariant", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    {CARD_VARIANTS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                  <select value={data.icon || ""} onChange={e => updateField("icon", e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">Nenhum</option>
                    {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagem (chave)</label>
                  <input type="text" value={data.image || ""} onChange={e => updateField("image", e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: consultoria, seguranca" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input type="number" value={data.displayOrder} onChange={e => updateField("displayOrder", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logo</label>
                <input type="text" value={data.logo || ""} onChange={e => updateField("logo", e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="https://cdn.sanity.io/images/599r6htc/regionalized/45f4f1cf91fd2b68a8bee73f0d3f0aa802a8ffbc-1000x950.png" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={data.active} onChange={e => updateField("active", e.target.checked)}
                  className="rounded border-gray-300" id="active" />
                <label htmlFor="active" className="text-sm text-gray-700">Ativa (visível no site)</label>
              </div>
            </div>
          )}

          {activeTab === "conteudo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
                <textarea value={data.description || ""} onChange={e => updateField("description", e.target.value || null)}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Longa (suporta HTML)</label>
                <textarea value={data.longDescription || ""} onChange={e => updateField("longDescription", e.target.value || null)}
                  rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              {/* Highlights */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Destaques (badges)</label>
                  <button onClick={addHighlight} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                {(data.highlights || []).map((h: string, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" value={h} onChange={e => updateHighlight(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Ex: 24x7" />
                    <button onClick={() => removeHighlight(idx)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {/* Partner Logos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Logos de Parceiros (chave: sophos, kaspersky, etc)</label>
                  <button onClick={addPartnerLogo} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                {(data.partnerLogos || []).map((l: string, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" value={l} onChange={e => updatePartnerLogo(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="ex: sophos" />
                    <button onClick={() => removePartnerLogo(idx)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {/* SEO */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">SEO</h3>
                <div className="space-y-2">
                  <input type="text" value={data.metaTitle || ""} onChange={e => updateField("metaTitle", e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Meta Title" />
                  <textarea value={data.metaDescription || ""} onChange={e => updateField("metaDescription", e.target.value || null)}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Meta Description" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "recursos" && (
            <div className="space-y-6">
              {/* Benefits */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Benefícios ({(data.benefits || []).length})</label>
                  <button onClick={addBenefit} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(data.benefits || []).map((b: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={b} onChange={e => updateBenefit(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                      <button onClick={() => removeBenefit(idx)} className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Recursos ({(data.features || []).length})</label>
                  <button onClick={addFeature} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {(data.features || []).map((f: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <input type="text" value={f.title} onChange={e => updateFeature(idx, "title", e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Título" />
                        <button onClick={() => removeFeature(idx)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <textarea value={f.description} onChange={e => updateFeature(idx, "description", e.target.value)}
                        rows={2} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Descrição" />
                      <input type="text" value={f.link || ""} onChange={e => updateFeature(idx, "link", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Link (opcional): /solucoes/slug" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "extra" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Seções Extras ({(data.extraSections || []).length})</label>
                <button onClick={addExtraSection} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar Seção
                </button>
              </div>
              {(data.extraSections || []).map((section: any, sIdx: number) => (
                <div key={sIdx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Seção {sIdx + 1}</span>
                    <button onClick={() => removeExtraSection(sIdx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <input type="text" value={section.title || ""} onChange={e => updateExtraSection(sIdx, "title", e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Título da seção" />
                  <textarea value={section.description || ""} onChange={e => updateExtraSection(sIdx, "description", e.target.value)}
                    rows={2} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Descrição" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Layout</label>
                      <select value={section.layout || ""} onChange={e => updateExtraSection(sIdx, "layout", e.target.value || undefined)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                        <option value="">Padrão (3 colunas)</option>
                        <option value="single-row">Linha única (4 colunas)</option>
                        <option value="grid-4">Grid 4 colunas</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Tipo</label>
                      <select value={section.type || ""} onChange={e => updateExtraSection(sIdx, "type", e.target.value || undefined)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                        <option value="">Normal</option>
                        <option value="datacenter-partners">Data Center Partners</option>
                      </select>
                    </div>
                  </div>
                  {/* Items */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500">Itens ({(section.items || []).length})</label>
                      <button onClick={() => addExtraSectionItem(sIdx)} className="text-xs text-blue-600 hover:text-blue-800">
                        <Plus className="w-3 h-3 inline" /> Item
                      </button>
                    </div>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {(section.items || []).map((item: string, iIdx: number) => (
                        <div key={iIdx} className="flex gap-1">
                          <input type="text" value={item} onChange={e => updateExtraSectionItem(sIdx, iIdx, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                          <button onClick={() => removeExtraSectionItem(sIdx, iIdx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {(data.extraSections || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma seção extra. Clique em &quot;Adicionar Seção&quot; para começar.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => onSave(data)}
            disabled={saving || !data.title || !data.slug || !data.category}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Criar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== CATEGORY MANAGER ====================

function CategoryManager({
  categories,
  onClose,
  onRefresh,
}: {
  categories: SolutionCategoryData[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [editingCat, setEditingCat] = useState<SolutionCategoryData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyCat: SolutionCategoryData = {
    id: "",
    slug: "",
    label: "",
    subtitle: null,
    displayOrder: (categories.length + 1) * 10,
    active: true,
    gridCols: 3,
    bgVariant: "white",
    defaultCardVariant: "card",
    parentSlug: null,
    partnerLogos: null,
  };

  const handleSave = async () => {
    if (!editingCat || !editingCat.slug || !editingCat.label) return;
    setSaving(true);
    setError(null);
    try {
      const isNew = !editingCat.id;
      const url = isNew ? "/api/gestor/solucoes/categorias" : `/api/gestor/solucoes/categorias/${editingCat.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCat),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      setEditingCat(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gestor/solucoes/categorias/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir");
      }
      setDeleteConfirm(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message);
      setDeleteConfirm(null);
    }
  };

  const parentOptions = categories.filter(c => !c.parentSlug);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Gerenciar Categorias</h2>
            <p className="text-sm text-gray-500">{categories.length} categorias</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingCat(emptyCat)}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <FolderPlus className="w-4 h-4" /> Nova Categoria
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Editing form */}
          {editingCat && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 space-y-3">
              <h3 className="font-semibold text-blue-900 text-sm">{editingCat.id ? `Editar: ${editingCat.label}` : "Nova Categoria"}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input type="text" value={editingCat.label}
                    onChange={e => setEditingCat(prev => prev ? { ...prev, label: e.target.value } : prev)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Redes & Conectividade" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
                  <input type="text" value={editingCat.slug}
                    onChange={e => setEditingCat(prev => prev ? { ...prev, slug: e.target.value } : prev)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Ex: redes" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtítulo</label>
                <input type="text" value={editingCat.subtitle || ""}
                  onChange={e => setEditingCat(prev => prev ? { ...prev, subtitle: e.target.value || null } : prev)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Descrição curta exibida no site" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ordem</label>
                  <input type="number" value={editingCat.displayOrder}
                    onChange={e => setEditingCat(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) || 0 } : prev)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Colunas</label>
                  <select value={editingCat.gridCols}
                    onChange={e => setEditingCat(prev => prev ? { ...prev, gridCols: parseInt(e.target.value) } : prev)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                    <option value={2}>2 colunas</option>
                    <option value={3}>3 colunas</option>
                    <option value={4}>4 colunas</option>
                    <option value={6}>6 colunas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fundo</label>
                  <select value={editingCat.bgVariant}
                    onChange={e => setEditingCat(prev => prev ? { ...prev, bgVariant: e.target.value } : prev)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                    <option value="white">Branco</option>
                    <option value="slate">Cinza</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Card padrão</label>
                  <select value={editingCat.defaultCardVariant}
                    onChange={e => setEditingCat(prev => prev ? { ...prev, defaultCardVariant: e.target.value } : prev)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                    <option value="card">Card Padrão</option>
                    <option value="cloud">Cloud</option>
                    <option value="security">Segurança</option>
                    <option value="partner">Parceiro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria pai (sub-categoria)</label>
                <select value={editingCat.parentSlug || ""}
                  onChange={e => setEditingCat(prev => prev ? { ...prev, parentSlug: e.target.value || null } : prev)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option value="">Nenhuma (categoria principal)</option>
                  {parentOptions.filter(p => p.slug !== editingCat.slug).map(p => (
                    <option key={p.slug} value={p.slug}>{p.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Se definida, será exibida como sub-seção dentro da categoria pai.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving || !editingCat.slug || !editingCat.label}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
                <button onClick={() => { setEditingCat(null); setError(null); }}
                  className="px-4 py-1.5 text-gray-600 hover:text-gray-800 text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Categories list */}
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${cat.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{cat.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{cat.slug}</span>
                    {cat.parentSlug && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">sub de: {cat.parentSlug}</span>}
                    <span className="text-xs text-gray-400">ordem: {cat.displayOrder}</span>
                  </div>
                  {cat.subtitle && <p className="text-sm text-gray-500 truncate mt-0.5">{cat.subtitle}</p>}
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-400">{cat.gridCols} cols</span>
                    <span className="text-xs text-gray-400">fundo: {cat.bgVariant}</span>
                    <span className="text-xs text-gray-400">card: {cat.defaultCardVariant}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingCat({ ...cat })}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {deleteConfirm === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="text-center text-gray-400 py-8">Nenhuma categoria cadastrada.</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Fechar</button>
        </div>
      </div>
    </div>
  );
}