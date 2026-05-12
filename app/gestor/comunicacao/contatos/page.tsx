"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Users, Plus, Pencil, Trash2, Loader2, X, Save, Search,
  Phone, Mail, Building2, Calendar, Clock, MessageSquare,
  Download, CheckCircle, AlertCircle, Tag, FileText, ChevronDown, ChevronUp,
  CalendarPlus, Check, XCircle, Send,
} from "lucide-react";

// ─── Autocomplete Input ────────────────────────────────────────────
function AutocompleteInput({
  value, onChange, suggestions, placeholder, label, icon,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes((filter || value).toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFilter(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); setFilter(""); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tag Input with autocomplete ───────────────────────────────────
function TagInput({
  value, onChange, suggestions, placeholder, label,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse existing tags
  const tags = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Filter suggestions: exclude already-added tags and match current input
  const filtered = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()) &&
           s.toLowerCase().includes(currentInput.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    const newTags = [...tags, trimmed];
    onChange(newTags.join(", "));
    setCurrentInput("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (idx: number) => {
    const newTags = tags.filter((_, i) => i !== idx);
    onChange(newTags.join(", "));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(currentInput);
    } else if (e.key === "Backspace" && !currentInput && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div
        className="flex flex-wrap gap-1.5 items-center min-h-[38px] px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => { setCurrentInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[100px] bg-transparent text-gray-900 dark:text-white text-sm outline-none py-0.5"
          placeholder={tags.length === 0 ? placeholder : "Adicionar..."}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
            >
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface WaContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  tags: string | null;
  source: string | null;
  remoteJid: string | null;
  instanceId: string | null;
  instance: { instanceName: string } | null;
  createdAt: string;
  updatedAt: string;
  scheduledContacts: ScheduledContact[];
}

interface ScheduledContact {
  id: string;
  title: string;
  message: string | null;
  scheduledAt: string;
  status: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  autoSend?: boolean;
  sentAt?: string | null;
  sentError?: string | null;
}

interface Instance {
  id: string;
  instanceName: string;
  status: string;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  company: "",
  notes: "",
  tags: "",
  instanceId: "",
};

const emptyScheduleForm = {
  title: "",
  message: "",
  scheduledAt: "",
  notes: "",
  autoSend: true,
};

export default function ContatosPage() {
  const { data: session } = useSession() || {};
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<WaContact | null>(null);
  const [contactForm, setContactForm] = useState(emptyForm);

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForContact, setScheduleForContact] = useState<WaContact | null>(null);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledContact | null>(null);

  // Detail panel
  const [selectedContact, setSelectedContact] = useState<WaContact | null>(null);
  const [contactSchedules, setContactSchedules] = useState<ScheduledContact[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importInstanceId, setImportInstanceId] = useState("");

  // Suggestions for autocomplete
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await fetch(`/api/gestor/comunicacao/contatos?${params}`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced]);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/instancias");
      const data = await res.json();
      if (res.ok) setInstances(Array.isArray(data) ? data : data.instances || []);
    } catch {}
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/comunicacao/contatos/suggestions");
      const data = await res.json();
      if (res.ok) {
        setCompanySuggestions(data.companies || []);
        setTagSuggestions(data.tags || []);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetchInstances(); }, [fetchInstances]);
  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // CONTACT CRUD
  const openNewContact = () => {
    setEditingContact(null);
    setContactForm(emptyForm);
    setShowContactModal(true);
  };

  const openEditContact = (c: WaContact) => {
    setEditingContact(c);
    setContactForm({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      company: c.company || "",
      notes: c.notes || "",
      tags: c.tags || "",
      instanceId: c.instanceId || "",
    });
    setShowContactModal(true);
  };

  const saveContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      showMsg("error", "Nome e telefone são obrigatórios");
      return;
    }
    setActionLoading(true);
    try {
      const url = editingContact
        ? `/api/gestor/comunicacao/contatos/${editingContact.id}`
        : "/api/gestor/comunicacao/contatos";
      const res = await fetch(url, {
        method: editingContact ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg("success", editingContact ? "Contato atualizado" : "Contato criado");
      setShowContactModal(false);
      fetchContacts();
      fetchSuggestions();
      if (selectedContact?.id === editingContact?.id) {
        setSelectedContact(null);
      }
    } catch (err: any) {
      showMsg("error", err.message || "Erro ao salvar");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Excluir este contato e todos os agendamentos?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      showMsg("success", "Contato excluído");
      if (selectedContact?.id === id) setSelectedContact(null);
      fetchContacts();
    } catch (err: any) {
      showMsg("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // SCHEDULE CRUD
  const fetchSchedules = async (contactId: string) => {
    setLoadingSchedules(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/${contactId}/agendamentos`);
      const data = await res.json();
      if (res.ok) setContactSchedules(data);
    } catch {}
    setLoadingSchedules(false);
  };

  const openSchedule = (contact: WaContact) => {
    setScheduleForContact(contact);
    setEditingSchedule(null);
    setScheduleForm(emptyScheduleForm);
    setShowScheduleModal(true);
  };

  const openEditSchedule = (contact: WaContact, schedule: ScheduledContact) => {
    setScheduleForContact(contact);
    setEditingSchedule(schedule);
    setScheduleForm({
      title: schedule.title,
      message: schedule.message || "",
      scheduledAt: schedule.scheduledAt ? toLocalInput(schedule.scheduledAt) : "",
      notes: schedule.notes || "",
      autoSend: schedule.autoSend !== false,
    });
    setShowScheduleModal(true);
  };

  const saveSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.scheduledAt) {
      showMsg("error", "Título e data são obrigatórios");
      return;
    }
    setActionLoading(true);
    try {
      let res;
      if (editingSchedule) {
        res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${editingSchedule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scheduleForm),
        });
      } else {
        res = await fetch(`/api/gestor/comunicacao/contatos/${scheduleForContact!.id}/agendamentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scheduleForm),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg("success", editingSchedule ? "Agendamento atualizado" : "Agendamento criado");
      setShowScheduleModal(false);
      if (selectedContact?.id === scheduleForContact?.id) {
        fetchSchedules(scheduleForContact!.id);
      }
      fetchContacts();
    } catch (err: any) {
      showMsg("error", err.message || "Erro ao salvar");
    } finally {
      setActionLoading(false);
    }
  };

  const updateScheduleStatus = async (scheduleId: string, status: string) => {
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showMsg("success", status === "done" ? "Marcado como concluído" : "Status atualizado");
      if (selectedContact) fetchSchedules(selectedContact.id);
      fetchContacts();
    } catch {
      showMsg("error", "Erro ao atualizar status");
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Excluir este agendamento?")) return;
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${scheduleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showMsg("success", "Agendamento excluído");
      if (selectedContact) fetchSchedules(selectedContact.id);
      fetchContacts();
    } catch {
      showMsg("error", "Erro ao excluir");
    }
  };

  // IMPORT
  const handleImport = async () => {
    if (!importInstanceId) {
      showMsg("error", "Selecione uma instância");
      return;
    }
    setImportLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/contatos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: importInstanceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg("success", `Importados: ${data.imported} | Ignorados: ${data.skipped}`);
      setShowImportModal(false);
      fetchContacts();
    } catch (err: any) {
      showMsg("error", err.message || "Erro ao importar");
    } finally {
      setImportLoading(false);
    }
  };

  const selectContact = (c: WaContact) => {
    setSelectedContact(c);
    fetchSchedules(c.id);
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    if (phone.length === 12) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
    return phone;
  };

  const TZ = "America/Sao_Paulo";
  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (d: string) => {
    return new Date(d).toLocaleString("pt-BR", {
      timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Convert a UTC ISO string to the datetime-local value in BRT for input fields
  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Contatos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} contato{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Importar do WhatsApp
          </button>
          <button
            onClick={openNewContact}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Contato
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, email, empresa ou tags..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Contact list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                {searchDebounced ? "Nenhum contato encontrado" : "Nenhum contato cadastrado"}
              </p>
              {!searchDebounced && (
                <button onClick={openNewContact} className="mt-3 text-sm text-blue-600 hover:underline">
                  Adicionar primeiro contato
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => {
                const nextSchedule = c.scheduledContacts?.[0];
                const isOverdue = nextSchedule && new Date(nextSchedule.scheduledAt) < new Date();
                return (
                  <div
                    key={c.id}
                    onClick={() => selectContact(c)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selectedContact?.id === c.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.name}</h3>
                          {c.source === "whatsapp" && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">WA</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {formatPhone(c.phone)}
                          </span>
                          {c.email && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {c.email}
                            </span>
                          )}
                          {c.company && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {c.company}
                            </span>
                          )}
                        </div>
                        {c.tags && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {c.tags.split(",").map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {nextSchedule && (
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            isOverdue
                              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                              : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {formatDate(nextSchedule.scheduledAt)}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openSchedule(c); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Agendar contato"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditContact(c); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteContact(c.id); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedContact && (
          <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 lg:sticky lg:top-4 self-start">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedContact.name}</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Contact info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`https://wa.me/${selectedContact.phone}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 hover:underline">
                  {formatPhone(selectedContact.phone)}
                </a>
              </div>
              {selectedContact.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${selectedContact.email}`} className="hover:text-blue-600 hover:underline">{selectedContact.email}</a>
                </div>
              )}
              {selectedContact.company && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {selectedContact.company}
                </div>
              )}
              {selectedContact.instance && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  {selectedContact.instance.instanceName}
                </div>
              )}
              {selectedContact.tags && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedContact.tags.split(",").map((tag, i) => (
                    <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              {selectedContact.notes && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Observações</p>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedContact.notes}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 pt-2">Criado em {formatDate(selectedContact.createdAt)}</p>
            </div>

            {/* Schedules */}
            <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Agendamentos
                </h3>
                <button
                  onClick={() => openSchedule(selectedContact)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Novo
                </button>
              </div>

              {loadingSchedules ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : contactSchedules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum agendamento</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contactSchedules.map((s) => {
                    const isOverdue = s.status === "pending" && new Date(s.scheduledAt) < new Date();
                    return (
                      <div
                        key={s.id}
                        className={`p-3 rounded-lg border text-sm ${
                          s.status === "sent"
                            ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                            : s.status === "done"
                            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                            : s.status === "failed"
                            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                            : s.status === "cancelled"
                            ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60"
                            : isOverdue
                            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                            : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{s.title}</p>
                              {s.status === "sent" && (
                                <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  <Send className="h-2.5 w-2.5" /> Enviado
                                </span>
                              )}
                              {s.status === "failed" && (
                                <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                  <AlertCircle className="h-2.5 w-2.5" /> Falhou
                                </span>
                              )}
                              {s.autoSend !== false && s.status === "pending" && (
                                <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  <Send className="h-2.5 w-2.5" /> Auto
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {formatDateTime(s.scheduledAt)}
                            </p>
                            {s.message && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{s.message}</p>
                            )}
                            {s.sentError && (
                              <p className="text-xs text-red-500 mt-1 truncate">Erro: {s.sentError}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {(s.status === "pending" || s.status === "failed") && (
                              <button
                                onClick={() => updateScheduleStatus(s.id, "done")}
                                className="p-1 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                title="Marcar como concluído"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {s.status === "pending" && (
                              <button
                                onClick={() => updateScheduleStatus(s.id, "cancelled")}
                                className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Cancelar"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditSchedule(selectedContact, s)}
                              className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSchedule(s.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/${selectedContact.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </a>
              <button
                onClick={() => openEditContact(selectedContact)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======= MODALS ======= */}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowContactModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingContact ? "Editar Contato" : "Novo Contato"}
              </h2>
              <button onClick={() => setShowContactModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone *</label>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="5511999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              <AutocompleteInput
                label="Empresa"
                value={contactForm.company}
                onChange={(v) => setContactForm(f => ({ ...f, company: v }))}
                suggestions={companySuggestions}
                placeholder="Nome da empresa"
              />
              <TagInput
                label="Tags"
                value={contactForm.tags}
                onChange={(v) => setContactForm(f => ({ ...f, tags: v }))}
                suggestions={tagSuggestions}
                placeholder="cliente, prospect, parceiro..."
              />
              {instances.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instância WhatsApp</label>
                  <select
                    value={contactForm.instanceId}
                    onChange={e => setContactForm(f => ({ ...f, instanceId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhuma</option>
                    {instances.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.instanceName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea
                  value={contactForm.notes}
                  onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveContact}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingContact ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && scheduleForContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingSchedule ? "Editar Agendamento" : "Novo Agendamento"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{scheduleForContact.name} — {formatPhone(scheduleForContact.phone)}</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Follow-up proposta comercial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem pré-definida</label>
                <textarea
                  value={scheduleForm.message}
                  onChange={e => setScheduleForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Mensagem a enviar quando chegar a hora..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Notas sobre este contato..."
                />
              </div>
              {/* Auto-send toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Envio automático</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enviar mensagem via WhatsApp no horário agendado</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleForm(f => ({ ...f, autoSend: !f.autoSend }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${scheduleForm.autoSend ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${scheduleForm.autoSend ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              {scheduleForm.autoSend && !scheduleForm.message && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Para envio automático, é necessário definir uma mensagem acima.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveSchedule}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                {editingSchedule ? "Salvar" : "Agendar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowImportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Importar do WhatsApp</h2>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Importa os contatos das conversas do WhatsApp para a lista de contatos.
                Contatos já existentes (mesmo telefone) serão atualizados.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instância</label>
                <select
                  value={importInstanceId}
                  onChange={e => setImportInstanceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.instanceName} ({inst.status})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importLoading || !importInstanceId}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
