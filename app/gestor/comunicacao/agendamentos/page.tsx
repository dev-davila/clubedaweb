"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar as CalendarIcon, List, Loader2, ChevronLeft, ChevronRight,
  Clock, Building2, Phone, Mail, Check, XCircle, Pencil, Trash2,
  Plus, AlertCircle, CheckCircle, X, CalendarPlus, Save, Filter,
  MessageSquare, Send, RotateCw, Ban, RefreshCw,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  title: string;
  message: string | null;
  scheduledAt: string;
  status: string;
  completedAt: string | null;
  sentAt: string | null;
  sentError: string | null;
  autoSend: boolean;
  notes: string | null;
  createdAt: string;
  contact: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    company: string | null;
    tags: string | null;
  };
}

type ViewMode = "list" | "calendar";
type StatusFilter = "all" | "pending" | "sent" | "done" | "failed" | "cancelled";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pendente", color: "text-yellow-700 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: Clock },
  sent: { label: "Enviado", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Send },
  done: { label: "Concluído", color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30", icon: Check },
  failed: { label: "Falhou", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-700", icon: XCircle },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function AgendamentosPage() {
  const { data: session } = useSession() || {};
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

  // Detail modal
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", message: "", scheduledAt: "", notes: "", autoSend: true });
  const [saving, setSaving] = useState(false);

  // ─── Date/timezone helpers (must be before useMemo that references them) ───
  const TZ = "America/Sao_Paulo";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
  const formatDateTime = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatTime = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  };

  const openEdit = (s: ScheduleItem) => {
    setEditForm({
      title: s.title,
      message: s.message || "",
      scheduledAt: s.scheduledAt ? toLocalInput(s.scheduledAt) : "",
      notes: s.notes || "",
      autoSend: s.autoSend !== false,
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selectedSchedule) return;
    if (!editForm.title || !editForm.scheduledAt) {
      showMsg("error", "Título e data são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${selectedSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          message: editForm.message || null,
          scheduledAt: editForm.scheduledAt,
          notes: editForm.notes || null,
          autoSend: editForm.autoSend,
        }),
      });
      if (!res.ok) throw new Error();
      showMsg("success", "Agendamento atualizado");
      setEditMode(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch {
      showMsg("error", "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (viewMode === "calendar") {
        params.set("month", `${calYear}-${String(calMonth + 1).padStart(2, "0")}`);
      }
      const res = await fetch(`/api/gestor/comunicacao/agendamentos?${params}`);
      const data = await res.json();
      if (res.ok) setSchedules(data.schedules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, calYear, calMonth]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // Filtered schedules for list view
  const filteredSchedules = useMemo(() => {
    if (statusFilter === "all") return schedules;
    return schedules.filter((s) => s.status === statusFilter);
  }, [schedules, statusFilter]);

  // Group schedules by date for calendar (in BRT timezone)
  const schedulesByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const s of schedules) {
      const key = toLocalInput(s.scheduledAt).slice(0, 10); // YYYY-MM-DD in BRT
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [schedules]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calYear, calMonth]);

  const navigateMonth = (dir: number) => {
    let newMonth = calMonth + dir;
    let newYear = calYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && calMonth === t.getMonth() && calYear === t.getFullYear();
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    if (phone.length === 12) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
    return phone;
  };


  // Actions
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showMsg("success", status === "done" ? "Marcado como concluído" : "Status atualizado");
      fetchSchedules();
    } catch {
      showMsg("error", "Erro ao atualizar status");
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Excluir este agendamento?")) return;
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showMsg("success", "Agendamento excluído");
      setSelectedSchedule(null);
      fetchSchedules();
    } catch {
      showMsg("error", "Erro ao excluir");
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </span>
    );
  };

  const isOverdue = (s: ScheduleItem) => s.status === "pending" && new Date(s.scheduledAt) < new Date();

  const retrySchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/gestor/comunicacao/contatos/agendamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending", sentError: null }),
      });
      if (!res.ok) throw new Error();
      showMsg("success", "Agendamento reagendado para reenvio");
      fetchSchedules();
    } catch {
      showMsg("error", "Erro ao reagendar");
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = schedules.length;
    const pending = schedules.filter((s) => s.status === "pending").length;
    const overdue = schedules.filter((s) => isOverdue(s)).length;
    const sent = schedules.filter((s) => s.status === "sent").length;
    const done = schedules.filter((s) => s.status === "done").length;
    const failed = schedules.filter((s) => s.status === "failed").length;
    return { total, pending, overdue, sent, done, failed };
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Agendamentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie seus contatos agendados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendário
            </button>
          </div>
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-yellow-600 uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-red-600 uppercase tracking-wider">Atrasados</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-blue-600 uppercase tracking-wider">Enviados</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.sent}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-green-600 uppercase tracking-wider">Concluídos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.done}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-red-500 uppercase tracking-wider">Falhas</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.failed}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : viewMode === "list" ? (
        /* ═══════════ LIST VIEW ═══════════ */
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400" />
            {(["all", "pending", "sent", "done", "failed", "cancelled"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {f === "all" ? "Todos" : STATUS_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>

          {filteredSchedules.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-gray-500 dark:text-gray-400">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Contato</div>
                <div className="col-span-2">Empresa</div>
                <div className="col-span-3">Título</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>

              {/* Rows */}
              {filteredSchedules.map((s) => {
                const overdue = isOverdue(s);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSchedule(s)}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 ${
                      overdue ? "bg-red-50/50 dark:bg-red-900/10" : ""
                    }`}
                  >
                    {/* Contact */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{s.contact.name}</p>
                        <p className="text-xs text-gray-400 truncate">{formatPhone(s.contact.phone)}</p>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="col-span-2 flex items-center min-w-0">
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {s.contact.company || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="col-span-3 flex items-center min-w-0">
                      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{s.title}</span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center gap-1">
                      <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${overdue ? "text-red-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${overdue ? "text-red-600 font-medium" : "text-gray-600 dark:text-gray-300"}`}>
                        {formatDateTime(s.scheduledAt)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex items-center">
                      {getStatusBadge(s.status)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {(s.status === "pending" || s.status === "failed") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSchedule(s); openEdit(s); }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {s.status === "pending" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(s.id, "done"); }}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                          title="Concluir"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {s.status === "failed" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); retrySchedule(s.id); }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Tentar novamente"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSchedule(s.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ═══════════ CALENDAR VIEW ═══════════ */
        <div className="space-y-4">
          {/* Calendar navigation */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {MONTHS[calMonth]} {calYear}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50" />;
                }
                const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const daySchedules = schedulesByDate[dateKey] || [];
                const today = isToday(day);

                return (
                  <div
                    key={`day-${day}`}
                    className={`min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1.5 transition-colors ${
                      today ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      today
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {day}
                    </span>

                    {/* Schedule items */}
                    <div className="mt-1 space-y-0.5">
                      {daySchedules.slice(0, 3).map((s) => {
                        const overdue = isOverdue(s);
                        const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSchedule(s)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate transition-colors ${
                              s.status === "done"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : s.status === "cancelled"
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-500 line-through"
                                : overdue
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            }`}
                            title={`${formatTime(s.scheduledAt)} — ${s.contact.name}: ${s.title}`}
                          >
                            <span className="font-medium">{formatTime(s.scheduledAt)}</span>{" "}
                            {s.contact.name.split(" ")[0]}
                          </button>
                        );
                      })}
                      {daySchedules.length > 3 && (
                        <p className="text-[10px] text-gray-400 pl-1.5">+{daySchedules.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DETAIL / EDIT MODAL ═══════════ */}
      {selectedSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => { setSelectedSchedule(null); setEditMode(false); }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${
              isOverdue(selectedSchedule) ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-750"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CalendarIcon className={`h-5 w-5 flex-shrink-0 ${
                    isOverdue(selectedSchedule) ? "text-red-500" : "text-blue-600"
                  }`} />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {editMode ? "Editar Agendamento" : selectedSchedule.title}
                    </h2>
                    {!editMode && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(selectedSchedule.scheduledAt)}
                        {isOverdue(selectedSchedule) && (
                          <span className="ml-2 text-red-500 font-medium">• Atrasado</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedSchedule(null); setEditMode(false); }}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {editMode ? (
              /* ══ EDIT MODE ══ */
              <>
                <div className="px-6 py-5 space-y-4">
                  {/* Contact info (read-only) */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                      {selectedSchedule.contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{selectedSchedule.contact.name}</p>
                      <p className="text-xs text-gray-400 truncate">{formatPhone(selectedSchedule.contact.phone)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Follow-up proposta comercial"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Hora *</label>
                    <input
                      type="datetime-local"
                      value={editForm.scheduledAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem</label>
                    <textarea
                      value={editForm.message}
                      onChange={(e) => setEditForm((f) => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Mensagem a enviar quando chegar a hora..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Notas internas..."
                    />
                  </div>

                  {/* Auto-send toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Envio automático</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Enviar via WhatsApp no horário</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, autoSend: !f.autoSend }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.autoSend ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.autoSend ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {editForm.autoSend && !editForm.message && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Para envio automático, é necessário definir uma mensagem.
                    </p>
                  )}
                </div>

                {/* Edit footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </button>
                </div>
              </>
            ) : (
              /* ══ VIEW MODE ══ */
              <>
                <div className="px-6 py-5 space-y-5">
                  {/* Contact info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contato</h3>
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-4 space-y-2">
                      <p className="font-semibold text-gray-900 dark:text-white text-base">{selectedSchedule.contact.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a
                          href={`https://wa.me/${selectedSchedule.contact.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-green-600 hover:underline"
                        >
                          {formatPhone(selectedSchedule.contact.phone)}
                        </a>
                      </div>
                      {selectedSchedule.contact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {selectedSchedule.contact.email}
                        </div>
                      )}
                      {selectedSchedule.contact.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {selectedSchedule.contact.company}
                        </div>
                      )}
                      {selectedSchedule.contact.tags && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {selectedSchedule.contact.tags.split(",").map((tag, i) => (
                            <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule details */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalhes</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                        {getStatusBadge(selectedSchedule.status)}
                        {selectedSchedule.autoSend && (
                          <span className="text-xs text-blue-500 flex items-center gap-1" title="Envio automático ativado">
                            <Send className="h-3 w-3" /> Auto
                          </span>
                        )}
                      </div>
                      {selectedSchedule.sentAt && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Send className="h-4 w-4" />
                          Enviado em {formatDateTime(selectedSchedule.sentAt)}
                        </div>
                      )}
                      {selectedSchedule.sentError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-xs font-medium text-red-600 mb-1">Erro no envio:</p>
                          <p className="text-xs text-red-500 break-all">{selectedSchedule.sentError}</p>
                        </div>
                      )}
                      {selectedSchedule.message && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Mensagem a enviar</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-750 rounded-lg p-3 whitespace-pre-wrap">
                            {selectedSchedule.message}
                          </p>
                        </div>
                      )}
                      {!selectedSchedule.message && selectedSchedule.autoSend && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <p className="text-xs text-yellow-600">⚠️ Sem mensagem definida — o envio automático requer uma mensagem.</p>
                        </div>
                      )}
                      {selectedSchedule.notes && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Observações</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{selectedSchedule.notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">Criado em {formatDate(selectedSchedule.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* View footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${selectedSchedule.contact.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <div className="flex items-center gap-2">
                    {(selectedSchedule.status === "pending" || selectedSchedule.status === "failed") && (
                      <button
                        onClick={() => openEdit(selectedSchedule)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    )}
                    {selectedSchedule.status === "pending" && (
                      <button
                        onClick={() => { updateStatus(selectedSchedule.id, "done"); setSelectedSchedule(null); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        Concluir
                      </button>
                    )}
                    {selectedSchedule.status === "failed" && (
                      <button
                        onClick={() => { retrySchedule(selectedSchedule.id); setSelectedSchedule(null); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reenviar
                      </button>
                    )}
                    <button
                      onClick={() => deleteSchedule(selectedSchedule.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}