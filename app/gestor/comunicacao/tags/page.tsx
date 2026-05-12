"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Tag, Plus, Pencil, Trash2, Loader2, X, Save, CheckCircle, AlertCircle, Palette,
} from "lucide-react";

interface WaTag {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
  "#84CC16", "#DC2626",
];

export default function TagsPage() {
  const { data: session } = useSession() || {};
  const [tags, setTags] = useState<WaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WaTag | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3B82F6", description: "" });

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/tags");
      const data = await res.json();
      if (data.tags) setTags(data.tags);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar tags." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", color: "#3B82F6", description: "" });
    setShowModal(true);
  };

  const openEdit = (t: WaTag) => {
    setEditing(t);
    setForm({ name: t.name, color: t.color, description: t.description || "" });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { setMessage({ type: "error", text: "Nome é obrigatório." }); return; }
    setActionLoading(true);
    try {
      const body: any = { name: form.name, color: form.color, description: form.description || null };
      if (editing) body.id = editing.id;
      const res = await fetch("/api/gestor/comunicacao/tags", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setMessage({ type: "success", text: editing ? "Tag atualizada!" : "Tag criada!" });
      setShowModal(false);
      fetchTags();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta tag?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setMessage({ type: "success", text: "Tag excluída!" });
      fetchTags();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="text-blue-600" size={28} />
            Tags de Conversa
          </h1>
          <p className="text-gray-500 mt-1">Organize conversas com etiquetas coloridas (funil de vendas)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm">
          <Plus size={18} /> Nova Tag
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Tag className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhuma tag criada</p>
          <p className="text-gray-400 text-sm mt-1">Crie tags para organizar suas conversas por etapas do funil</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: t.color }} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Editar Tag" : "Nova Tag"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Ex: Lead Qualificado" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-lg transition ring-2 ${form.color === c ? "ring-gray-900 scale-110" : "ring-transparent hover:ring-gray-300"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Ex: Contatos que demonstraram interesse" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium">Cancelar</button>
              <button onClick={handleSubmit} disabled={actionLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50">
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {editing ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
