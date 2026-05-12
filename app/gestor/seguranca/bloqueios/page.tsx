// Página de Gerenciamento de Bloqueios e Allowlist
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  RefreshCw,
  Ban,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  X,
  AlertTriangle,
} from "lucide-react";

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  eventType: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  hitCount: number;
  createdBy: string | null;
}

interface AllowlistItem {
  id: string;
  ip: string;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  createdBy: string | null;
}

export default function SecurityBlocksPage() {
  const [activeTab, setActiveTab] = useState<"blocks" | "allowlist">("blocks");
  const [blocks, setBlocks] = useState<BlockedIP[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"block" | "allow">("block");
  const [modalIP, setModalIP] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalDuration, setModalDuration] = useState("60");
  const [saving, setSaving] = useState(false);

  const loadBlocks = async () => {
    try {
      const res = await fetch("/api/gestor/security/blocks");
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllowlist = async () => {
    try {
      const res = await fetch("/api/gestor/security/allowlist");
      if (res.ok) {
        const data = await res.json();
        setAllowlist(data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBlocks(), loadAllowlist()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnblock = async (ip: string) => {
    if (!confirm(`Desbloquear o IP ${ip}?`)) return;
    
    try {
      const res = await fetch("/api/gestor/security/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      
      if (res.ok) {
        loadBlocks();
      } else {
        alert("Erro ao desbloquear IP");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao desbloquear IP");
    }
  };

  const handleRemoveFromAllowlist = async (ip: string) => {
    if (!confirm(`Remover ${ip} da allowlist?`)) return;
    
    try {
      const res = await fetch("/api/gestor/security/allowlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      
      if (res.ok) {
        loadAllowlist();
      } else {
        alert("Erro ao remover da allowlist");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao remover da allowlist");
    }
  };

  const handleSubmitModal = async () => {
    if (!modalIP.trim()) {
      alert("IP é obrigatório");
      return;
    }
    
    setSaving(true);
    
    try {
      const endpoint = modalType === "block" 
        ? "/api/gestor/security/blocks" 
        : "/api/gestor/security/allowlist";
      
      const body = modalType === "block"
        ? { ip: modalIP, reason: modalReason, durationMinutes: parseInt(modalDuration) }
        : { ip: modalIP, reason: modalReason };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setShowModal(false);
        setModalIP("");
        setModalReason("");
        setModalDuration("60");
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "Permanente";
    
    const expires = new Date(expiresAt);
    const now = new Date();
    
    if (expires < now) return "Expirado";
    
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/gestor/seguranca"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bloqueios e Allowlist</h1>
            <p className="text-sm text-gray-500">Gerencie IPs bloqueados e permitidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalType(activeTab === "blocks" ? "block" : "allow");
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            {activeTab === "blocks" ? "Bloquear IP" : "Adicionar à Allowlist"}
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("blocks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "blocks"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Ban size={16} />
          IPs Bloqueados
          {blocks.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
              {blocks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("allowlist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "allowlist"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ShieldCheck size={16} />
          Allowlist
          {allowlist.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
              {allowlist.length}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      ) : activeTab === "blocks" ? (
        /* Lista de Bloqueados */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {blocks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Ban className="mx-auto mb-3 text-gray-300" size={48} />
              <p>Nenhum IP bloqueado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expira em</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tentativas</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">{block.ip}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 max-w-[200px] truncate block">
                        {block.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(block.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm">
                        <Clock size={14} className="text-gray-400" />
                        {getTimeRemaining(block.expiresAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-red-600 font-medium">{block.hitCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleUnblock(block.ip)}
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
                        Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Allowlist */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {allowlist.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ShieldCheck className="mx-auto mb-3 text-gray-300" size={48} />
              <p>Nenhum IP na allowlist</p>
              <p className="text-sm mt-1">IPs na allowlist nunca são bloqueados automaticamente</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adicionado em</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expira em</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adicionado por</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allowlist.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">{item.ip}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{item.reason}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.expiresAt ? getTimeRemaining(item.expiresAt) : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.createdBy || "Sistema"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveFromAllowlist(item.ip)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Aviso */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-medium text-amber-800">Sobre o Modo Observação</h4>
          <p className="text-sm text-amber-700 mt-1">
            Enquanto o modo observação estiver ativo, os bloqueios automáticos não são executados.
            Os eventos são apenas registrados para análise. Bloqueios manuais funcionam normalmente.
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {modalType === "block" ? "Bloquear IP" : "Adicionar à Allowlist"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP</label>
                <input
                  type="text"
                  value={modalIP}
                  onChange={(e) => setModalIP(e.target.value)}
                  placeholder="Ex: 192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Motivo do bloqueio/permissão"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              {modalType === "block" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                  <select
                    value={modalDuration}
                    onChange={(e) => setModalDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="360">6 horas</option>
                    <option value="1440">24 horas</option>
                    <option value="10080">7 dias</option>
                    <option value="0">Permanente</option>
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitModal}
                disabled={saving}
                className={`px-4 py-2 text-sm text-white rounded-lg transition ${
                  modalType === "block"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } disabled:opacity-50`}
              >
                {saving ? "Salvando..." : modalType === "block" ? "Bloquear" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
