// Painel de Segurança - Dashboard Principal
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Ban,
  Eye,
  AlertTriangle,
  Clock,
  Globe,
  Upload,
  Key,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Users,
  Zap,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";

interface SecurityStats {
  eventsToday: number;
  blockedToday: number;
  blockedWeek: number;
  topIPs: { ip: string; count: number }[];
  topTypes: { type: string; count: number }[];
  activeBlocks: number;
  loginBlocks: number;
  uploadBlocks: number;
  observationMode: boolean;
}

interface PhaseInfo {
  currentPhase: number;
  observation_mode: boolean;
  phases: Record<number, { name: string; description: string; active: boolean }>;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sql_injection_attempt: { label: "SQL Injection", icon: <Key size={14} />, color: "text-red-600" },
  xss_attempt: { label: "XSS", icon: <AlertTriangle size={14} />, color: "text-orange-600" },
  path_traversal_attempt: { label: "Path Traversal", icon: <Globe size={14} />, color: "text-yellow-600" },
  brute_force_attempt: { label: "Brute Force", icon: <Ban size={14} />, color: "text-red-600" },
  bot_scan_attempt: { label: "Bot/Scanner", icon: <Eye size={14} />, color: "text-blue-600" },
  rate_limit_exceeded: { label: "Rate Limit", icon: <Clock size={14} />, color: "text-purple-600" },
  malicious_upload_attempt: { label: "Upload Malicioso", icon: <Upload size={14} />, color: "text-red-600" },
  suspicious_request: { label: "Suspeito", icon: <ShieldAlert size={14} />, color: "text-gray-600" },
};

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [phaseInfo, setPhaseInfo] = useState<PhaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPhase, setChangingPhase] = useState(false);
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);
      const [statsRes, phaseRes] = await Promise.all([
        fetch("/api/gestor/security/stats"),
        fetch("/api/gestor/security/phase"),
      ]);
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      
      if (phaseRes.ok) {
        const data = await phaseRes.json();
        setPhaseInfo(data);
      }
      
      setError("");
    } catch (err) {
      setError("Erro ao carregar dados de segurança");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changePhase = async (phase: number) => {
    if (changingPhase) return;
    
    const phaseNames = { 1: "Monitoramento", 2: "Proteção Básica", 3: "Proteção Avançada" };
    const confirmed = confirm(
      `Deseja ativar a Fase ${phase} (${phaseNames[phase as keyof typeof phaseNames]})?\n\n` +
      (phase === 1 ? "O sistema irá apenas registrar eventos, sem bloquear requisições." :
       phase === 2 ? "O sistema irá bloquear rate limit excessivo, brute force e bots/scanners." :
       "O sistema irá bloquear todas as ameaças detectadas, incluindo SQLi e XSS.")
    );
    
    if (!confirmed) return;
    
    try {
      setChangingPhase(true);
      const res = await fetch("/api/gestor/security/phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });
      
      if (res.ok) {
        await loadStats();
        alert(`Fase ${phase} ativada com sucesso!`);
      } else {
        const data = await res.json();
        alert(`Erro: ${data.error || "Falha ao ativar fase"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao comunicar com o servidor");
    } finally {
      setChangingPhase(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Atualiza a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proteção da Aplicação</h1>
            <p className="text-sm text-gray-500">Monitoramento de segurança em tempo real</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Controle de Fases */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-900">Controle de Fases de Proteção</h3>
          </div>
          {changingPhase && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="animate-spin" size={16} />
              Alterando fase...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fase 1 */}
          <button
            onClick={() => changePhase(1)}
            disabled={changingPhase}
            className={`p-4 rounded-xl border-2 text-left transition ${
              phaseInfo?.currentPhase === 1
                ? "border-amber-500 bg-amber-50"
                : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
            } ${changingPhase ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye className={phaseInfo?.currentPhase === 1 ? "text-amber-600" : "text-gray-400"} size={18} />
              <span className={`font-medium ${phaseInfo?.currentPhase === 1 ? "text-amber-700" : "text-gray-700"}`}>
                Fase 1: Monitoramento
              </span>
              {phaseInfo?.currentPhase === 1 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-200 text-amber-700 text-xs rounded-full">Ativo</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Apenas registra eventos, sem bloquear requisições</p>
          </button>
          
          {/* Fase 2 */}
          <button
            onClick={() => changePhase(2)}
            disabled={changingPhase}
            className={`p-4 rounded-xl border-2 text-left transition ${
              phaseInfo?.currentPhase === 2
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
            } ${changingPhase ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock className={phaseInfo?.currentPhase === 2 ? "text-blue-600" : "text-gray-400"} size={18} />
              <span className={`font-medium ${phaseInfo?.currentPhase === 2 ? "text-blue-700" : "text-gray-700"}`}>
                Fase 2: Proteção Básica
              </span>
              {phaseInfo?.currentPhase === 2 && (
                <span className="ml-auto px-2 py-0.5 bg-blue-200 text-blue-700 text-xs rounded-full">Ativo</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Rate limit + Brute force + Bots/Scanners</p>
          </button>
          
          {/* Fase 3 */}
          <button
            onClick={() => changePhase(3)}
            disabled={changingPhase}
            className={`p-4 rounded-xl border-2 text-left transition ${
              phaseInfo?.currentPhase === 3
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
            } ${changingPhase ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className={phaseInfo?.currentPhase === 3 ? "text-green-600" : "text-gray-400"} size={18} />
              <span className={`font-medium ${phaseInfo?.currentPhase === 3 ? "text-green-700" : "text-gray-700"}`}>
                Fase 3: Proteção Avançada
              </span>
              {phaseInfo?.currentPhase === 3 && (
                <span className="ml-auto px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full">Ativo</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Todas as proteções: SQLi, XSS, Path Traversal, Uploads</p>
          </button>
        </div>
      </div>

      {/* Banner de Modo Observação (apenas se Fase 1) */}
      {phaseInfo?.currentPhase === 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Eye className="text-amber-600" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">Modo Observação Ativo (Fase 1)</h3>
            <p className="text-sm text-amber-600">
              O sistema está apenas registrando eventos, sem bloquear requisições. 
              Ative a Fase 2 ou 3 para começar a proteger ativamente.
            </p>
          </div>
          <button
            onClick={() => changePhase(2)}
            disabled={changingPhase}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            Ativar Fase 2
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Eventos Hoje</span>
            <Activity className="text-blue-500" size={18} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.eventsToday || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Total de eventos registrados</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Bloqueados Hoje</span>
            <Ban className="text-red-500" size={18} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.blockedToday || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.observationMode ? "Seriam bloqueados (modo observação)" : "Requisições bloqueadas"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Bloqueados Semana</span>
            <TrendingUp className="text-orange-500" size={18} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.blockedWeek || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Últimos 7 dias</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">IPs Bloqueados</span>
            <Users className="text-purple-500" size={18} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.activeBlocks || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Bloqueios ativos</p>
        </div>
      </div>

      {/* Grid de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top IPs Suspeitos */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top IPs Suspeitos</h3>
            <span className="text-xs text-gray-400">Últimos 7 dias</span>
          </div>
          <div className="space-y-3">
            {stats?.topIPs?.length ? (
              stats.topIPs.map((item, i) => (
                <div key={item.ip} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {i + 1}
                    </span>
                    <span className="font-mono text-sm text-gray-700">{item.ip}</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">{item.count} eventos</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum IP suspeito registrado</p>
            )}
          </div>
          <Link
            href="/gestor/seguranca/eventos"
            className="mt-4 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Ver todos os eventos <ChevronRight size={16} />
          </Link>
        </div>

        {/* Top Tipos de Evento */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Tipos de Ameaças</h3>
            <span className="text-xs text-gray-400">Últimos 7 dias</span>
          </div>
          <div className="space-y-3">
            {stats?.topTypes?.length ? (
              stats.topTypes.map((item) => {
                const config = EVENT_TYPE_LABELS[item.type] || {
                  label: item.type,
                  icon: <ShieldAlert size={14} />,
                  color: "text-gray-600",
                };
                return (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={config.color}>{config.icon}</span>
                      <span className="text-sm text-gray-700">{config.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{item.count}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma ameaça detectada</p>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Métricas Específicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
              <Key className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-red-600">Tentativas de Login</p>
              <p className="text-2xl font-bold text-red-700">{stats?.loginBlocks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
              <Upload className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-orange-600">Uploads Bloqueados</p>
              <p className="text-2xl font-bold text-orange-700">{stats?.uploadBlocks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-green-600">Status do Módulo</p>
              <p className="text-lg font-bold text-green-700">
                {stats?.observationMode ? "Observando" : "Protegendo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/gestor/seguranca/eventos"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                <Activity className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Eventos</h3>
                <p className="text-sm text-gray-500">Ver todos os registros</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition" size={20} />
          </div>
        </Link>

        <Link
          href="/gestor/seguranca/bloqueios"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:border-red-200 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition">
                <Ban className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Bloqueios</h3>
                <p className="text-sm text-gray-500">Gerenciar IPs bloqueados</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-red-600 transition" size={20} />
          </div>
        </Link>

        <Link
          href="/gestor/seguranca/configuracoes"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-200 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                <Shield className="text-purple-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Configurações</h3>
                <p className="text-sm text-gray-500">Ajustar regras e limites</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition" size={20} />
          </div>
        </Link>
      </div>
    </div>
  );
}
