"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save, Loader2, Search, Edit, Eye, EyeOff, X, Check, AlertTriangle, FileText
} from "lucide-react";

interface InstitutionalPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  content: string | null;
  sections: any;
  active: boolean;
  updatedAt: string;
}

export default function GestorInstitucionalPage() {
  const [pages, setPages] = useState<InstitutionalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPage, setEditingPage] = useState<InstitutionalPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/institucional");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();
      setPages(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/gestor/institucional/${editingPage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTitle: editingPage.heroTitle,
          heroSubtitle: editingPage.heroSubtitle,
          content: editingPage.content,
          sections: editingPage.sections,
          metaTitle: editingPage.metaTitle,
          metaDescription: editingPage.metaDescription,
          active: editingPage.active,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }
      const updated = await res.json();
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (page: InstitutionalPage) => {
    try {
      const res = await fetch(`/api/gestor/institucional/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !page.active }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      const updated = await res.json();
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!editingPage) return;
    setEditingPage({ ...editingPage, [field]: value });
  };

  const sectionsString = editingPage?.sections
    ? JSON.stringify(editingPage.sections, null, 2)
    : "{}";

  const handleSectionsChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateField("sections", parsed);
    } catch {
      // Keep raw text — user is still typing
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Editing view
  if (editingPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editando: {editingPage.title}</h1>
            <p className="text-gray-500 text-sm">/{editingPage.slug}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingPage(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Hero */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Hero da Página</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título Hero</label>
              <input
                type="text"
                value={editingPage.heroTitle || ""}
                onChange={(e) => updateField("heroTitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo Hero</label>
              <input
                type="text"
                value={editingPage.heroSubtitle || ""}
                onChange={(e) => updateField("heroSubtitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">SEO</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Título</label>
              <input
                type="text"
                value={editingPage.metaTitle || ""}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Descrição</label>
              <textarea
                value={editingPage.metaDescription || ""}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Conteúdo (HTML)</h2>
          <p className="text-sm text-gray-500">Texto principal da página. Aceita HTML (h2, p, ul, li, etc.)</p>
          <textarea
            value={editingPage.content || ""}
            onChange={(e) => updateField("content", e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="<h2>Título</h2>\n<p>Parágrafo...</p>"
          />
        </div>

        {/* Sections (JSON) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Seções (JSON)</h2>
          <p className="text-sm text-gray-500">
            Dados estruturados da página (listas, cards, etc). Cada página tem suas chaves específicas.
          </p>
          <textarea
            defaultValue={sectionsString}
            onChange={(e) => handleSectionsChange(e.target.value)}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Active toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Status da Página</h2>
              <p className="text-sm text-gray-500">Desativar a página faz com que o conteúdo padrão seja exibido.</p>
            </div>
            <button
              onClick={() => updateField("active", !editingPage.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editingPage.active ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editingPage.active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Páginas Institucionais</h1>
          <p className="text-gray-500">Gerencie o conteúdo das páginas institucionais do site.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Página</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Atualizado</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{page.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">/{page.slug}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(page)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        page.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {page.active ? (
                        <><Eye className="w-3 h-3" /> Ativo</>
                      ) : (
                        <><EyeOff className="w-3 h-3" /> Inativo</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {new Date(page.updatedAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setEditingPage(page)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhuma página encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
