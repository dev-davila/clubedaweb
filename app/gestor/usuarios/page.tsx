"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Pencil, Trash2, Loader2, X, Save, Shield, Eye, EyeOff,
  CheckCircle, AlertCircle, Search, KeyRound, UserCircle, Mail,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

const ROLES = [
  { value: "admin", label: "Administrador", color: "bg-red-100 text-red-700", desc: "Acesso total ao sistema" },
  { value: "operador", label: "Operador", color: "bg-blue-100 text-blue-700", desc: "Cria pautas e crônicas" },
  { value: "cliente", label: "Cliente", color: "bg-green-100 text-green-700", desc: "Visualiza e autoriza pautas/crônicas" },
];

function getRoleBadge(role: string) {
  const r = ROLES.find((r) => r.value === role);
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${r?.color || "bg-gray-100 text-gray-700"}`}>
      {r?.label || role}
    </span>
  );
}

export default function UsuariosPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const userRole = (session?.user as any)?.role;

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "operador" });
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/usuarios");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar usuários." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === "admin") fetchUsers();
  }, [userRole, fetchUsers]);

  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Acesso Restrito</h2>
        <p className="text-gray-500 mt-2">Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ email: "", name: "", password: "", role: "operador" });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setForm({ email: user.email, name: user.name || "", password: "", role: user.role });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    setMessage(null);
    if (!form.email || !form.role) {
      setMessage({ type: "error", text: "Email e perfil são obrigatórios." });
      return;
    }
    if (!editingUser && !form.password) {
      setMessage({ type: "error", text: "Senha é obrigatória para novo usuário." });
      return;
    }

    setActionLoading(true);
    try {
      const isEdit = !!editingUser;
      const body = isEdit
        ? { id: editingUser.id, email: form.email, name: form.name, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : { email: form.email, name: form.name, password: form.password, role: form.role };

      const res = await fetch("/api/gestor/usuarios", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: isEdit ? "Usuário atualizado!" : "Usuário criado!" });
        setShowModal(false);
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao salvar." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de rede." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (user: UserData) => {
    if (user.email === session?.user?.email) {
      setMessage({ type: "error", text: "Você não pode excluir sua própria conta." });
      return;
    }
    if (!confirm(`Excluir o usuário ${user.name || user.email}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/gestor/usuarios?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Usuário excluído." });
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao excluir." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de rede." });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.name || "").toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie os usuários e permissões do sistema</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${r.color}`}>{r.label}</span>
              <span className="text-xs text-gray-500">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou perfil..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50/80">
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium text-center">Perfil</th>
                  <th className="px-5 py-3 font-medium text-right">Criado em</th>
                  <th className="px-5 py-3 font-medium text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{user.email}</td>
                    <td className="px-5 py-3 text-center">{getRoleBadge(user.role)}</td>
                    <td className="px-5 py-3 text-right text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditModal(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user)} disabled={actionLoading || user.email === session?.user?.email} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">{filteredUsers.length} usuário(s) encontrado(s)</p>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingUser ? "Nova senha (deixe vazio para manter)" : "Senha *"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={editingUser ? "Deixe vazio para manter" : "Mínimo 6 caracteres"}
                    required={!editingUser}
                    minLength={form.password ? 6 : undefined}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Perfil de Acesso *</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        form.role === r.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <Shield className={`w-5 h-5 ${form.role === r.value ? "text-blue-600" : "text-gray-400"}`} />
                      <span className={`text-xs font-semibold ${form.role === r.value ? "text-blue-700" : "text-gray-700"}`}>{r.label}</span>
                      <span className="text-[10px] text-gray-400 leading-tight">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingUser ? "Salvar" : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
