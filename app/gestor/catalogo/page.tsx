"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save, Loader2, Plus, Trash2, Search, ChevronDown, ChevronUp,
  Edit, Eye, EyeOff, X, Package, FolderOpen
} from "lucide-react";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  active: boolean;
  _count?: { products: number };
}

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  vendor: string;
  image: string;
  features: string[];
  benefits: string[];
  editions: { name: string; description: string }[] | null;
  relatedProducts: string[] | null;
  displayOrder: number;
  active: boolean;
}

const ICON_OPTIONS = [
  "Microsoft", "Palette", "PenTool", "Shield", "HardDrive",
  "Server", "Users", "Network", "Database", "Building", "Code"
];

export default function GestorCatalogoPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/catalogo?include=products");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const url = filterCategory
        ? `/api/gestor/catalogo/produtos?categoryId=${filterCategory}`
        : "/api/gestor/catalogo/produtos";
      const res = await fetch(url);
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
  }, [filterCategory]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCategories(), fetchProducts()]).finally(() => setLoading(false));
  }, [fetchCategories, fetchProducts]);

  // ---- Product CRUD ----
  const handleSaveProduct = async (prod: Product) => {
    setSaving(true);
    try {
      const isNew = !prod.id;
      const url = isNew ? "/api/gestor/catalogo/produtos" : `/api/gestor/catalogo/produtos/${prod.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prod),
      });
      if (!res.ok) throw new Error(await res.text());
      showToast(isNew ? "Produto criado!" : "Produto salvo!");
      setEditingProduct(null);
      await Promise.all([fetchCategories(), fetchProducts()]);
    } catch (e: any) {
      showToast(e.message || "Erro ao salvar", "err");
    } finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    try {
      const res = await fetch(`/api/gestor/catalogo/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Produto exclu\u00eddo");
      await Promise.all([fetchCategories(), fetchProducts()]);
    } catch { showToast("Erro ao excluir", "err"); }
  };

  const handleToggleProduct = async (prod: Product) => {
    try {
      await fetch(`/api/gestor/catalogo/produtos/${prod.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !prod.active }),
      });
      await fetchProducts();
    } catch { showToast("Erro ao alternar", "err"); }
  };

  // ---- Category CRUD ----
  const handleSaveCategory = async (cat: Category) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/gestor/catalogo/categorias/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      if (!res.ok) throw new Error(await res.text());
      showToast("Categoria salva!");
      setEditingCategory(null);
      await fetchCategories();
    } catch (e: any) {
      showToast(e.message || "Erro ao salvar", "err");
    } finally { setSaving(false); }
  };

  const handleToggleCategory = async (cat: Category) => {
    try {
      await fetch(`/api/gestor/catalogo/categorias/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !cat.active }),
      });
      await fetchCategories();
    } catch { showToast("Erro ao alternar", "err"); }
  };

  // Filter products
  const filtered = products.filter((p) => {
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.vendor.toLowerCase().includes(s) && !p.slug.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // Group by category for display
  const catMap = new Map(categories.map((c) => [c.id, c]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
          toast.type === "ok" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cat\u00e1logo de Software</h1>
          <p className="text-gray-500">{categories.length} categorias \u00b7 {products.length} produtos</p>
        </div>
        <button
          onClick={() => {
            if (categories.length === 0) return showToast("Crie uma categoria primeiro", "err");
            setEditingProduct({
              id: "", slug: "", name: "", shortDescription: "", fullDescription: "",
              categoryId: categories[0]?.id || "", vendor: "", image: "/images/catalogo/microsoft.jpg",
              features: [""], benefits: [""], editions: null, relatedProducts: null,
              displayOrder: products.length + 1, active: true,
            });
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "products" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Package size={16} className="inline mr-1" /> Produtos ({products.length})
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "categories" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FolderOpen size={16} className="inline mr-1" /> Categorias ({categories.length})
        </button>
      </div>

      {/* ========== PRODUCTS TAB ========== */}
      {tab === "products" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, vendor, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Product list */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Produto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Vendor</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">A\u00e7\u00f5es</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((prod) => (
                    <tr key={prod.id} className={`hover:bg-gray-50 ${!prod.active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{prod.name}</div>
                        <div className="text-xs text-gray-500">{prod.slug}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        {catMap.get(prod.categoryId)?.name || "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{prod.vendor}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleProduct(prod)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            prod.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {prod.active ? <><Eye size={12} /> Ativo</> : <><EyeOff size={12} /> Inativo</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum produto encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========== CATEGORIES TAB ========== */}
      {tab === "categories" && (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${!cat.active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-500">{cat.slug} \u00b7 \u00cdcone: {cat.icon} \u00b7 {cat._count?.products ?? 0} produtos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cat.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cat.active ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => setEditingCategory(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== PRODUCT EDITOR MODAL ========== */}
      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          categories={categories}
          saving={saving}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* ========== CATEGORY EDITOR MODAL ========== */}
      {editingCategory && (
        <CategoryEditor
          category={editingCategory}
          saving={saving}
          onSave={handleSaveCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

/* ===================== PRODUCT EDITOR ===================== */
function ProductEditor({
  product, categories, saving, onSave, onClose,
}: {
  product: Product;
  categories: Category[];
  saving: boolean;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Product>({ ...product });

  const set = (field: keyof Product, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleFeatureChange = (idx: number, val: string) => {
    const arr = [...form.features];
    arr[idx] = val;
    set("features", arr);
  };
  const handleBenefitChange = (idx: number, val: string) => {
    const arr = [...form.benefits];
    arr[idx] = val;
    set("benefits", arr);
  };

  const handleEditionChange = (idx: number, field: "name" | "description", val: string) => {
    const arr = [...(form.editions || [])];
    arr[idx] = { ...arr[idx], [field]: val };
    set("editions", arr);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {product.id ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Basic info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <input value={form.vendor} onChange={(e) => set("vendor", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem (caminho)</label>
            <input value={form.image} onChange={(e) => set("image", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descri\u00e7\u00e3o curta *</label>
            <textarea value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)}
              rows={2} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descri\u00e7\u00e3o completa</label>
            <textarea value={form.fullDescription} onChange={(e) => set("fullDescription", e.target.value)}
              rows={4} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Recursos</label>
              <button type="button" onClick={() => set("features", [...form.features, ""])}
                className="text-blue-600 text-xs flex items-center gap-1"><Plus size={14} /> Adicionar</button>
            </div>
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={f} onChange={(e) => handleFeatureChange(i, e.target.value)}
                  placeholder={`Recurso ${i + 1}`}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => set("features", form.features.filter((_, j) => j !== i))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Benef\u00edcios</label>
              <button type="button" onClick={() => set("benefits", [...form.benefits, ""])}
                className="text-blue-600 text-xs flex items-center gap-1"><Plus size={14} /> Adicionar</button>
            </div>
            {form.benefits.map((b, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={b} onChange={(e) => handleBenefitChange(i, e.target.value)}
                  placeholder={`Benef\u00edcio ${i + 1}`}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => set("benefits", form.benefits.filter((_, j) => j !== i))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Editions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Edi\u00e7\u00f5es (opcional)</label>
              <button type="button" onClick={() => set("editions", [...(form.editions || []), { name: "", description: "" }])}
                className="text-blue-600 text-xs flex items-center gap-1"><Plus size={14} /> Adicionar</button>
            </div>
            {(form.editions || []).map((ed, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={ed.name} onChange={(e) => handleEditionChange(i, "name", e.target.value)}
                  placeholder="Nome da edi\u00e7\u00e3o" className="w-1/3 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                <input value={ed.description} onChange={(e) => handleEditionChange(i, "description", e.target.value)}
                  placeholder="Descri\u00e7\u00e3o" className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                <button type="button"
                  onClick={() => set("editions", (form.editions || []).filter((_, j) => j !== i))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Display Order & Active */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibi\u00e7\u00e3o</label>
              <input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Ativo (vis\u00edvel no site)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-gray-700">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name || !form.slug || !form.vendor}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== CATEGORY EDITOR ===================== */
function CategoryEditor({
  category, saving, onSave, onClose,
}: {
  category: Category;
  saving: boolean;
  onSave: (c: Category) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Category>({ ...category });
  const set = (field: keyof Category, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Editar Categoria</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descri\u00e7\u00e3o</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">\u00cdcone</label>
            <select value={form.icon} onChange={(e) => set("icon", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Ativo</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-gray-700">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name || !form.slug}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
