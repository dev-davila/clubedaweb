"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Bot, MessageSquare, Users, PhoneForwarded, Clock, CheckCircle,
  AlertTriangle, BarChart2, Loader2, RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  waitingHumanSessions: number;
  humanSessions: number;
  closedSessions: number;
  totalMessages: number;
  departments: { department: string; count: number }[];
  recentSessions: Array<{
    id: string;
    phone: string;
    status: string;
    department: string | null;
    step: string;
    updatedAt: string;
    _count: { messages: number };
    agentConfig: { name: string };
    instance: { instanceName: string };
  }>;
}

export default function AgentesIaDashboard() {
  const { data: session } = useSession() || {};
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    setLoading(true);
    try {
      const [sessionsRes, configsRes] = await Promise.all([
        fetch("/api/gestor/comunicacao/agentes-ia/sessions?limit=100"),
        fetch("/api/gestor/comunicacao/agentes-ia/config"),
      ]);

      const sessionsData = await sessionsRes.json();
      const configsData = await configsRes.json();
      setConfigs(configsData);

      const allSessions = sessionsData.sessions || [];
      const active = allSessions.filter((s: any) => s.status === "active");
      const waitingHuman = allSessions.filter((s: any) => s.status === "waiting_human");
      const human = allSessions.filter((s: any) => s.status === "human");
      const closed = allSessions.filter((s: any) => s.status === "closed");

      // Department breakdown
      const deptMap: Record<string, number> = {};
      allSessions.forEach((s: any) => {
        const dept = s.department || "Não classificado";
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });

      const totalMsgs = allSessions.reduce((sum: number, s: any) => sum + (s._count?.messages || 0), 0);

      setStats({
        totalSessions: sessionsData.total || allSessions.length,
        activeSessions: active.length,
        waitingHumanSessions: waitingHuman.length,
        humanSessions: human.length,
        closedSessions: closed.length,
        totalMessages: totalMsgs,
        departments: Object.entries(deptMap).map(([department, count]) => ({ department, count: count as number })),
        recentSessions: allSessions.slice(0, 10),
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    waiting_human: "bg-yellow-500/20 text-yellow-400",
    human: "bg-blue-500/20 text-blue-400",
    closed: "bg-gray-500/20 text-gray-400",
  };

  const statusLabels: Record<string, string> = {
    active: "Ativo (IA)",
    waiting_human: "Aguardando Humano",
    human: "Atendimento Humano",
    closed: "Encerrado",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-blue-400" />
            Agentes IA — Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Visão geral do atendimento automatizado via WhatsApp
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Agent configs summary */}
      {configs.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium">Nenhum agente configurado</p>
            <p className="text-yellow-400/80 text-sm mt-1">
              Vá em <a href="/gestor/comunicacao/agentes-ia/configuracao" className="underline">Configuração</a> para criar seu primeiro agente IA.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<BarChart2 className="w-5 h-5" />}
            label="Total Sessões"
            value={stats.totalSessions}
            color="text-blue-400"
          />
          <StatCard
            icon={<Bot className="w-5 h-5" />}
            label="Ativas (IA)"
            value={stats.activeSessions}
            color="text-green-400"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Aguard. Humano"
            value={stats.waitingHumanSessions}
            color="text-yellow-400"
          />
          <StatCard
            icon={<PhoneForwarded className="w-5 h-5" />}
            label="Atend. Humano"
            value={stats.humanSessions}
            color="text-blue-400"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Encerradas"
            value={stats.closedSessions}
            color="text-gray-400"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="Total Mensagens"
            value={stats.totalMessages}
            color="text-purple-400"
          />
        </div>
      )}

      {/* Department breakdown + Recent Sessions */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Departments */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Por Departamento
            </h2>
            {stats.departments.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum departamento registrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {stats.departments.map((d) => (
                  <div key={d.department} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm capitalize">{d.department}</span>
                    <span className="text-white font-medium bg-gray-700 px-2.5 py-0.5 rounded-full text-xs">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Sessões Recentes</h2>
            {stats.recentSessions.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma sessão encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Telefone</th>
                      <th className="text-left pb-2">Status</th>
                      <th className="text-left pb-2">Depto</th>
                      <th className="text-left pb-2">Msgs</th>
                      <th className="text-left pb-2">Agente</th>
                      <th className="text-left pb-2">Última Ativ.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSessions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-2 text-white font-mono text-xs">{s.phone}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[s.status] || "bg-gray-600 text-gray-300"}`}>
                            {statusLabels[s.status] || s.status}
                          </span>
                        </td>
                        <td className="py-2 text-gray-300 capitalize text-xs">{s.department || "—"}</td>
                        <td className="py-2 text-gray-300 text-xs">{s._count?.messages || 0}</td>
                        <td className="py-2 text-gray-400 text-xs">{s.agentConfig?.name || "—"}</td>
                        <td className="py-2 text-gray-400 text-xs">{fmtDate(s.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
