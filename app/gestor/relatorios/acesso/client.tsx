"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Eye, Users, Calendar, Bot, Globe, Monitor, Smartphone,
  Tablet, ArrowUpRight, ExternalLink, Clock, BarChart3, AlertTriangle,
  ArrowRightLeft, Timer, ChevronDown, ArrowUp, ArrowDown, Minus, RefreshCw,
  CheckSquare, Square, Trash2, Pencil, Plus, X, Save, Loader2,
  ChevronLeft, ChevronRight, Fingerprint, LogIn, LogOut, TrendingDown,
} from "lucide-react";
import Link from "next/link";

// ========== Types ==========
interface Props {
  period: string;
  periodLabel: string;
  stats: {
    currentViews: number;
    prevViews: number;
    totalViews: number;
    botViews: number;
    currentSessions: number;
    prevSessions: number;
    currentUniqueIPs: number;
    prevUniqueIPs: number;
    uniquePages: number;
    bounceRate: number;
    prevBounceRate: number;
    avgPagesPerSession: number;
    avgDuration: number;
    prevAvgPages: number;
    prevAvgDuration: number;
  };
  topPages: { path: string; views: number }[];
  entryPages: { path: string; views: number }[];
  exitPages: { path: string; views: number }[];
  referrers: { domain: string; views: number }[];
  devices: { type: string; views: number }[];
  dailyViews: { date: string; views: number }[];
  browsers: { name: string; views: number }[];
  osList: { name: string; views: number }[];
  hourly: { hour: number; views: number }[];
  channels: { channel: string; views: number }[];
  languages: { lang: string; views: number }[];
  countries: { country: string; views: number }[];
  errors404: { path: string; views: number }[];
  total404: number;
  redirects: { id: string; sourcePath: string; targetPath: string; statusCode: number; hits: number; createdAt: string; note: string | null }[];
  totalRedirects: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6"];

type TabKey = "visao-geral" | "paginas" | "origens" | "tecnologia" | "erros" | "redirects";

const PERIODS = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "15d", label: "15 dias" },
  { key: "30d", label: "30 dias" },
  { key: "3m", label: "3 meses" },
  { key: "6m", label: "6 meses" },
  { key: "1a", label: "1 ano" },
];

const PAGE_SIZE = 25;

// ========== Helpers ==========
function calcGrowth(current: number, prev: number): { pct: number; direction: "up" | "down" | "neutral" } {
  if (prev === 0 && current === 0) return { pct: 0, direction: "neutral" };
  if (prev === 0) return { pct: 100, direction: "up" };
  const pct = ((current - prev) / prev) * 100;
  return { pct: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "neutral" };
}

function GrowthBadge({ current, prev, invert = false }: { current: number; prev: number; invert?: boolean }) {
  const { pct, direction } = calcGrowth(current, prev);
  if (direction === "neutral") return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> 0%</span>;
  const isPositive = invert ? direction === "down" : direction === "up";
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
      {direction === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {pct.toFixed(1)}%
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, growth }: {
  icon: any; label: string; value: number | string; sub?: string; color: string; growth?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} shadow-sm`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
        </div>
        {growth && <div className="flex-shrink-0 pb-1">{growth}</div>}
      </div>
    </div>
  );
}

function HorizontalBarList({ items, colorStart = 0 }: {
  items: { label: string; value: number; sub?: string }[]; colorStart?: number;
}) {
  if (!items.length) return <p className="text-gray-400 text-sm">Sem dados.</p>;
  const max = items[0]?.value || 1;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-700 font-medium truncate mr-3" title={item.label}>
              {item.label}
              {item.sub && <span className="text-gray-400 font-normal ml-1">{item.sub}</span>}
            </span>
            <span className="text-gray-600 tabular-nums flex-shrink-0 font-semibold">{item.value.toLocaleString("pt-BR")}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max((item.value / max) * 100, 1)}%`, backgroundColor: COLORS[(i + colorStart) % COLORS.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function deviceIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("mobile") || t.includes("celular")) return Smartphone;
  if (t.includes("tablet")) return Tablet;
  return Monitor;
}

// ========== Pagination Component ==========
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium">Página {page} de {totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 7) {
            pageNum = i + 1;
          } else if (page <= 4) {
            pageNum = i + 1;
          } else if (page >= totalPages - 3) {
            pageNum = totalPages - 6 + i;
          } else {
            pageNum = page - 3 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                pageNum === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ========== Main Component ==========
export function AccessReportClient({
  period, periodLabel, stats, topPages, entryPages, exitPages, referrers, devices, dailyViews, browsers, osList,
  hourly, channels, languages, countries, errors404, total404, redirects, totalRedirects,
}: Props) {
  const [tab, setTab] = useState<TabKey>("visao-geral");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // === Pagination states ===
  const [pagesPage, setPagesPage] = useState(1);
  const [referrersPage, setReferrersPage] = useState(1);
  const [errors404Page, setErrors404Page] = useState(1);
  const [redirectsPage, setRedirectsPage] = useState(1);
  const [pagesSubTab, setPagesSubTab] = useState<"top" | "entry" | "exit">("top");

  // === 404 local state (remove redirected items without full page reload) ===
  const [localErrors404, setLocalErrors404] = useState(errors404);
  const [localTotal404, setLocalTotal404] = useState(total404);

  // === 404 errors selection state ===
  const [selected404, setSelected404] = useState<Set<string>>(new Set());
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/");
  const [redirectCode, setRedirectCode] = useState(301);
  const [redirectNote, setRedirectNote] = useState("");
  const [redirectLoading, setRedirectLoading] = useState(false);

  // === Redirects selection/edit state ===
  const [selectedRedirects, setSelectedRedirects] = useState<Set<string>>(new Set());
  const [editingRedirect, setEditingRedirect] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ targetPath: "", statusCode: 301, note: "" });
  const [actionLoading, setActionLoading] = useState(false);

  // === Paginated data ===
  const paginatedTopPages = useMemo(() => topPages.slice((pagesPage - 1) * PAGE_SIZE, pagesPage * PAGE_SIZE), [topPages, pagesPage]);
  const totalPagesPages = Math.ceil(topPages.length / PAGE_SIZE);

  const paginatedReferrers = useMemo(() => referrers.slice((referrersPage - 1) * PAGE_SIZE, referrersPage * PAGE_SIZE), [referrers, referrersPage]);
  const totalReferrersPages = Math.ceil(referrers.length / PAGE_SIZE);

  const paginatedErrors = useMemo(() => localErrors404.slice((errors404Page - 1) * PAGE_SIZE, errors404Page * PAGE_SIZE), [localErrors404, errors404Page]);
  const totalErrorsPages = Math.ceil(localErrors404.length / PAGE_SIZE);

  const paginatedRedirects = useMemo(() => redirects.slice((redirectsPage - 1) * PAGE_SIZE, redirectsPage * PAGE_SIZE), [redirects, redirectsPage]);
  const totalRedirectsPages = Math.ceil(redirects.length / PAGE_SIZE);

  // === Selection helpers ===
  const toggle404 = (path: string) => {
    setSelected404(prev => { const next = new Set(prev); next.has(path) ? next.delete(path) : next.add(path); return next; });
  };
  const toggleAll404 = () => {
    if (selected404.size === localErrors404.length) setSelected404(new Set());
    else setSelected404(new Set(localErrors404.map(e => e.path)));
  };
  const toggleRedirect = (id: string) => {
    setSelectedRedirects(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAllRedirects = () => {
    if (selectedRedirects.size === redirects.length) setSelectedRedirects(new Set());
    else setSelectedRedirects(new Set(redirects.map(r => r.id)));
  };

  // === Bulk create redirects from 404s ===
  const handleBulkRedirect = async () => {
    if (selected404.size === 0) return;
    setRedirectLoading(true);
    try {
      const res = await fetch("/api/gestor/redirects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePaths: Array.from(selected404), targetPath: redirectTarget, statusCode: redirectCode, note: redirectNote || "Criado via relatório 404" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.created} redirecionamento(s) criado(s)${data.skipped ? `, ${data.skipped} ignorado(s)` : ""}.`);
        // Remove redirected paths from 404 list locally
        const redirectedPaths = new Set(selected404);
        setLocalErrors404(prev => {
          const filtered = prev.filter(e => !redirectedPaths.has(e.path));
          setLocalTotal404(filtered.reduce((sum, e) => sum + e.views, 0));
          return filtered;
        });
        setSelected404(new Set()); setShowRedirectModal(false); setRedirectTarget("/"); setRedirectNote("");
        // Adjust pagination if current page is now empty
        const remaining = localErrors404.length - redirectedPaths.size;
        const newTotalPages = Math.ceil(remaining / PAGE_SIZE);
        if (errors404Page > newTotalPages && newTotalPages > 0) setErrors404Page(newTotalPages);
        router.refresh();
      } else alert(`Erro: ${data.error || "Falha ao criar redirecionamentos"}`);
    } catch { alert("Erro de rede ao criar redirecionamentos."); }
    finally { setRedirectLoading(false); }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este redirecionamento?")) return;
    setActionLoading(true);
    try { const res = await fetch(`/api/gestor/redirects?id=${id}`, { method: "DELETE" }); if (res.ok) router.refresh(); else alert("Erro ao excluir."); }
    catch { alert("Erro de rede."); } finally { setActionLoading(false); }
  };

  const handleBulkDeleteRedirects = async () => {
    if (selectedRedirects.size === 0) return;
    if (!confirm(`Excluir ${selectedRedirects.size} redirecionamento(s)?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/gestor/redirects/bulk", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selectedRedirects) }) });
      const data = await res.json();
      if (data.success) { alert(`${data.deleted} redirecionamento(s) excluído(s).`); setSelectedRedirects(new Set()); router.refresh(); }
      else alert(`Erro: ${data.error}`);
    } catch { alert("Erro de rede."); } finally { setActionLoading(false); }
  };

  const handleSaveEdit = async () => {
    if (!editingRedirect) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/gestor/redirects", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRedirect, targetPath: editForm.targetPath, statusCode: editForm.statusCode, note: editForm.note }) });
      if (res.ok) { setEditingRedirect(null); router.refresh(); } else alert("Erro ao salvar.");
    } catch { alert("Erro de rede."); } finally { setActionLoading(false); }
  };

  const changePeriod = (key: string) => { setShowPeriodMenu(false); router.push(`${pathname}?periodo=${key}`); };

  const tabs: { key: TabKey; label: string; icon: any; badge?: number }[] = [
    { key: "visao-geral", label: "Visão Geral", icon: BarChart3 },
    { key: "paginas", label: "Páginas", icon: ArrowUpRight, badge: stats.uniquePages },
    { key: "origens", label: "Origens", icon: Globe },
    { key: "tecnologia", label: "Tecnologia", icon: Monitor },
    { key: "erros", label: "Erros 404", icon: AlertTriangle, badge: localTotal404 },
    { key: "redirects", label: "Redirecionamentos", icon: ArrowRightLeft, badge: totalRedirects },
  ];

  // === Pages sub-tab table renderer ===
  const renderPagesTable = (data: { path: string; views: number }[], label: string) => {
    if (data.length === 0) return <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>;
    const totalViews = data.reduce((s, p) => s + p.views, 0);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium w-8">#</th>
              <th className="pb-2 font-medium">Página</th>
              <th className="pb-2 font-medium text-right">{label}</th>
              <th className="pb-2 font-medium text-right">%</th>
              <th className="pb-2 font-medium text-right w-48">Barra</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => {
              const pct = totalViews > 0 ? ((p.views / totalViews) * 100) : 0;
              return (
                <tr key={p.path} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-800 truncate max-w-xs" title={p.path}>{p.path}</span>
                      <a href={p.path} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500"><ExternalLink className="w-3 h-3" /></a>
                    </div>
                  </td>
                  <td className="py-2 text-right font-medium text-gray-700 tabular-nums">{p.views.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-right text-gray-400 tabular-nums">{pct.toFixed(1)}%</td>
                  <td className="py-2"><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Acesso</h1>
          <p className="text-gray-500 mt-1 text-sm">Comparando com o período anterior equivalente</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowPeriodMenu(!showPeriodMenu)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <Calendar className="w-4 h-4 text-gray-400" /> {periodLabel} <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showPeriodMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 min-w-[160px]">
                {PERIODS.map((p) => (
                  <button key={p.key} onClick={() => changePeriod(p.key)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${period === p.key ? "font-semibold text-blue-600 bg-blue-50" : "text-gray-700"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href="/gestor/relatorios/comparacao" className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-400" /> Comparar anos
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Visualizações" value={stats.currentViews} sub={`Total: ${stats.totalViews.toLocaleString("pt-BR")}`} color="bg-blue-500" growth={<GrowthBadge current={stats.currentViews} prev={stats.prevViews} />} />
        <StatCard icon={Users} label="Sessões" value={stats.currentSessions} color="bg-emerald-500" growth={<GrowthBadge current={stats.currentSessions} prev={stats.prevSessions} />} />
        <StatCard icon={Fingerprint} label="IPs únicos" value={stats.currentUniqueIPs} sub={`Anterior: ${stats.prevUniqueIPs.toLocaleString("pt-BR")}`} color="bg-cyan-500" growth={<GrowthBadge current={stats.currentUniqueIPs} prev={stats.prevUniqueIPs} />} />
        <StatCard icon={ArrowUpRight} label="Pág. únicas" value={stats.uniquePages} color="bg-indigo-500" />
        <StatCard icon={TrendingDown} label="Bounce rate" value={`${stats.bounceRate}%`} sub={`Anterior: ${stats.prevBounceRate}%`} color="bg-orange-500" growth={<GrowthBadge current={stats.bounceRate} prev={stats.prevBounceRate} invert />} />
        <StatCard icon={Timer} label="Tempo médio" value={formatDuration(stats.avgDuration)} sub={`Anterior: ${formatDuration(stats.prevAvgDuration)}`} color="bg-amber-500" growth={<GrowthBadge current={stats.avgDuration} prev={stats.prevAvgDuration} />} />
        <StatCard icon={BarChart3} label="Pág/sessão" value={stats.avgPagesPerSession.toFixed(1)} sub={`Anterior: ${stats.prevAvgPages.toFixed(1)}`} color="bg-violet-500" growth={<GrowthBadge current={stats.avgPagesPerSession} prev={stats.prevAvgPages} />} />
        <StatCard icon={Bot} label="Bots bloqueados" value={stats.botViews} color="bg-gray-600" />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto bg-gray-50/80 px-2 pt-2 gap-1 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPagesPage(1); setReferrersPage(1); setErrors404Page(1); setRedirectsPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-white text-blue-600 shadow-sm border border-gray-200 border-b-white -mb-px relative z-10"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold ${t.key === "erros" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                  {t.badge.toLocaleString("pt-BR")}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200">
          {/* VISÃO GERAL */}
          {tab === "visao-geral" && (
            <div className="space-y-8">
              {dailyViews.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Visualizações diárias</h4>
                  <div className="h-72 bg-gray-50/50 rounded-xl p-4 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyViews} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip labelFormatter={(v) => { const [y, m, d] = String(v).split("-"); return `${d}/${m}/${y}`; }} formatter={(v: number) => [v.toLocaleString("pt-BR"), "Views"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                        <Area type="monotone" dataKey="views" fill="url(#viewsGradient)" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {hourly.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por hora do dia</h4>
                  <div className="h-52 bg-gray-50/50 rounded-xl p-4 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourly} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip labelFormatter={(h) => `${h}:00 - ${h}:59`} formatter={(v: number) => [v.toLocaleString("pt-BR"), "Views"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                        <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Canais de tráfego</h4>
                  <HorizontalBarList items={channels.map((c) => ({ label: c.channel, value: c.views }))} />
                </div>
                <div className="bg-gray-50/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Países</h4>
                  {countries.length === 0 ? <p className="text-gray-400 text-sm">Sem dados.</p> : (
                    <HorizontalBarList items={countries.map((c) => ({ label: c.country, value: c.views }))} colorStart={3} />
                  )}
                </div>
              </div>

              {languages.length > 0 && (
                <div className="bg-gray-50/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Idiomas do navegador</h4>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((l) => (
                      <span key={l.lang} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg text-sm border border-gray-100 shadow-sm">
                        <span className="font-semibold text-gray-700">{l.lang}</span>
                        <span className="text-gray-400 text-xs">{l.views.toLocaleString("pt-BR")}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PÁGINAS - with sub-tabs */}
          {tab === "paginas" && (
            <div>
              <div className="flex items-center gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
                {([
                  { key: "top" as const, label: "Mais visitadas", icon: Eye },
                  { key: "entry" as const, label: "Páginas de entrada", icon: LogIn },
                  { key: "exit" as const, label: "Páginas de saída", icon: LogOut },
                ]).map(st => (
                  <button
                    key={st.key}
                    onClick={() => { setPagesSubTab(st.key); setPagesPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      pagesSubTab === st.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <st.icon className="w-3.5 h-3.5" />
                    {st.label}
                  </button>
                ))}
              </div>
              {pagesSubTab === "top" && (
                <>
                  {renderPagesTable(paginatedTopPages, "Views")}
                  <Pagination page={pagesPage} totalPages={totalPagesPages} onPageChange={setPagesPage} />
                </>
              )}
              {pagesSubTab === "entry" && (
                <>
                  <p className="text-xs text-gray-400 mb-3">Primeira página visitada em cada sessão (top 20)</p>
                  {renderPagesTable(entryPages, "Entradas")}
                </>
              )}
              {pagesSubTab === "exit" && (
                <>
                  <p className="text-xs text-gray-400 mb-3">Última página visitada em cada sessão (top 20)</p>
                  {renderPagesTable(exitPages, "Saídas")}
                </>
              )}
            </div>
          )}

          {/* ORIGENS */}
          {tab === "origens" && (
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Referenciadores (domínios) — {referrers.length} encontrados</h4>
                {referrers.length === 0 ? <p className="text-gray-400 text-sm">Nenhum referenciador registrado.</p> : (
                  <>
                    <HorizontalBarList items={paginatedReferrers.map((r) => ({ label: r.domain, value: r.views }))} />
                    <Pagination page={referrersPage} totalPages={totalReferrersPages} onPageChange={setReferrersPage} />
                  </>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Canais de tráfego</h4>
                {channels.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HorizontalBarList items={channels.map((c) => ({ label: c.channel, value: c.views }))} />
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={channels} dataKey="views" nameKey="channel" cx="50%" cy="50%" outerRadius={80}
                            label={({ channel, percent }) => `${(channel as string).substring(0, 12)} ${(percent * 100).toFixed(0)}%`}>
                            {channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TECNOLOGIA */}
          {tab === "tecnologia" && (
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Dispositivos</h4>
                {devices.every(d => d.type === "Desconhecido") ? <p className="text-gray-400 text-sm">Dados de dispositivos não disponíveis.</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={devices.filter(d => d.type !== "Desconhecido")} dataKey="views" nameKey="type" cx="50%" cy="50%" outerRadius={80}
                            label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
                            {devices.filter(d => d.type !== "Desconhecido").map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {devices.map((d) => {
                        const DevIcon = deviceIcon(d.type);
                        const total = devices.reduce((s, x) => s + x.views, 0);
                        const pct = total > 0 ? ((d.views / total) * 100).toFixed(1) : "0";
                        return (
                          <div key={d.type} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                            <DevIcon className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">{d.type}</p>
                              <p className="text-xs text-gray-400">{d.views.toLocaleString("pt-BR")} views · {pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Navegadores</h4>
                  {browsers.length === 0 ? <p className="text-gray-400 text-sm">Sem dados.</p> : (
                    <HorizontalBarList items={browsers.map((b) => ({ label: b.name, value: b.views }))} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Sistemas Operacionais</h4>
                  {osList.length === 0 ? <p className="text-gray-400 text-sm">Sem dados.</p> : (
                    <HorizontalBarList items={osList.map((o) => ({ label: o.name, value: o.views }))} colorStart={4} />
                  )}
                </div>
              </div>
              {languages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Idiomas</h4>
                  <HorizontalBarList items={languages.map((l) => ({ label: l.lang, value: l.views }))} colorStart={2} />
                </div>
              )}
            </div>
          )}

          {/* ERROS 404 */}
          {tab === "erros" && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    <strong>{localTotal404}</strong> erros 404 no período ({localErrors404.length} URLs únicas).
                    {localTotal404 === 0 && " Nenhum erro encontrado — o rastreamento de 404 começou a funcionar recentemente."}
                  </p>
                </div>
                {selected404.size > 0 && (
                  <button onClick={() => setShowRedirectModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Redirecionar {selected404.size} selecionado(s)
                  </button>
                )}
              </div>
              {localErrors404.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum erro 404 registrado.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 font-medium w-10">
                            <button onClick={toggleAll404} className="text-gray-400 hover:text-blue-600 transition-colors" title="Selecionar todos">
                              {selected404.size === localErrors404.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </th>
                          <th className="pb-2 font-medium">URL não encontrada</th>
                          <th className="pb-2 font-medium text-right">Acessos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedErrors.map((e) => (
                          <tr key={e.path} className={`border-b border-gray-50 cursor-pointer transition-colors ${selected404.has(e.path) ? "bg-blue-50/70" : "hover:bg-red-50/50"}`} onClick={() => toggle404(e.path)}>
                            <td className="py-2">{selected404.has(e.path) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}</td>
                            <td className="py-2"><span className="font-mono text-sm text-red-700 break-all">{e.path}</span></td>
                            <td className="py-2 text-right font-medium text-gray-700 tabular-nums">{e.views.toLocaleString("pt-BR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={errors404Page} totalPages={totalErrorsPages} onPageChange={setErrors404Page} />
                </>
              )}

              {/* Redirect creation modal */}
              {showRedirectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRedirectModal(false)}>
                  <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Criar Redirecionamentos</h3>
                      <button onClick={() => setShowRedirectModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-500 mb-1">{selected404.size} URL(s) selecionada(s):</p>
                      {Array.from(selected404).map(p => (<p key={p} className="text-xs font-mono text-red-600 truncate">{p}</p>))}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Redirecionar para:</label>
                        <input type="text" value={redirectTarget} onChange={e => setRedirectTarget(e.target.value)} placeholder="/pagina-destino" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Código HTTP:</label>
                          <select value={redirectCode} onChange={e => setRedirectCode(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value={301}>301 (Permanente)</option>
                            <option value={302}>302 (Temporário)</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional):</label>
                          <input type="text" value={redirectNote} onChange={e => setRedirectNote(e.target.value)} placeholder="Correção 404" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-5">
                      <button onClick={() => setShowRedirectModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                      <button onClick={handleBulkRedirect} disabled={redirectLoading || !redirectTarget.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {redirectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Criar {selected404.size} redirecionamento(s)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REDIRECTS */}
          {tab === "redirects" && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-blue-700"><strong>{totalRedirects}</strong> redirecionamentos ativos.</p>
                </div>
                {selectedRedirects.size > 0 && (
                  <button onClick={handleBulkDeleteRedirects} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex-shrink-0">
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Excluir {selectedRedirects.size} selecionado(s)
                  </button>
                )}
              </div>
              {redirects.length === 0 ? <p className="text-gray-400 text-sm">Nenhum redirecionamento cadastrado.</p> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 font-medium w-10">
                            <button onClick={toggleAllRedirects} className="text-gray-400 hover:text-blue-600 transition-colors" title="Selecionar todos">
                              {selectedRedirects.size === redirects.length && redirects.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </th>
                          <th className="pb-2 font-medium">Origem</th>
                          <th className="pb-2 font-medium">Destino</th>
                          <th className="pb-2 font-medium text-center w-16">Código</th>
                          <th className="pb-2 font-medium text-right w-16">Hits</th>
                          <th className="pb-2 font-medium text-right w-20">Criado</th>
                          <th className="pb-2 font-medium text-center w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRedirects.map((r) => {
                          const date = new Date(r.createdAt);
                          const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().slice(2)}`;
                          const isEditing = editingRedirect === r.id;

                          if (isEditing) {
                            return (
                              <tr key={r.id} className="border-b border-blue-100 bg-blue-50/50">
                                <td className="py-2"></td>
                                <td className="py-2"><span className="font-mono text-xs text-gray-500 break-all">{r.sourcePath}</span></td>
                                <td className="py-2"><input type="text" value={editForm.targetPath} onChange={e => setEditForm(f => ({ ...f, targetPath: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500" /></td>
                                <td className="py-2 text-center"><select value={editForm.statusCode} onChange={e => setEditForm(f => ({ ...f, statusCode: Number(e.target.value) }))} className="border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500"><option value={301}>301</option><option value={302}>302</option></select></td>
                                <td className="py-2"><input type="text" value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} placeholder="Nota" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500" /></td>
                                <td colSpan={2} className="py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={handleSaveEdit} disabled={actionLoading} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Salvar">{actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</button>
                                    <button onClick={() => setEditingRedirect(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancelar"><X className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={r.id} className={`border-b border-gray-50 transition-colors ${selectedRedirects.has(r.id) ? "bg-blue-50/70" : "hover:bg-gray-50"}`}>
                              <td className="py-2"><button onClick={() => toggleRedirect(r.id)} className="text-gray-400 hover:text-blue-600">{selectedRedirects.has(r.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}</button></td>
                              <td className="py-2"><span className="font-mono text-xs text-gray-800 break-all max-w-xs block truncate" title={r.sourcePath}>{r.sourcePath}</span></td>
                              <td className="py-2"><span className="font-mono text-xs text-blue-600 break-all max-w-xs block truncate" title={r.targetPath}>{r.targetPath}</span></td>
                              <td className="py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.statusCode === 301 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.statusCode}</span></td>
                              <td className="py-2 text-right tabular-nums font-medium text-gray-700">{r.hits.toLocaleString("pt-BR")}</td>
                              <td className="py-2 text-right text-gray-400 text-xs">{dateStr}</td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => { setEditingRedirect(r.id); setEditForm({ targetPath: r.targetPath, statusCode: r.statusCode, note: r.note || "" }); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteRedirect(r.id)} disabled={actionLoading} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={redirectsPage} totalPages={totalRedirectsPages} onPageChange={setRedirectsPage} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center pb-4 pt-2">
        Dados filtrados excluindo bots · Período: {periodLabel} · Comparação com período anterior equivalente · Dados armazenados por 3 anos
      </p>
    </div>
  );
}
