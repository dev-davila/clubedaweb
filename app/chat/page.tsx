"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Search, Send, Loader2, Smartphone, ArrowLeft,
  Tag, X, Check, CheckCheck, Clock, Plus, RefreshCw, ChevronDown,
  FileDown, AlertCircle, ExternalLink, UserPlus, CalendarPlus, Save,
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

interface SavedContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
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

  if (mt.includes("audio") || mt.includes("ptt")) {
    return (
      <audio controls className="max-w-full" preload="metadata">
        <source src={src} type={data.mimetype} />
        Seu navegador não suporta áudio.
      </audio>
    );
  }

  if (mt.includes("video")) {
    return (
      <video controls className="max-w-full rounded-lg max-h-64" preload="metadata">
        <source src={src} type={data.mimetype} />
        Seu navegador não suporta vídeo.
      </video>
    );
  }

  const fileName = data.fileName || "documento";
  return (
    <a
      href={src}
      download={fileName}
      className="flex items-center gap-2 text-primary hover:text-primary text-sm underline py-1"
    >
      <FileDown size={16} />
      {fileName}
    </a>
  );
});

export default function StandaloneChatPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  // Check auth via API instead of useSession (avoids SSR provider issue)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data?.user) {
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("unauthenticated");
          router.replace("/gestor/login");
        }
      } catch {
        setAuthStatus("unauthenticated");
        router.replace("/gestor/login");
      }
    })();
  }, [router]);

  const status = authStatus;

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

  // Saved contacts map (phone -> contact info)
  const [savedContactsMap, setSavedContactsMap] = useState<Record<string, SavedContact>>({});

  // Contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactModalConv, setContactModalConv] = useState<Conversation | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", company: "", notes: "", tags: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalConv, setScheduleModalConv] = useState<Conversation | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ title: "", message: "", scheduledAt: "", notes: "" });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mobile: show chat panel
  const [showChat, setShowChat] = useState(false);

  // Fetch instances
  useEffect(() => {
    if (status !== "authenticated") return;
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
  }, [status]);

  // Fetch tags
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/gestor/comunicacao/tags");
        const data = await res.json();
        if (data.tags) setAllTags(data.tags);
      } catch {}
    })();
  }, [status]);

  // Fetch saved contacts and build phone->contact map
  const fetchSavedContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/contatos?limit=500");
      const data = await res.json();
      if (data.contacts) {
        const map: Record<string, SavedContact> = {};
        for (const c of data.contacts) {
          if (c.phone) map[c.phone] = { id: c.id, name: c.name, phone: c.phone, email: c.email, company: c.company };
        }
        setSavedContactsMap(map);
      }
    } catch {}
  }, []);

  // Fetch conversations
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

  // Load saved contacts when authenticated
  useEffect(() => {
    if (status === "authenticated") fetchSavedContacts();
  }, [status, fetchSavedContacts]);

  useEffect(() => {
    if (!selectedInstance) return;
    const interval = setInterval(() => fetchConversations(false), 15000);
    return () => clearInterval(interval);
  }, [selectedInstance, fetchConversations]);

  // Fetch messages
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

  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages]);

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

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowChat(true);
  };

  // Open add contact modal pre-filled from conversation (or saved contact data)
  const openAddContact = (conv: Conversation) => {
    const phone = conv.contactPhone || conv.remoteJid?.split("@")[0] || "";
    const saved = savedContactsMap[phone];
    setContactModalConv(conv);
    setContactForm({
      name: saved?.name || conv.contactName || "",
      phone,
      email: saved?.email || "",
      company: saved?.company || "",
      notes: "",
      tags: "",
    });
    setContactMsg(null);
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      setContactMsg({ type: "error", text: "Nome e telefone são obrigatórios" });
      return;
    }
    setSavingContact(true);
    setContactMsg(null);
    try {
      const normalizedPhone = contactForm.phone.replace(/\D/g, "");
      const existing = savedContactsMap[normalizedPhone];

      let res;
      if (existing) {
        // Update existing contact
        res = await fetch(`/api/gestor/comunicacao/contatos/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactForm),
        });
      } else {
        // Create new contact
        res = await fetch("/api/gestor/comunicacao/contatos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...contactForm, source: "whatsapp", instanceId: selectedInstance || undefined }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setContactMsg({ type: "success", text: existing ? "Contato atualizado!" : "Contato salvo com sucesso!" });
      fetchSavedContacts(); // refresh contacts map to show updated info
      setTimeout(() => setShowContactModal(false), 1200);
    } catch (err: any) {
      setContactMsg({ type: "error", text: err.message });
    } finally {
      setSavingContact(false);
    }
  };

  // Open schedule modal pre-filled from conversation
  const openScheduleContact = async (conv: Conversation) => {
    const phone = conv.contactPhone || conv.remoteJid?.split("@")[0] || "";
    setScheduleModalConv(conv);
    setScheduleForm({ title: "", message: "", scheduledAt: "", notes: "" });
    setScheduleMsg(null);
    setShowScheduleModal(true);
    // Check if contact already exists, if not create it first
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.scheduledAt) {
      setScheduleMsg({ type: "error", text: "Título e data são obrigatórios" });
      return;
    }
    if (!scheduleModalConv) return;
    setSavingSchedule(true);
    setScheduleMsg(null);
    try {
      const phone = scheduleModalConv.contactPhone || scheduleModalConv.remoteJid?.split("@")[0] || "";
      // First ensure contact exists (upsert via import or create)
      const contactRes = await fetch("/api/gestor/comunicacao/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scheduleModalConv.contactName || phone,
          phone,
          source: "whatsapp",
          instanceId: selectedInstance || undefined,
        }),
      });
      let contactId: string;
      if (contactRes.ok) {
        const c = await contactRes.json();
        contactId = c.id;
      } else if (contactRes.status === 409) {
        // Contact already exists, find it
        const searchRes = await fetch(`/api/gestor/comunicacao/contatos?search=${phone}&limit=1`);
        const searchData = await searchRes.json();
        if (searchData.contacts?.length > 0) {
          contactId = searchData.contacts[0].id;
        } else {
          throw new Error("Contato não encontrado");
        }
      } else {
        throw new Error("Erro ao criar contato");
      }

      // Now create the schedule
      const schedRes = await fetch(`/api/gestor/comunicacao/contatos/${contactId}/agendamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      const schedData = await schedRes.json();
      if (!schedRes.ok) throw new Error(schedData.error || "Erro ao agendar");
      setScheduleMsg({ type: "success", text: "Agendamento criado!" });
      setTimeout(() => setShowScheduleModal(false), 1200);
    } catch (err: any) {
      setScheduleMsg({ type: "error", text: err.message });
    } finally {
      setSavingSchedule(false);
    }
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

  // Get saved contact data for a conversation (by phone match)
  const getSavedContact = (conv: Conversation): SavedContact | null => {
    const phone = conv.contactPhone || conv.remoteJid?.split("@")[0] || "";
    return savedContactsMap[phone] || null;
  };

  const getContactDisplay = (conv: Conversation) => {
    const saved = getSavedContact(conv);
    if (saved) return saved.name;
    if (conv.contactName) return conv.contactName;
    if (conv.contactPhone) return conv.contactPhone;
    return conv.remoteJid?.split("@")[0] || "Desconhecido";
  };

  const getStatusIcon = (status: string | null) => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "READ":
      case "PLAYED":
        return <CheckCheck size={16} className="text-primary" />;
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

  if (status === "loading" || loadingInstances) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto" size={40} />
          <p className="text-gray-500 mt-3 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-sm">
          <Smartphone className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-700 font-semibold">Nenhuma instância conectada</p>
          <p className="text-gray-400 text-sm mt-1">Conecte uma instância do WhatsApp primeiro</p>
          <a href="/gestor/comunicacao/instancias" className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary font-medium text-sm">
            <Plus size={16} /> Ir para Instâncias
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="text-white" size={18} />
          </div>
          <span className="font-semibold text-gray-800 text-sm hidden sm:inline">M3 Chat</span>
        </div>
        <select
          value={selectedInstance}
          onChange={(e) => { setSelectedInstance(e.target.value); setSelectedConversation(null); setShowChat(false); }}
          className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
        >
          {instances.map((i) => (
            <option key={i.id} value={i.id}>{i.instanceName} {i.phoneNumber ? `(${i.phoneNumber})` : ""}</option>
          ))}
        </select>
        <button onClick={() => fetchConversations(true)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Atualizar">
          <RefreshCw size={16} />
        </button>
        <div className="flex-1" />
        <a href="/gestor" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1" title="Voltar ao Gestor">
          <ExternalLink size={12} /> Gestor
        </a>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r bg-white flex flex-col ${showChat ? "hidden md:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Buscar conversa..."
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-green-600" size={24} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-400">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const saved = getSavedContact(conv);
                return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition cursor-pointer group ${selectedConversation?.id === conv.id ? "bg-green-50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">{getContactDisplay(conv)}</span>
                        {saved && (
                          <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" title="Contato salvo" />
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {/* Saved contact info: company & email */}
                      {saved && (saved.company || saved.email) && (
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-primary">
                          {saved.company && (
                            <span className="truncate max-w-[120px]" title={saved.company}>{saved.company}</span>
                          )}
                          {saved.company && saved.email && <span className="text-gray-300">•</span>}
                          {saved.email && (
                            <span className="truncate max-w-[120px]" title={saved.email}>{saved.email}</span>
                          )}
                        </div>
                      )}
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
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <span className="text-[10px] text-gray-400">{formatTime(conv.lastMessageAt)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!saved ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); openAddContact(conv); }}
                            className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                            title="Salvar Contato"
                          >
                            <UserPlus size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); openAddContact(conv); }}
                            className="p-1 rounded hover:bg-green-100 text-green-500 hover:text-green-700 transition-colors"
                            title="Editar Contato"
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openScheduleContact(conv); }}
                          className="p-1 rounded hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                          title="Agendar Mensagem"
                        >
                          <CalendarPlus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col ${!showChat && !selectedConversation ? "hidden md:flex" : showChat ? "flex" : "hidden md:flex"}`}>
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
                <button onClick={() => setShowChat(false)} className="md:hidden p-1 hover:bg-gray-200 rounded-lg">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{getContactDisplay(selectedConversation)}</h3>
                  {(() => {
                    const sc = getSavedContact(selectedConversation);
                    return sc && (sc.company || sc.email) ? (
                      <p className="text-[11px] text-primary truncate">
                        {[sc.company, sc.email].filter(Boolean).join(" • ")}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 truncate">{selectedConversation.remoteJid?.split("@")[0]}</p>
                    );
                  })()}
                </div>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#e5ddd5]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-500 bg-white/80 inline-block px-4 py-2 rounded-xl">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 shadow-sm ${
                        msg.fromMe
                          ? "bg-[#dcf8c6] text-gray-900 rounded-tr-none"
                          : "bg-white text-gray-900 rounded-tl-none"
                      }`}>
                        {/* Media content */}
                        {msg.mediaType && !["conversation", "extendedTextMessage", "text"].includes(msg.mediaType) && selectedConversation && (
                          <MediaMessage messageId={msg.messageId} conversationId={selectedConversation.id} mediaType={msg.mediaType} />
                        )}
                        {/* Text content */}
                        {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                        <div className={`flex items-center gap-1 mt-1 ${msg.fromMe ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.fromMe && getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-3 border-t bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none max-h-32"
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

      {/* Contact Modal */}
      {showContactModal && contactModalConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold text-gray-900">{savedContactsMap[contactForm.phone?.replace(/\D/g, "") || ""] ? "Editar Contato" : "Salvar Contato"}</h2>
              <button onClick={() => setShowContactModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-3">
              {contactMsg && (
                <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${contactMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {contactMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {contactMsg.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input type="text" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Nome do contato" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                <input type="text" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-50" placeholder="5511999999999" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                <input type="text" value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Nome da empresa" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                <input type="text" value={contactForm.tags} onChange={e => setContactForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="cliente, prospect (separados por vírgula)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none" placeholder="Notas adicionais..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowContactModal(false)} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleSaveContact} disabled={savingContact}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-1.5">
                {savingContact ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && scheduleModalConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-base font-bold text-gray-900">Agendar Mensagem</h2>
                <p className="text-xs text-gray-500">{getContactDisplay(scheduleModalConv)}</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-3">
              {scheduleMsg && (
                <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${scheduleMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {scheduleMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {scheduleMsg.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input type="text" value={scheduleForm.title} onChange={e => setScheduleForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Ex: Follow-up proposta comercial" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data e Hora *</label>
                <input type="datetime-local" value={scheduleForm.scheduledAt} onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mensagem pré-definida</label>
                <textarea value={scheduleForm.message} onChange={e => setScheduleForm(f => ({ ...f, message: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none" placeholder="Mensagem a enviar quando chegar a hora..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none" placeholder="Notas sobre este agendamento..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleSaveSchedule} disabled={savingSchedule}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary disabled:opacity-50 transition flex items-center gap-1.5">
                {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />} Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
