"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Radio, Plus, Pencil, Trash2, Loader2, X, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, Star, Server,
} from "lucide-react";

interface EvolutionServer {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

export default function ServidoresPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const userRole = (session?.user as any)?.role;

  const [servers, setServers] = useState<EvolutionServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EvolutionServer | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({ name: "", apiUrl: "", apiKey: "", isDefault: false, active: true });

  useEffect(() => {
    if (session && userRole !== "admin") router.replace("/gestor");
  }, [session, userRole, router]);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/servidores");
      const data = await res.json();
      if (data.servers) setServers(data.servers);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar servidores." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", apiUrl: "", apiKey: "", isDefault: false, active: true });
    setShowKey(false);
    setShowModal(true);
  };

  const openEdit = (s: EvolutionServer) => {
    setEditing(s);
    setForm({ name: s.name, apiUrl: s.apiUrl, apiKey: "", isDefault: s.isDefault, active: s.active });
    setShowKey(false);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.apiUrl) {
      setMessage({ type: "error", text: "Nome e URL são obrigatórios." });
      return;
    }
    if (!editing && !form.apiKey) {
      setMessage({ type: "error", text: "API Key é obrigatória." });
      return;
    }
    setActionLoading(true);
    try {
      const body: any = { name: form.name, apiUrl: form.apiUrl, isDefault: form.isDefault, active: form.active };
      if (form.apiKey) body.apiKey = form.apiKey;
      if (editing) body.id = editing.id;

      const res = await fetch("/api/gestor/comunicacao/servidores", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setMessage({ type: "success", text: editing ? "Servidor atualizado!" : "Servidor criado!" });
      setShowModal(false);
      fetchServers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este servidor?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/servidores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setMessage({ type: "success", text: "Servidor excluído!" });
      fetchServers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (userRole !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="text-blue-600" size={28} />
            Servidores Evolution API
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os servidores de conexão com WhatsApp</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm">
          <Plus size={18} /> Novo Servidor
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Server className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhum servidor configurado</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo Servidor" para adicionar</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">API Key</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Padrão</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {servers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{s.apiUrl}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm font-mono">{s.apiKey}</td>
                    <td className="px-6 py-4 text-center">
                      {s.isDefault && <Star className="inline text-yellow-500" size={18} fill="currentColor" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Editar Servidor" : "Novo Servidor"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Servidor Principal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da API</label>
                <input value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="https://api.example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key {editing && <span className="text-gray-400 font-normal">(deixe em branco para manter)</span>}
                </label>
                <div className="relative">
                  <input type={showKey ? "text" : "password"} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Chave de API" />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Servidor padrão</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
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
