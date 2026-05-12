"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Pencil, Trash2, Loader2, Mail, Check, X } from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export default function DestinatariosPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecipients = async () => {
    try {
      const res = await fetch("/api/cronicas/destinatarios");
      const data = await res.json();
      setRecipients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este destinatário?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/cronicas/destinatarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      fetchRecipients();
    } catch (error) {
      alert("Erro ao excluir destinatário");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (recipient: Recipient) => {
    try {
      await fetch(`/api/cronicas/destinatarios/${recipient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...recipient, active: !recipient.active })
      });
      fetchRecipients();
    } catch (error) {
      alert("Erro ao atualizar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinatários</h1>
          <p className="text-gray-500 text-sm mt-1">
            Emails que receberão notificações de novas matérias
          </p>
        </div>
        <Link
          href="/gestor/cronicas/destinatarios/novo"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition font-medium"
        >
          <Plus size={18} />
          Novo Destinatário
        </Link>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {recipients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum destinatário cadastrado</p>
            <Link
              href="/gestor/cronicas/destinatarios/novo"
              className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium"
            >
              Cadastrar primeiro destinatário
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${recipient.active ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                      <Mail className={recipient.active ? 'text-green-600' : 'text-gray-400'} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{recipient.name}</h3>
                        {recipient.active ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Ativo</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Inativo</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{recipient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(recipient)}
                      className={`p-2 rounded-lg transition ${recipient.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={recipient.active ? "Desativar" : "Ativar"}
                    >
                      {recipient.active ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <Link
                      href={`/gestor/cronicas/destinatarios/${recipient.id}/editar`}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(recipient.id)}
                      disabled={deleting === recipient.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      {deleting === recipient.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
