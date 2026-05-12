"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Bot, MessageSquare, Send, Loader2, ArrowLeft, RefreshCw,
  PhoneForwarded, X, User, Clock, CheckCircle, AlertTriangle,
  Headphones, Search,
} from "lucide-react";

interface Session {
  id: string;
  phone: string;
  remoteJid: string;
  status: string;
  department: string | null;
  step: string;
  metadata: string | null;
  summary: string | null;
  startedAt: string;
  updatedAt: string;
  instance: { instanceName: string; phoneNumber: string | null };
  agentConfig: { name: string };
  assignedUser: { name: string; email: string } | null;
  _count: { messages: number };
}

interface Msg {
  id: string;
  senderType: string;
  content: string;
  messageType: string;
  aiPayload: string | null;
  timestamp: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  waiting_human: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  human: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusLabels: Record<string, string> = {
  active: "IA Ativo",
  waiting_human: "Aguard. Humano",
  human: "Atend. Humano",
  closed: "Encerrado",
};

const senderLabels: Record<string, { label: string; color: string }> = {
  client: { label: "Cliente", color: "bg-gray-700 text-white" },
  ai: { label: "IA", color: "bg-blue-600/80 text-white" },
  human: { label: "Humano", color: "bg-green-600/80 text-white" },
  system: { label: "Sistema", color: "bg-yellow-600/40 text-yellow-300" },
};

export default function InboxPage() {
  const { data: session } = useSession() || {};
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [humanMsg, setHumanMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active,waiting_human,human");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions?${params}`);
      const data = await res.json();
      let filtered = data.sessions || [];
      if (statusFilter) {
        const statuses = statusFilter.split(",");
        filtered = filtered.filter((s: Session) => statuses.includes(s.status));
      }
      setSessions(filtered);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    if (session?.user) loadSessions();
  }, [session, loadSessions]);

  // Poll sessions every 10s
  useEffect(() => {
    pollRef.current = setInterval(loadSessions, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadSessions]);

  async function selectSession(s: Session) {
    setSelectedSession(s);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${s.id}/messages`);
      const msgs = await res.json();
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMsgs(false);
    }
  }

  // Auto-refresh messages for selected session
  useEffect(() => {
    if (!selectedSession) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${selectedSession.id}/messages`);
        const msgs = await res.json();
        setMessages(msgs);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  async function handleAction(action: string) {
    if (!selectedSession) return;
    try {
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${selectedSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadSessions();
        // Refresh selected session
        const updated = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${selectedSession.id}`);
        if (updated.ok) {
          const data = await updated.json();
          setSelectedSession({ ...selectedSession, status: data.status });
        }
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  }

  async function sendHumanMessage() {
    if (!selectedSession || !humanMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${selectedSession.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: humanMsg.trim() }),
      });
      if (res.ok) {
        setHumanMsg("");
        // Refresh messages
        const msgsRes = await fetch(`/api/gestor/comunicacao/agentes-ia/sessions/${selectedSession.id}/messages`);
        const msgs = await msgsRes.json();
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }

  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  }

  function parseMeta(meta: string | null): Record<string, any> {
    if (!meta) return {};
    try { return JSON.parse(meta); } catch { return {}; }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left: Session List */}
      <div className={`${selectedSession ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-gray-700 bg-gray-900`}>
        {/* Filters */}
        <div className="p-3 border-b border-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white">Inbox IA</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {["active,waiting_human,human", "active", "waiting_human", "human", "closed", ""].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  statusFilter === f
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
                }`}
              >
                {f === "active,waiting_human,human" ? "Abertas" : f === "" ? "Todas" : statusLabels[f] || f}
              </button>
            ))}
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p className="text-sm">Nenhuma sessão encontrada</p>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={`w-full text-left p-3 border-b border-gray-800 hover:bg-gray-800/60 transition-colors ${
                  selectedSession?.id === s.id ? "bg-gray-800" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">
                      {s.phone}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.instance?.instanceName} • {s.agentConfig?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColors[s.status]}`}>
                      {statusLabels[s.status] || s.status}
                    </span>
                    <span className="text-[10px] text-gray-500">{fmtTime(s.updatedAt)}</span>
                  </div>
                </div>
                {s.department && (
                  <span className="inline-block mt-1 text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded capitalize">
                    {s.department}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Conversation View */}
      <div className={`${selectedSession ? "flex" : "hidden md:flex"} flex-col flex-1 bg-gray-900`}>
        {!selectedSession ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Headphones className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">Selecione uma sessão</p>
            <p className="text-sm">Escolha uma conversa à esquerda para visualizar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-3 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="md:hidden p-1 hover:bg-gray-700 rounded"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <div>
                    <p className="text-white font-medium">{selectedSession.phone}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{selectedSession.instance?.instanceName}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded-full border ${statusColors[selectedSession.status]}`}>
                        {statusLabels[selectedSession.status]}
                      </span>
                      {selectedSession.department && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{selectedSession.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedSession.status === "active" || selectedSession.status === "waiting_human") && (
                    <button
                      onClick={() => handleAction("handoff")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-medium"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5" />
                      Assumir
                    </button>
                  )}
                  {selectedSession.status !== "closed" && (
                    <button
                      onClick={() => handleAction("close")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded text-xs font-medium"
                    >
                      <X className="w-3.5 h-3.5" />
                      Encerrar
                    </button>
                  )}
                  {selectedSession.status === "closed" && (
                    <button
                      onClick={() => handleAction("reactivate")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reativar
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata bar */}
              {selectedSession.metadata && Object.keys(parseMeta(selectedSession.metadata)).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(parseMeta(selectedSession.metadata)).map(([k, v]) => (
                    <span key={k} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      <span className="text-gray-500">{k}:</span> {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-gray-500 text-center text-sm">Nenhuma mensagem ainda.</p>
              ) : (
                messages.map((m) => {
                  const isClient = m.senderType === "client";
                  const info = senderLabels[m.senderType] || { label: m.senderType, color: "bg-gray-700 text-gray-300" };
                  return (
                    <div key={m.id} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 ${info.color}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {m.senderType === "ai" && <Bot className="w-3 h-3" />}
                          {m.senderType === "human" && <User className="w-3 h-3" />}
                          <span className="text-[10px] opacity-70">{info.label}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">{fmtTime(m.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Human message input (only when in human/waiting_human mode) */}
            {(selectedSession.status === "human" || selectedSession.status === "waiting_human") && (
              <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem como atendente..."
                    value={humanMsg}
                    onChange={(e) => setHumanMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendHumanMessage()}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500"
                  />
                  <button
                    onClick={sendHumanMessage}
                    disabled={!humanMsg.trim() || sending}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {selectedSession.status === "active" && (
              <div className="p-2 border-t border-gray-700 bg-gray-800/30 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Bot className="w-3 h-3" />
                  IA está respondendo automaticamente. Clique em &quot;Assumir&quot; para intervir.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
