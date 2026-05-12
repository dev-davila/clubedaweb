"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2,
  Users, ToggleLeft, ToggleRight, Pencil, X, Bell, Check
} from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  email: string;
  categories: string[];
  active: boolean;
  createdAt: string;
}

interface Category {
  value: string;
  label: string;
}

const CAT_STYLE: Record<string, string> = {
  gestao: "bg-purple-100 text-purple-800",
  marketing: "bg-blue-100 text-blue-800",
  materiais: "bg-emerald-100 text-emerald-800",
  tecnico: "bg-amber-100 text-amber-800",
  comercial: "bg-rose-100 text-rose-800",
};

const CAT_CHECK: Record<string, string> = {
  gestao: "border-purple-400 bg-purple-600",
  marketing: "border-blue-400 bg-blue-600",
  materiais: "border-emerald-400 bg-emerald-600",
  tecnico: "border-amber-400 bg-amber-600",
  comercial: "border-rose-400 bg-rose-600",
};

const CAT_DESC: Record<string, string> = {
  gestao: "Alertas gerais, descadastramento",
  marketing: "Campanhas, métricas de email",
  materiais: "Matérias para crônicas",
  tecnico: "Erros de sistema, alertas",
  comercial: "Leads, formulários de contato",
};

export default function NotificacoesTab() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", categories: ["gestao"] as string[] });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gestor/notification-recipients");
      const data = await res.json();
      if (data.recipients) {
        setRecipients(data.recipients);
        setCategories(data.categories || []);
      }
    } catch {
      setMsg({ type: "error", text: "Erro ao carregar" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); } }, [msg]);

  const toggleCat = (v: string) => {
    setForm(p => {
      const has = p.categories.includes(v);
      const next = has ? p.categories.filter(c => c !== v) : [...p.categories, v];
      return { ...p, categories: next.length > 0 ? next : [v] };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setMsg({ type: "error", text: "Nome e email são obrigatórios" }); return; }
    if (form.categories.length === 0) { setMsg({ type: "error", text: "Selecione ao menos uma categoria" }); return; }
    try {
      setSaving(true);
      const isEdit = !!editingId;
      const res = await fetch("/api/gestor/notification-recipients", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro"); }
      setMsg({ type: "success", text: isEdit ? "Atualizado!" : "Adicionado!" });
      setShowForm(false); setEditingId(null); setForm({ name: "", email: "", categories: ["gestao"] });
      load();
    } catch (err: unknown) {
      setMsg({ type: "error", text: (err as Error).message || "Erro ao salvar" });
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/gestor/notification-recipients", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      if (!res.ok) throw new Error();
      setRecipients(p => p.map(r => r.id === id ? { ...r, active: !active } : r));
    } catch { setMsg({ type: "error", text: "Erro ao alterar status" }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este destinatário?")) return;
    try {
      const res = await fetch(`/api/gestor/notification-recipients?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMsg({ type: "success", text: "Removido!" }); load();
    } catch { setMsg({ type: "error", text: "Erro ao remover" }); }
  };

  const startEdit = (r: Recipient) => {
    setForm({ name: r.name, email: r.email, categories: r.categories || ["gestao"] });
    setEditingId(r.id); setShowForm(true);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-purple-600" />
            Destinatários de Notificações
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie os emails que recebem notificações automáticas.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", email: "", categories: ["gestao"] }); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> Novo destinatário
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900 text-sm">
              {editingId ? "Editar destinatário" : "Novo destinatário"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Nome</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="João Silva"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@empresa.com.br"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                Categorias de notificação
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map(cat => {
                  const on = form.categories.includes(cat.value);
                  return (
                    <button
                      key={cat.value} type="button"
                      onClick={() => toggleCat(cat.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition ${
                        on
                          ? "border-purple-300 bg-purple-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition ${
                        on ? `${CAT_CHECK[cat.value] || "border-purple-400 bg-purple-600"} text-white` : "border-gray-300"
                      }`}>
                        {on && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cat.label}</div>
                        <div className="text-[11px] text-gray-400">{CAT_DESC[cat.value] || ""}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-5 py-3 border-t bg-gray-50 rounded-b-xl">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editingId ? "Salvar alterações" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {recipients.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Nenhum destinatário cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">Clique em "Novo destinatário" para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-3">Nome</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-4">Categorias</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Ações</div>
          </div>
          {/* Rows */}
          {recipients.map((r, i) => (
            <div key={r.id} className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm ${
              i < recipients.length - 1 ? "border-b border-gray-100" : ""
            } ${!r.active ? "opacity-50 bg-gray-50" : "hover:bg-gray-50/50"}`}>
              <div className="col-span-3 font-medium text-gray-900 truncate">{r.name}</div>
              <div className="col-span-3 text-gray-500 truncate">{r.email}</div>
              <div className="col-span-4 flex flex-wrap gap-1">
                {r.categories?.map(c => (
                  <span key={c} className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${CAT_STYLE[c] || "bg-gray-100 text-gray-600"}`}>
                    {categories.find(ct => ct.value === c)?.label || c}
                  </span>
                ))}
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => handleToggle(r.id, r.active)} title={r.active ? "Desativar" : "Ativar"}>
                  {r.active
                    ? <ToggleRight size={22} className="text-green-500 hover:text-green-600 transition" />
                    : <ToggleLeft size={22} className="text-gray-300 hover:text-gray-400 transition" />
                  }
                </button>
              </div>
              <div className="col-span-1 flex justify-center gap-1">
                <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100 transition" title="Editar">
                  <Pencil size={14} className="text-gray-400" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition" title="Remover">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legenda das categorias */}
      <div className="bg-gray-50 rounded-xl border p-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Legenda das categorias</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {categories.map(cat => (
            <div key={cat.value} className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${CAT_STYLE[cat.value]?.split(" ")[0] || "bg-gray-200"}`} />
              <div>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                <span className="text-[10px] text-gray-400 block">{CAT_DESC[cat.value]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dica */}
      <div className="bg-purple-50 rounded-xl border border-purple-100 px-4 py-3">
        <p className="text-xs text-purple-700">
          <strong>Dica:</strong> Cada destinatário pode pertencer a múltiplas categorias e receberá notificações de todas elas.
          Desative para pausar sem remover.
        </p>
      </div>
    </div>
  );
}
