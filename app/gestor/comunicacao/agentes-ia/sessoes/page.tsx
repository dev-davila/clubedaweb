"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Bot, MessageSquare, Loader2, RefreshCw, Search,
  Filter, ChevronLeft, ChevronRight, Eye, ExternalLink, XCircle,
} from "lucide-react";

interface Session {
  id: string;
  phone: string;
  status: string;
  department: string | null;
  step: string;
  metadata: string | null;
  summary: string | null;
  closedReason: string | null;
  startedAt: string;
  endedAt: string | null;
  updatedAt: string;
  instance: { instanceName: string; phoneNumber: string | null };
  agentConfig: { name: string };
  assignedUser: { name: string; email: string } | null;
  _count: { messages: number };
}

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativo (IA)" },
  { value: "waiting_human", label: "Aguard. Humano" },
  { value: "human", label: "Atend. Humano" },
  { value: "closed", label: "Encerrado" },
];

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  waiting_human: "bg-yellow-500/20 text-yellow-400",
  human: "bg-blue-500/20 text-blue-400",
  closed: "bg-gray-500/20 text-gray-400",
};

export default function SessoesPage() {
  const { data: session } = useSession() || {};
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailMessages, setDetailMessages] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    if (session?.user) loadSessions();
  }, [session, page, statusFilter, deptFilter, search]);

  async function loadSessions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      if (deptFilter) params.set("department", deptFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function viewDetail(s: Session) {
    setDetailSession(s);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${s.id}/messages`);
      const msgs = await res.json();
      setDetailMessages(msgs);
    } catch {} finally {
      setLoadingDetail(false);
    }
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }

  async function handleCloseSession(id: string) {
    if (!confirm("Deseja realmente encerrar esta sessão?")) return;
    setClosingId(id);
    try {
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (res.ok) {
        loadSessions();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao encerrar sessão");
      }
    } catch (err) {
      console.error("Error closing session:", err);
      alert("Erro ao encerrar sessão");
    } finally {
      setClosingId(null);
    }
  }

  function parseMeta(m: string | null) {
    if (!m) return {};
    try { return JSON.parse(m); } catch { return {}; }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-blue-400" />
            Sessões de Atendimento IA
          </h1>
          <p className="text-sm text-gray-400 mt-1">Histórico completo de todas as sessões</p>
        </div>
        <button onClick={loadSessions} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="Departamento"
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-36"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Bot className="w-8 h-8 mb-2" />
            <p className="text-sm">Nenhuma sessão encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700 bg-gray-800/50">
                  <th className="text-left px-4 py-3">Telefone</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Depto</th>
                  <th className="text-left px-4 py-3">Etapa</th>
                  <th className="text-left px-4 py-3">Msgs</th>
                  <th className="text-left px-4 py-3">Instância</th>
                  <th className="text-left px-4 py-3">Início</th>
                  <th className="text-left px-4 py-3">Última Ativ.</th>
                  <th className="text-left px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-white font-mono text-xs">{s.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[s.status] || "bg-gray-600 text-gray-300"}`}>
                        {statusOptions.find(o => o.value === s.status)?.label || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 capitalize text-xs">{s.department || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.step}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{s._count?.messages || 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.instance?.instanceName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(s.startedAt)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(s.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => viewDetail(s)}
                          className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/gestor/comunicacao/agentes-ia/inbox`}
                          className="p-1.5 bg-blue-600/30 hover:bg-blue-600/50 rounded text-blue-400"
                          title="Abrir no Inbox"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {s.status !== "closed" && (
                          <button
                            onClick={() => handleCloseSession(s.id)}
                            disabled={closingId === s.id}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 rounded text-red-400"
                            title="Encerrar sessão"
                          >
                            {closingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">{total} sessões encontradas</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-300">{page}/{totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailSession && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetailSession(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-start">
              <div>
                <h3 className="text-white font-bold">Sessão: {detailSession.phone}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {detailSession.instance?.instanceName} • {detailSession.agentConfig?.name} • {fmtDate(detailSession.startedAt)}
                </p>
                {detailSession.summary && (
                  <p className="text-xs text-gray-300 mt-2 bg-gray-700 rounded p-2">
                    <strong>Resumo:</strong> {detailSession.summary}
                  </p>
                )}
                {/* Metadata */}
                {detailSession.metadata && Object.keys(parseMeta(detailSession.metadata)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(parseMeta(detailSession.metadata)).map(([k, v]) => (
                      <span key={k} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                        <span className="text-gray-500">{k}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setDetailSession(null)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {loadingDetail ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
              ) : detailMessages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">Nenhuma mensagem</p>
              ) : (
                detailMessages.map((m: any) => {
                  const isClient = m.senderType === "client";
                  const bgColor = m.senderType === "ai" ? "bg-blue-600/50" : m.senderType === "human" ? "bg-green-600/50" : m.senderType === "system" ? "bg-yellow-600/30" : "bg-gray-700";
                  return (
                    <div key={m.id} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] ${bgColor} rounded-lg px-3 py-2`}>
                        <p className="text-[10px] text-gray-400 mb-0.5 capitalize">{m.senderType}</p>
                        <p className="text-sm text-white whitespace-pre-wrap">{m.content}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{fmtDate(m.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
