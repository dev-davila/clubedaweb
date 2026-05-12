"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Plus, Pencil, Trash2, Loader2, Tag, UserCircle, Check, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  active: boolean;
  _count?: { posts: number };
  authors?: { author: { id: string; name: string } }[];
  tags?: { tag: { id: string; name: string } }[];
}

interface Author {
  id: string;
  name: string;
}

interface TagItem {
  id: string;
  name: string;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    color: "#0066CC",
    authorIds: [] as string[],
    tagIds: [] as string[]
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/gestor/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const res = await fetch("/api/gestor/authors");
      const data = await res.json();
      setAuthors(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/gestor/tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
    fetchTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const url = editing ? `/api/gestor/categories/${editing.id}` : "/api/gestor/categories";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      fetchCategories();
      setShowModal(false);
      setEditing(null);
      setForm({ name: "", description: "", color: "#0066CC", authorIds: [], tagIds: [] });
    } catch (error: any) {
      alert(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || "",
      color: cat.color || "#0066CC",
      authorIds: cat.authors?.map(a => a.author.id) || [],
      tagIds: cat.tags?.map(t => t.tag.id) || []
    });
    setShowModal(true);
  };

  const toggleAuthor = (id: string) => {
    setForm(prev => ({
      ...prev,
      authorIds: prev.authorIds.includes(id)
        ? prev.authorIds.filter(a => a !== id)
        : [...prev.authorIds, id]
    }));
  };

  const toggleTag = (id: string) => {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter(t => t !== id)
        : [...prev.tagIds, id]
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const res = await fetch(`/api/gestor/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      fetchCategories();
    } catch (error: any) {
      alert(error.message || "Erro ao excluir");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500">{categories.length} categorias</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: "", description: "", color: "#0066CC", authorIds: [], tagIds: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria</h3>
            <p className="text-gray-500">Crie categorias para organizar seus posts</p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-4 h-4 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: cat.color || "#0066CC" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{cat.name}</h3>
                      <span className="text-xs text-gray-400">/{cat.slug}</span>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {cat.authors && cat.authors.length > 0 && (
                        <div className="flex items-center gap-1">
                          <UserCircle size={12} className="text-gray-400" />
                          {cat.authors.map((a) => (
                            <span key={a.author.id} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                              {a.author.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {cat.tags && cat.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag size={12} className="text-gray-400" />
                          {cat.tags.slice(0, 5).map((t) => (
                            <span key={t.tag.id} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {t.tag.name}
                            </span>
                          ))}
                          {cat.tags.length > 5 && (
                            <span className="text-xs text-gray-400">+{cat.tags.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {cat._count?.posts || 0} posts
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      disabled={(cat._count?.posts || 0) > 0}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-[42px] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Autores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCircle size={14} className="inline mr-1" />
                  Autores vinculados
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[50px]">
                  {authors.map((author) => (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => toggleAuthor(author.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
                        form.authorIds.includes(author.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {author.name}
                      {form.authorIds.includes(author.id) && <Check size={14} />}
                    </button>
                  ))}
                  {authors.length === 0 && (
                    <span className="text-sm text-gray-400">Nenhum autor cadastrado</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag size={14} className="inline mr-1" />
                  Tags vinculadas
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[50px] max-h-[150px] overflow-y-auto">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-sm transition ${
                        form.tagIds.includes(tag.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {tag.name}
                      {form.tagIds.includes(tag.id) && <Check size={12} />}
                    </button>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-gray-400">Nenhuma tag cadastrada</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
