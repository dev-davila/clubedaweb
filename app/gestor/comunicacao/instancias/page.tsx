"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  QrCode, Plus, Trash2, Loader2, X, CheckCircle, AlertCircle,
  Wifi, WifiOff, RefreshCw, Smartphone, Server,
} from "lucide-react";
import Image from "next/image";

interface Instance {
  id: string;
  instanceName: string;
  phoneNumber: string | null;
  status: string;
  server: { id: string; name: string };
  owner: { name: string | null; email: string };
  createdAt: string;
}

interface ServerOption {
  id: string;
  name: string;
  isDefault: boolean;
}

export default function InstanciasPage() {
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role;

  const [instances, setInstances] = useState<Instance[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ instanceName: "", serverId: "" });

  // QR modal
  const [qrModal, setQrModal] = useState<{ instanceId: string; instanceName: string } | null>(null);
  const [qrData, setQrData] = useState<{ qrcode?: string; status?: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/instancias");
      const data = await res.json();
      if (data.instances) setInstances(data.instances);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar instâncias." });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/servidores");
      const data = await res.json();
      if (data.servers) {
        setServers(data.servers.filter((s: any) => s.active));
        const def = data.servers.find((s: any) => s.isDefault && s.active);
        if (def) setCreateForm((f) => ({ ...f, serverId: def.id }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchInstances();
    fetchServers();
  }, [fetchInstances, fetchServers]);

  // Cleanup QR polling on unmount
  useEffect(() => {
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    };
  }, []);

  const handleCreate = async () => {
    if (!createForm.instanceName || !createForm.serverId) {
      setMessage({ type: "error", text: "Preencha todos os campos." });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/instancias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar");
      setMessage({ type: "success", text: "Instância criada! Conecte via QR Code." });
      setShowCreate(false);
      setCreateForm({ instanceName: "", serverId: servers.find((s) => s.isDefault)?.id || "" });
      fetchInstances();
      // Auto-open QR modal
      if (data.instance?.id) {
        openQrModal(data.instance.id, data.instance.instanceName);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? A instância será removida permanentemente.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/instancias?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setMessage({ type: "success", text: "Instância removida!" });
      fetchInstances();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openQrModal = (instanceId: string, instanceName: string) => {
    setQrModal({ instanceId, instanceName });
    setQrData(null);
    pollQr(instanceId);
  };

  const pollQr = async (instanceId: string) => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    setQrLoading(true);
    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/gestor/comunicacao/instancias/${instanceId}/connect`);
        const data = await res.json();
        setQrData(data);
        if (data.status === "open" || data.status === "connected") {
          if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
          fetchInstances();
        }
      } catch {} finally {
        setQrLoading(false);
      }
    };
    await fetchQr();
    qrIntervalRef.current = setInterval(fetchQr, 5000);
  };

  const closeQrModal = () => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    setQrModal(null);
    setQrData(null);
  };

  const refreshStatus = async (id: string) => {
    try {
      await fetch(`/api/gestor/comunicacao/instancias/${id}/status`);
      fetchInstances();
    } catch {}
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; label: string; icon: any }> = {
      open: { bg: "bg-green-100 text-green-700", label: "Conectado", icon: Wifi },
      connected: { bg: "bg-green-100 text-green-700", label: "Conectado", icon: Wifi },
      connecting: { bg: "bg-yellow-100 text-yellow-700", label: "Conectando", icon: RefreshCw },
      close: { bg: "bg-red-100 text-red-700", label: "Desconectado", icon: WifiOff },
      disconnected: { bg: "bg-red-100 text-red-700", label: "Desconectado", icon: WifiOff },
    };
    const s = map[status] || { bg: "bg-gray-100 text-gray-600", label: status, icon: WifiOff };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}>
        <Icon size={14} /> {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="text-blue-600" size={28} />
            Instâncias WhatsApp
          </h1>
          <p className="text-gray-500 mt-1">Gerencie suas conexões com WhatsApp</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm">
          <Plus size={18} /> Nova Instância
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Instances grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Smartphone className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Nenhuma instância criada</p>
          <p className="text-gray-400 text-sm mt-1">Crie uma nova instância para conectar ao WhatsApp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((inst) => (
            <div key={inst.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{inst.instanceName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{inst.server.name}</p>
                </div>
                {getStatusBadge(inst.status)}
              </div>
              {inst.phoneNumber && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Smartphone size={14} /> {inst.phoneNumber}
                </p>
              )}
              {userRole === "admin" && (
                <p className="text-xs text-gray-400">
                  Dono: {inst.owner?.name || inst.owner?.email}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2 border-t">
                <button onClick={() => openQrModal(inst.id, inst.instanceName)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                  <QrCode size={16} /> {inst.status === "open" || inst.status === "connected" ? "Status" : "Conectar"}
                </button>
                <button onClick={() => refreshStatus(inst.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => handleDelete(inst.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nova Instância</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instância</label>
                <input value={createForm.instanceName} onChange={(e) => setCreateForm({ ...createForm, instanceName: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="meu-whatsapp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servidor</label>
                <select value={createForm.serverId} onChange={(e) => setCreateForm({ ...createForm, serverId: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} {s.isDefault ? "(padrão)" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium">Cancelar</button>
              <button onClick={handleCreate} disabled={actionLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50">
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeQrModal}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{qrModal.instanceName}</h2>
              <button onClick={closeQrModal} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            {qrData?.status === "open" || qrData?.status === "connected" ? (
              <div className="py-8">
                <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                <p className="text-green-700 font-semibold">Conectado!</p>
                <p className="text-sm text-gray-500 mt-1">WhatsApp vinculado com sucesso</p>
              </div>
            ) : qrData?.qrcode ? (
              <div className="space-y-3">
                <div className="relative mx-auto w-64 h-64 bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
                  <Image src={qrData.qrcode} alt="QR Code" fill className="object-contain p-2" unoptimized />
                </div>
                <p className="text-sm text-gray-500">Abra o WhatsApp no celular e escaneie o QR Code</p>
                <p className="text-xs text-gray-400">Atualizando automaticamente a cada 5 segundos...</p>
              </div>
            ) : (
              <div className="py-8">
                <Loader2 className="animate-spin mx-auto text-blue-600 mb-3" size={32} />
                <p className="text-sm text-gray-500">Gerando QR Code...</p>
              </div>
            )}

            <button onClick={closeQrModal} className="w-full px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
