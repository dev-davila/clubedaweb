"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Search, Filter, Mail, MailOpen, Trash2, Eye,
  ChevronLeft, ChevronRight, Loader2, Phone, Building2,
  Calendar, X, ExternalLink, RefreshCw, Newspaper, Users
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  cnpj: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
  source: "contact" | "newsletter";
  status?: string;
}

export default function ContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contactTotal, setContactTotal] = useState(0);
  const [newsletterTotal, setNewsletterTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [source, setSource] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        filter,
        source,
        ...(search && { search }),
      });
      const res = await fetch(`/api/gestor/contatos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
        setTotal(data.total);
        setUnreadCount(data.unreadCount);
        setContactTotal(data.contactTotal);
        setNewsletterTotal(data.newsletterTotal);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, source, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const markAsRead = async (id: string, read: boolean) => {
    await fetch("/api/gestor/contatos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    fetchContacts();
    if (selectedContact?.id === id) {
      setSelectedContact({ ...selectedContact, read });
    }
  };

  const markSelectedAsRead = async (read: boolean) => {
    if (selectedIds.length === 0) return;
    await fetch("/api/gestor/contatos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, read }),
    });
    setSelectedIds([]);
    fetchContacts();
  };

  const deleteContact = async (id: string, contactSource: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    await fetch(`/api/gestor/contatos?id=${id}&source=${contactSource}`, { method: "DELETE" });
    if (selectedContact?.id === id) setSelectedContact(null);
    fetchContacts();
  };

  const openContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (!contact.read && contact.source === "contact") {
      markAsRead(contact.id, true);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atr\u00e1s`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atr\u00e1s`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d atr\u00e1s`;
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const SourceBadge = ({ src }: { src: string }) => {
    if (src === "newsletter") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
          <Newspaper size={10} /> Newsletter
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
        <MessageSquare size={10} /> Contato
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users size={22} className="text-purple-600" />
              Contatos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Contatos e inscritos recebidos pelos formul\u00e1rios do site
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-700">{contactTotal}</div>
              <div className="text-xs text-green-600">Contatos</div>
            </div>
            <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700">{newsletterTotal}</div>
              <div className="text-xs text-blue-600">Newsletter</div>
            </div>
            <div className="text-center px-4 py-2 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{unreadCount}</div>
              <div className="text-xs text-orange-500">N\u00e3o lidas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, assunto..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-2">
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos</option>
              <option value="contact">Contatos</option>
              <option value="newsletter">Newsletter</option>
            </select>

            {/* Read filter */}
            <Filter size={14} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas</option>
              <option value="unread">N\u00e3o lidas</option>
              <option value="read">Lidas</option>
            </select>

            <button
              onClick={() => fetchContacts()}
              className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t">
            <span className="text-xs text-gray-500">{selectedIds.length} selecionado(s)</span>
            <button
              onClick={() => markSelectedAsRead(true)}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <MailOpen size={12} /> Marcar como lida
            </button>
            <button
              onClick={() => markSelectedAsRead(false)}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
            >
              <Mail size={12} /> Marcar como n\u00e3o lida
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-4">
        {/* Contact list */}
        <div className={`bg-white rounded-xl border flex-1 min-w-0 ${selectedContact ? 'hidden lg:block lg:max-w-md' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-purple-600" size={28} />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedIds.length === contacts.length && contacts.length > 0}
                  onChange={selectAll}
                  className="rounded text-purple-600"
                />
                <span className="text-xs text-gray-500">Selecionar todos</span>
              </div>

              <div className="divide-y">
                {contacts.map((contact) => (
                  <div
                    key={`${contact.source}-${contact.id}`}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !contact.read && contact.source === "contact" ? 'bg-purple-50/50' : ''
                    } ${selectedContact?.id === contact.id && selectedContact?.source === contact.source ? 'bg-purple-100' : ''}`}
                    onClick={() => openContact(contact)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(contact.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded text-purple-600 mt-1 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!contact.read && contact.source === "contact" && (
                          <span className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
                        )}
                        <span className={`text-sm truncate ${!contact.read && contact.source === "contact" ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {contact.name}
                        </span>
                        <SourceBadge src={contact.source} />
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          {formatRelative(contact.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {contact.email}
                      </p>
                      {contact.source === "contact" && contact.subject && (
                        <p className={`text-xs truncate mt-0.5 ${!contact.read ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                          {contact.subject}
                        </p>
                      )}
                      {contact.source === "contact" && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {contact.message.substring(0, 80)}{contact.message.length > 80 ? '...' : ''}
                        </p>
                      )}
                      {contact.source === "newsletter" && contact.status && (
                        <span className={`inline-flex items-center text-[10px] mt-0.5 ${
                          contact.status === "ACTIVE" ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {contact.status === "ACTIVE" ? "\u2713 Ativo" : "Descadastrado"}
                        </span>
                      )}
                      {contact.company && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Building2 size={10} />
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="text-xs text-gray-500">
                    P\u00e1gina {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 disabled:opacity-40"
                  >
                    Pr\u00f3xima <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact detail */}
        {selectedContact && (
          <div className="bg-white rounded-xl border flex-1 min-w-0">
            {/* Detail header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedContact.source === "newsletter" ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <span className={`font-semibold text-sm ${
                    selectedContact.source === "newsletter" ? 'text-blue-700' : 'text-purple-700'
                  }`}>
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                    <SourceBadge src={selectedContact.source} />
                  </div>
                  <a href={`mailto:${selectedContact.email}`} className="text-xs text-purple-600 hover:underline">
                    {selectedContact.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {selectedContact.source === "contact" && (
                  <button
                    onClick={() => markAsRead(selectedContact.id, !selectedContact.read)}
                    className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50"
                    title={selectedContact.read ? "Marcar como n\u00e3o lida" : "Marcar como lida"}
                  >
                    {selectedContact.read ? <Mail size={16} /> : <MailOpen size={16} />}
                  </button>
                )}
                <button
                  onClick={() => deleteContact(selectedContact.id, selectedContact.source)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Detail body */}
            <div className="p-6">
              {selectedContact.source === "contact" && selectedContact.subject && (
                <h4 className="font-semibold text-gray-900 mb-4">{selectedContact.subject}</h4>
              )}

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(selectedContact.createdAt)}
                </div>
                {selectedContact.phone && (
                  <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2 text-sm text-purple-600 hover:underline">
                    <Phone size={14} />
                    {selectedContact.phone}
                  </a>
                )}
                {selectedContact.company && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 size={14} className="text-gray-400" />
                    {selectedContact.company}
                    {selectedContact.cnpj && <span className="text-gray-400">({selectedContact.cnpj})</span>}
                  </div>
                )}
                {selectedContact.source === "newsletter" && selectedContact.status && (
                  <div className="flex items-center gap-2 text-sm">
                    <Newspaper size={14} className="text-blue-400" />
                    <span className={selectedContact.status === "ACTIVE" ? "text-green-600" : "text-gray-400"}>
                      {selectedContact.status === "ACTIVE" ? "Inscri\u00e7\u00e3o ativa" : "Descadastrado"}
                    </span>
                  </div>
                )}
              </div>

              {/* Message (only for contact type) */}
              {selectedContact.source === "contact" ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedContact.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <a
                      href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject || 'Contato pelo site M3Solutions'}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      <Mail size={14} /> Responder por Email
                    </a>
                    {selectedContact.phone && (
                      <a
                        href={`https://wa.me/55${selectedContact.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink size={14} /> WhatsApp
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper size={16} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-800">Inscrito na Newsletter</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Este contato se inscreveu na newsletter do site.
                  </p>
                  <div className="mt-4">
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Mail size={14} /> Enviar Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
