"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare, Search, Send, Loader2, Smartphone, ArrowLeft,
  Tag, X, Check, CheckCheck, Clock, Plus, RefreshCw, ChevronDown,
  Image as ImageIcon, FileAudio, FileVideo, FileDown, AlertCircle,
  Bot, UserCheck, PhoneForwarded, ThumbsUp, ThumbsDown, MessageCircle, GraduationCap,
} from "lucide-react";

interface Instance {
  id: string;
  instanceName: string;
  phoneNumber: string | null;
  status: string;
}

interface Conversation {
  id: string;
  remoteJid: string;
  contactName: string | null;
  contactPhone: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface Message {
  id: string;
  messageId: string;
  fromMe: boolean;
  content: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  timestamp: string;
  status: string | null;
}

interface WaTag {
  id: string;
  name: string;
  color: string;
}

interface AiSessionInfo {
  id: string;
  status: string; // active | waiting_human | human | closed
  department: string | null;
  step: string | null;
  agentName: string;
  agentModel: string;
  assignedUser: { name: string | null; email: string } | null;
  startedAt: string;
  updatedAt: string;
}

// MediaMessage: lazily fetches base64 content from Evolution API
const MediaMessage = memo(function MediaMessage({ messageId, conversationId, mediaType }: { messageId: string; conversationId: string; mediaType: string }) {
  const [data, setData] = useState<{ base64: string; mimetype: string; fileName: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/gestor/comunicacao/media?messageId=${encodeURIComponent(messageId)}&conversationId=${encodeURIComponent(conversationId)}`);
        if (!res.ok) throw new Error("Falha ao carregar mídia");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [messageId, conversationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 px-1 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs">Carregando mídia...</span>
      </div>
    );
  }

  if (error || !data?.base64) {
    const label = mediaType?.replace("Message", "") || "mídia";
    return (
      <div className="flex items-center gap-2 py-1 px-1 text-gray-400">
        <AlertCircle size={14} />
        <span className="text-xs italic">Não foi possível carregar [{label}]</span>
      </div>
    );
  }

  const src = `data:${data.mimetype};base64,${data.base64}`;
  const mt = mediaType?.toLowerCase() || "";

  // Image or Sticker
  if (mt.includes("image") || mt.includes("sticker")) {
    return (
      <img
        src={src}
        alt={data.fileName || "Imagem"}
        className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer"
        onClick={() => window.open(src, "_blank")}
      />
    );
  }

  // Audio
  if (mt.includes("audio") || mt.includes("ptt")) {
    return (
      <audio controls className="max-w-full" preload="metadata">
        <source src={src} type={data.mimetype} />
        Seu navegador não suporta áudio.
      </audio>
    );
  }

  // Video
  if (mt.includes("video")) {
    return (
      <video controls className="max-w-full rounded-lg max-h-64" preload="metadata">
        <source src={src} type={data.mimetype} />
        Seu navegador não suporta vídeo.
      </video>
    );
  }

  // Document / other
  const fileName = data.fileName || "documento";
  return (
    <a
      href={src}
      download={fileName}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm underline py-1"
    >
      <FileDown size={16} />
      {fileName}
    </a>
  );
});

export default function MensagensPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <MensagensPage />
    </Suspense>
  );
}

function MensagensPage() {
  const { data: session } = useSession() || {};
  const searchParams = useSearchParams();
  const convFromUrl = searchParams?.get("conv") || null;
  const [autoSelectDone, setAutoSelectDone] = useState(false);

  // Instance selection
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [loadingInstances, setLoadingInstances] = useState(true);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tags
  const [allTags, setAllTags] = useState<WaTag[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);

  // AI session info for selected conversation
  const [aiSessionInfo, setAiSessionInfo] = useState<AiSessionInfo | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Training mode feedback
  const [trainingEnabled, setTrainingEnabled] = useState(false);
  const [aiTrainingMessages, setAiTrainingMessages] = useState<Array<{
    id: string; content: string; timestamp: string;
    feedbackStatus: string | null; feedbackComment: string | null;
  }>>([]);
  const [feedbackModal, setFeedbackModal] = useState<{ messageId: string; action: "accepted" | "rejected" } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedbackIds, setSubmittingFeedbackIds] = useState<Set<string>>(new Set());

  // Mobile: show chat panel
  const [showChat, setShowChat] = useState(false);

  // Fetch instances
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gestor/comunicacao/instancias");
        const data = await res.json();
        const connected = (data.instances || []).filter((i: Instance) => i.status === "open" || i.status === "connected");
        setInstances(connected);
        if (connected.length > 0) setSelectedInstance(connected[0].id);
      } catch {} finally {
        setLoadingInstances(false);
      }
    })();
  }, []);

  // Fetch tags
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gestor/comunicacao/tags");
        const data = await res.json();
        if (data.tags) setAllTags(data.tags);
      } catch {}
    })();
  }, []);

  // Fetch conversations (full sync from Evolution API)
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (!selectedInstance) return;
    if (showLoading) setLoadingConversations(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/mensagens?instanceId=${selectedInstance}`);
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {} finally {
      if (showLoading) setLoadingConversations(false);
    }
  }, [selectedInstance]);

  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // Auto-select conversation from URL param (?conv=xxx)
  useEffect(() => {
    if (autoSelectDone || !convFromUrl || conversations.length === 0) return;
    const target = conversations.find(c => c.id === convFromUrl);
    if (target) {
      setSelectedConversation(target);
      setShowChat(true);
      setAutoSelectDone(true);
    }
  }, [conversations, convFromUrl, autoSelectDone]);

  // Poll conversations every 15 seconds (full sync to catch new chats)
  useEffect(() => {
    if (!selectedInstance) return;
    const interval = setInterval(() => fetchConversations(false), 15000);
    return () => clearInterval(interval);
  }, [selectedInstance, fetchConversations]);

  // Fetch messages (full sync from Evolution API)
  const fetchMessages = useCallback(async (showLoading = true) => {
    if (!selectedConversation) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/mensagens?conversationId=${selectedConversation.id}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {} finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  // Poll messages every 5 seconds (full sync to always get latest messages)
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSending(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConversation.id, text: newMessage.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewMessage("");
      // Refresh messages
      setTimeout(fetchMessages, 500);
    } catch {} finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fetch AI session status for a conversation
  const fetchAiStatus = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/gestor/comunicacao/mensagens/ai-status?conversationId=${encodeURIComponent(convId)}`);
      if (!res.ok) { setAiSessionInfo(null); return; }
      const data = await res.json();
      setAiSessionInfo(data.hasAiSession ? data.session : null);
    } catch {
      setAiSessionInfo(null);
    }
  }, []);

  // Transfer from AI to human
  const handleTransferToHuman = async () => {
    if (!selectedConversation || !aiSessionInfo) return;
    setTransferring(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/mensagens/ai-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConversation.id, sessionId: aiSessionInfo.id }),
      });
      if (res.ok) {
        // Refresh AI status
        await fetchAiStatus(selectedConversation.id);
      }
    } catch {} finally {
      setTransferring(false);
    }
  };

  // Fetch AI training messages for feedback
  const fetchTrainingMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/gestor/comunicacao/mensagens/ai-messages?conversationId=${encodeURIComponent(convId)}`);
      if (!res.ok) { setTrainingEnabled(false); setAiTrainingMessages([]); return; }
      const data = await res.json();
      setTrainingEnabled(data.trainingEnabled || false);
      setAiTrainingMessages(data.messages || []);
    } catch {
      setTrainingEnabled(false);
      setAiTrainingMessages([]);
    }
  }, []);

  // Submit feedback for an AI message (supports parallel submissions)
  const submitFeedback = async (messageId: string, status: "accepted" | "rejected", comment?: string) => {
    setSubmittingFeedbackIds(prev => new Set(prev).add(messageId));
    try {
      const res = await fetch("/api/gestor/comunicacao/mensagens/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status, comment: comment || "" }),
      });
      if (res.ok) {
        setAiTrainingMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, feedbackStatus: status, feedbackComment: comment || null } : m
        ));
        setFeedbackModal(null);
        setFeedbackComment("");
      }
    } catch {} finally {
      setSubmittingFeedbackIds(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  // Poll AI status when conversation is selected
  useEffect(() => {
    if (!selectedConversation) { setAiSessionInfo(null); setTrainingEnabled(false); setAiTrainingMessages([]); return; }
    fetchAiStatus(selectedConversation.id);
    fetchTrainingMessages(selectedConversation.id);
    const interval = setInterval(() => fetchAiStatus(selectedConversation.id), 10000);
    return () => clearInterval(interval);
  }, [selectedConversation, fetchAiStatus, fetchTrainingMessages]);

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowChat(true);
  };

  const toggleTag = async (tagId: string) => {
    if (!selectedConversation) return;
    const hasTag = selectedConversation.tags?.some((t) => t.tag.id === tagId);
    try {
      await fetch("/api/gestor/comunicacao/tags/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          tagId,
          action: hasTag ? "remove" : "assign",
        }),
      });
      fetchConversations();
      // Update selected conversation tags locally
      if (hasTag) {
        setSelectedConversation({
          ...selectedConversation,
          tags: selectedConversation.tags.filter((t) => t.tag.id !== tagId),
        });
      } else {
        const tag = allTags.find((t) => t.id === tagId);
        if (tag) {
          setSelectedConversation({
            ...selectedConversation,
            tags: [...(selectedConversation.tags || []), { tag }],
          });
        }
      }
    } catch {}
  };

  const TZ = "America/Sao_Paulo";
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const todayBRT = now.toLocaleDateString("pt-BR", { timeZone: TZ });
    const dateBRT = d.toLocaleDateString("pt-BR", { timeZone: TZ });
    if (todayBRT === dateBRT) return d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });
  };

  const getContactDisplay = (conv: Conversation) => {
    if (conv.contactName) return conv.contactName;
    if (conv.contactPhone) return conv.contactPhone;
    return conv.remoteJid?.split("@")[0] || "Desconhecido";
  };

  const getStatusIcon = (status: string | null) => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "READ":
      case "PLAYED":
        return <CheckCheck size={16} className="text-blue-500" />;
      case "DELIVERY_ACK":
      case "DELIVERED":
        return <CheckCheck size={16} className="text-gray-400" />;
      case "SERVER_ACK":
      case "SENT":
        return <Check size={16} className="text-gray-400" />;
      case "PENDING":
        return <Clock size={16} className="text-gray-400" />;
      default:
        return null;
    }
  };

  // Pre-compute mapping from chat messages to AI training messages for feedback
  // Uses a stable map keyed by message index to avoid render-time mutation
  const trainingMatchMap = useMemo(() => {
    if (!trainingEnabled || aiTrainingMessages.length === 0 || messages.length === 0) return new Map<number, typeof aiTrainingMessages[0]>();
    const map = new Map<number, typeof aiTrainingMessages[0]>();
    const usedIds = new Set<string>();

    // For each chat message (from bot/me), find the best matching training message
    messages.forEach((msg, idx) => {
      if (!msg.fromMe || !msg.content) return;
      const msgTime = new Date(msg.timestamp).getTime();

      // Exact content match first
      let match = aiTrainingMessages.find(am =>
        !usedIds.has(am.id) && am.content === msg.content
      );
      // Partial content + time proximity fallback
      if (!match) {
        match = aiTrainingMessages.find(am =>
          !usedIds.has(am.id) &&
          msg.content && am.content &&
          (msg.content.includes(am.content.slice(0, 60)) || am.content.includes(msg.content.slice(0, 60))) &&
          Math.abs(new Date(am.timestamp).getTime() - msgTime) < 60000
        );
      }
      if (match) {
        usedIds.add(match.id);
        map.set(idx, match);
      }
    });
    return map;
  }, [trainingEnabled, aiTrainingMessages, messages]);

  const filteredConversations = conversations.filter((c) => {
    if (!conversationSearch) return true;
    const q = conversationSearch.toLowerCase();
    return (
      (c.contactName?.toLowerCase().includes(q)) ||
      (c.contactPhone?.toLowerCase().includes(q)) ||
      (c.remoteJid?.toLowerCase().includes(q)) ||
      (c.lastMessage?.toLowerCase().includes(q))
    );
  });

  if (loadingInstances) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border">
        <Smartphone className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Nenhuma instância conectada</p>
        <p className="text-gray-400 text-sm mt-1">Conecte uma instância do WhatsApp primeiro</p>
        <a href="/gestor/comunicacao/instancias" className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
          <Plus size={16} /> Ir para Instâncias
        </a>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Instance selector */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={selectedInstance}
          onChange={(e) => { setSelectedInstance(e.target.value); setSelectedConversation(null); setShowChat(false); }}
          className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          {instances.map((i) => (
            <option key={i.id} value={i.id}>{i.instanceName} {i.phoneNumber ? `(${i.phoneNumber})` : ""}</option>
          ))}
        </select>
        <button onClick={() => fetchConversations(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex bg-white rounded-2xl border overflow-hidden min-h-0">
        {/* Conversations sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${showChat ? "hidden md:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Buscar conversa..."
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-400">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition ${selectedConversation?.id === conv.id ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">{getContactDisplay(conv)}</span>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                      )}
                      {conv.tags && conv.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {conv.tags.map((t) => (
                            <span key={t.tag.id} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: t.tag.color }}>
                              {t.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col ${!showChat && !selectedConversation ? "hidden md:flex" : showChat ? "flex" : "hidden md:flex"}`}>
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
                <button onClick={() => setShowChat(false)} className="md:hidden p-1 hover:bg-gray-200 rounded-lg">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{getContactDisplay(selectedConversation)}</h3>
                  <p className="text-xs text-gray-400 truncate">{selectedConversation.remoteJid?.split("@")[0]}</p>
                </div>

                {/* AI Status Badge */}
                {aiSessionInfo ? (
                  <div className="flex items-center gap-2">
                    {aiSessionInfo.status === "active" && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <Bot size={12} /> IA: {aiSessionInfo.agentName}
                        </span>
                        <button
                          onClick={handleTransferToHuman}
                          disabled={transferring}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          {transferring ? <Loader2 size={12} className="animate-spin" /> : <PhoneForwarded size={12} />}
                          Assumir
                        </button>
                      </>
                    )}
                    {aiSessionInfo.status === "waiting_human" && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                          <Clock size={12} /> Aguardando humano
                        </span>
                        <button
                          onClick={handleTransferToHuman}
                          disabled={transferring}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          {transferring ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                          Assumir
                        </button>
                      </>
                    )}
                    {aiSessionInfo.status === "human" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <UserCheck size={12} /> Humano: {aiSessionInfo.assignedUser?.name || aiSessionInfo.assignedUser?.email || "—"}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    <MessageSquare size={12} /> Sem IA
                  </span>
                )}

                {trainingEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    <GraduationCap size={12} /> Treinamento
                  </span>
                )}

                {/* Tag button */}
                <div className="relative">
                  <button onClick={() => setShowTagMenu(!showTagMenu)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition">
                    <Tag size={14} /> Tags
                    <ChevronDown size={12} />
                  </button>
                  {showTagMenu && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border shadow-xl z-10 p-2">
                      <p className="text-xs text-gray-400 px-2 py-1 font-medium">Gerenciar Tags</p>
                      {allTags.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-2">Nenhuma tag criada</p>
                      ) : (
                        allTags.map((tag) => {
                          const isActive = selectedConversation.tags?.some((t) => t.tag.id === tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTag(tag.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition text-left"
                            >
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: tag.color }} />
                              <span className="text-sm text-gray-700 flex-1">{tag.name}</span>
                              {isActive && <Check size={14} className="text-green-500" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#e5ddd5]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='https://i.pinimg.com/736x/c5/c0/43/c5c043efd1b2014204db81a1a535311a.jpg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-500 bg-white/80 inline-block px-4 py-2 rounded-xl">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map((msg, msgIdx) => {
                    // Use pre-computed training match map (no render-time mutation)
                    const aiMatch = trainingMatchMap.get(msgIdx) || null;

                    return (
                      <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%]">
                          <div className={`rounded-xl px-3 py-2 shadow-sm ${
                            msg.fromMe
                              ? "bg-[#dcf8c6] text-gray-900 rounded-tr-none"
                              : "bg-white text-gray-900 rounded-tl-none"
                          }`}>
                            {/* Media content */}
                            {msg.mediaType && !["conversation", "extendedTextMessage", "text"].includes(msg.mediaType) && selectedConversation && (
                              <MediaMessage messageId={msg.messageId} conversationId={selectedConversation.id} mediaType={msg.mediaType} />
                            )}
                            {/* Text content (caption or text message) */}
                            {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                            <div className={`flex items-center gap-1 mt-1 ${msg.fromMe ? "justify-end" : ""}`}>
                              <span className="text-[10px] text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {msg.fromMe && getStatusIcon(msg.status)}
                            </div>
                          </div>
                          {/* Training feedback buttons */}
                          {aiMatch && (
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              {aiMatch.feedbackStatus === "accepted" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                  <ThumbsUp size={10} /> Aprovada
                                </span>
                              ) : aiMatch.feedbackStatus === "rejected" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full" title={aiMatch.feedbackComment || ""}>
                                  <ThumbsDown size={10} /> Rejeitada
                                  {aiMatch.feedbackComment && <MessageCircle size={9} />}
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => submitFeedback(aiMatch.id, "accepted")}
                                    className="p-1 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600 transition"
                                    title="Aprovar resposta"
                                  >
                                    <ThumbsUp size={13} />
                                  </button>
                                  <button
                                    onClick={() => { setFeedbackModal({ messageId: aiMatch.id, action: "rejected" }); setFeedbackComment(""); }}
                                    className="p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
                                    title="Rejeitar resposta"
                                  >
                                    <ThumbsDown size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-3 border-t bg-gray-50">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none max-h-32"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium">Selecione uma conversa</p>
                <p className="text-sm text-gray-400 mt-1">Escolha um contato para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Comment Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md mx-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <ThumbsDown size={16} className="text-red-500" /> Rejeitar Resposta da IA
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Descreva por que esta resposta está incorreta ou inadequada. O feedback será usado para melhorar o agente automaticamente.
            </p>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Ex: A resposta prometeu um desconto que não existe, deveria ter encaminhado ao financeiro..."
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setFeedbackModal(null); setFeedbackComment(""); }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => feedbackModal && submitFeedback(feedbackModal.messageId, "rejected", feedbackComment)}
                disabled={(feedbackModal ? submittingFeedbackIds.has(feedbackModal.messageId) : false) || !feedbackComment.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {feedbackModal && submittingFeedbackIds.has(feedbackModal.messageId) ? <Loader2 size={14} className="animate-spin" /> : "Rejeitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
