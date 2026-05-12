// Página de Eventos de Segurança
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ChevronLeft,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  AlertTriangle,
  Ban,
  Clock,
  Globe,
  Upload,
  Key,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface SecurityEvent {
  id: string;
  createdAt: string;
  ip: string;
  userId?: string;
  sessionId?: string;
  eventType: string;
  action: string;
  reason: string;
  method: string;
  url: string;
  userAgent?: string;
  payloadExcerpt?: string;
  statusCode?: number;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; bgColor: string; textColor: string }> = {
  sql_injection_attempt: { label: "SQL Injection", icon: <Key size={12} />, bgColor: "bg-red-100", textColor: "text-red-700" },
  xss_attempt: { label: "XSS", icon: <AlertTriangle size={12} />, bgColor: "bg-orange-100", textColor: "text-orange-700" },
  path_traversal_attempt: { label: "Path Traversal", icon: <Globe size={12} />, bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  brute_force_attempt: { label: "Brute Force", icon: <Ban size={12} />, bgColor: "bg-red-100", textColor: "text-red-700" },
  bot_scan_attempt: { label: "Bot/Scanner", icon: <Eye size={12} />, bgColor: "bg-blue-100", textColor: "text-blue-700" },
  rate_limit_exceeded: { label: "Rate Limit", icon: <Clock size={12} />, bgColor: "bg-purple-100", textColor: "text-purple-700" },
  malicious_upload_attempt: { label: "Upload Malicioso", icon: <Upload size={12} />, bgColor: "bg-red-100", textColor: "text-red-700" },
  suspicious_request: { label: "Suspeito", icon: <AlertTriangle size={12} />, bgColor: "bg-gray-100", textColor: "text-gray-700" },
};

const ACTION_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  allowed: { label: "Permitido", bgColor: "bg-green-100", textColor: "text-green-700" },
  logged: { label: "Registrado", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  rate_limited: { label: "Limitado", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  blocked_temp: { label: "Bloqueado Temp", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  blocked_hard: { label: "Bloqueado", bgColor: "bg-red-100", textColor: "text-red-700" },
};

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [ipFilter, setIpFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });
      
      if (ipFilter) params.append("ip", ipFilter);
      if (typeFilter) params.append("eventType", typeFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (urlFilter) params.append("url", urlFilter);
      
      const res = await fetch(`/api/gestor/security/events?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar eventos");
      
      const data = await res.json();
      setEvents(data.events);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [page, ipFilter, typeFilter, actionFilter, urlFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setIpFilter("");
    setTypeFilter("");
    setActionFilter("");
    setUrlFilter("");
    setPage(1);
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
            <h1 className="text-2xl font-bold text-gray-900">Eventos de Segurança</h1>
            <p className="text-sm text-gray-500">{total} eventos registrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition ${
              showFilters || ipFilter || typeFilter || actionFilter || urlFilter
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            Filtros
            {(ipFilter || typeFilter || actionFilter || urlFilter) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">IP</label>
              <input
                type="text"
                value={ipFilter}
                onChange={(e) => { setIpFilter(e.target.value); setPage(1); }}
                placeholder="Filtrar por IP"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ação</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Todas</option>
                {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
              <input
                type="text"
                value={urlFilter}
                onChange={(e) => { setUrlFilter(e.target.value); setPage(1); }}
                placeholder="Filtrar por URL"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          {(ipFilter || typeFilter || actionFilter || urlFilter) && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Carregando...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum evento encontrado
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const typeConfig = EVENT_TYPE_CONFIG[event.eventType] || {
                    label: event.eventType,
                    icon: <AlertTriangle size={12} />,
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-700",
                  };
                  const actionConfig = ACTION_CONFIG[event.action] || {
                    label: event.action,
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-700",
                  };
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">{event.ip}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 max-w-[200px] truncate block">
                          {event.method} {event.url}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${actionConfig.bgColor} ${actionConfig.textColor}`}>
                          {actionConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 max-w-[200px] truncate block">
                          {event.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Detalhes do Evento</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data/Hora</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedEvent.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IP</label>
                  <p className="font-mono text-sm text-gray-900">{selectedEvent.ip}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                  <p className="text-sm text-gray-900">
                    {EVENT_TYPE_CONFIG[selectedEvent.eventType]?.label || selectedEvent.eventType}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ação</label>
                  <p className="text-sm text-gray-900">
                    {ACTION_CONFIG[selectedEvent.action]?.label || selectedEvent.action}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {selectedEvent.method} {selectedEvent.url}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motivo</label>
                <p className="text-sm text-gray-900">{selectedEvent.reason}</p>
              </div>
              
              {selectedEvent.userAgent && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">User Agent</label>
                  <p className="text-xs text-gray-600 break-all">{selectedEvent.userAgent}</p>
                </div>
              )}
              
              {selectedEvent.payloadExcerpt && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payload (excerpt)</label>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {selectedEvent.payloadExcerpt}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
