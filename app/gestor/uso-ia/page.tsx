"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Cpu,
  FileText,
  Image as ImageIcon,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

interface UsageLog {
  id: string;
  model: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number | null;
  estimatedCost: number;
  hasRealCost: boolean;
  operation: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
    briefTitle: string;
  } | null;
}

interface MonthlyData {
  month: string;
  label: string;
  cost: number;
  estimatedCost: number;
  tokens: number;
  operations: number;
  textOps: number;
  imageOps: number;
  postsCount: number;
}

interface ModelUsage {
  model: string;
  label: string;
  cost: number;
  estimatedCost: number;
  count: number;
  tokens: number;
}

interface OperationUsage {
  operation: string;
  count: number;
  estimatedCost: number;
}

interface UsageData {
  logs: UsageLog[];
  totals: {
    totalCost: number;
    estimatedCost: number;
    textCost: number;
    imageCost: number;
    totalTokens: number;
    totalPosts: number;
    totalImages: number;
    totalOperations: number;
  };
  monthlyData: MonthlyData[];
  dailyData: { date: string; cost: number; estimatedCost: number; tokens: number; operations: number }[];
  modelUsage: ModelUsage[];
  operationUsage: OperationUsage[];
  period: number | string;
}

const operationLabels: Record<string, string> = {
  GENERATE_TEXT: "Geração de Texto",
  GENERATE_IMAGE: "Geração de Imagem",
  GENERATE_POST: "Geração de Post"
};

const operationColors: Record<string, { bg: string; text: string; icon: string }> = {
  GENERATE_TEXT: { bg: "bg-purple-100", text: "text-purple-700", icon: "text-purple-500" },
  GENERATE_IMAGE: { bg: "bg-amber-100", text: "text-amber-700", icon: "text-amber-500" },
  GENERATE_POST: { bg: "bg-blue-100", text: "text-blue-700", icon: "text-blue-500" }
};

export default function UsoIAPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageData | null>(null);
  const [period, setPeriod] = useState("all");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"mensal" | "diario" | "atividade">("mensal");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gestor/ai-usage?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching AI usage:", error);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatMonth = (label: string) => {
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Uso de IA</h1>
          <p className="text-gray-500">Consumo e precificação mensal de inteligência artificial</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Todo o período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Custo Estimado Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(data.totals.estimatedCost)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Operações</p>
                  <p className="text-lg font-bold text-gray-900">{data.totals.totalOperations}</p>
                  <p className="text-xs text-gray-400">chamadas à API</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Textos Gerados</p>
                  <p className="text-lg font-bold text-gray-900">{data.totals.totalPosts}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(data.totals.textCost)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ImageIcon size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Imagens Geradas</p>
                  <p className="text-lg font-bold text-gray-900">{data.totals.totalImages}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(data.totals.imageCost)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Cpu size={20} className="text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Tokens Usados</p>
                  <p className="text-lg font-bold text-gray-900">{data.totals.totalTokens.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-gray-400">prompt + output</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {([
              { key: "mensal" as const, label: "Resumo Mensal", icon: Calendar },
              { key: "diario" as const, label: "Uso Diário", icon: BarChart3 },
              { key: "atividade" as const, label: "Atividade Recente", icon: TrendingUp }
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* === TAB: Monthly Summary === */}
          {activeTab === "mensal" && (
            <div className="space-y-6">
              {/* Monthly Cost Table */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    Precificação Mensal
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Detalhamento de custos estimados por mês</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Mês</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Operações</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Textos</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Imagens</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Posts</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Custo (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.monthlyData.length > 0 ? data.monthlyData.map((month) => (
                        <tr key={month.month} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-900">{formatMonth(month.label)}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 text-sm font-medium rounded-full px-3 py-0.5">
                              {month.operations}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-sm text-purple-700">
                              <FileText size={14} />
                              {month.textOps}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-sm text-amber-700">
                              <ImageIcon size={14} />
                              {month.imageOps}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-sm text-blue-700 font-medium">{month.postsCount}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-mono font-semibold text-gray-900">{formatCurrency(month.estimatedCost)}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                            Nenhum registro encontrado no período
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {data.monthlyData.length > 0 && (
                      <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                        <tr>
                          <td className="px-5 py-4 font-bold text-blue-900">TOTAL</td>
                          <td className="px-5 py-4 text-center font-bold text-blue-900">{data.totals.totalOperations}</td>
                          <td className="px-5 py-4 text-center font-bold text-purple-700">
                            {data.monthlyData.reduce((s, m) => s + m.textOps, 0)}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-amber-700">{data.totals.totalImages}</td>
                          <td className="px-5 py-4 text-center font-bold text-blue-700">{data.totals.totalPosts}</td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-blue-900">{formatCurrency(data.totals.estimatedCost)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Info size={12} />
                    Custos estimados baseados na precificação padrão dos modelos utilizados.
                  </p>
                </div>
              </div>

              {/* Model & Operation Breakdown side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Model */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cpu size={18} className="text-purple-600" />
                    Custo por Modelo
                  </h3>
                  <div className="space-y-4">
                    {data.modelUsage.map((model) => {
                      const maxCost = Math.max(...data.modelUsage.map(m => m.estimatedCost), 0.01);
                      const pct = (model.estimatedCost / maxCost) * 100;
                      return (
                        <div key={model.model}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                model.model.includes("claude") ? "bg-purple-500" :
                                model.model.includes("dall-e") ? "bg-amber-500" : "bg-blue-500"
                              }`} />
                              <span className="text-sm font-medium text-gray-700">{model.label}</span>
                              <span className="text-xs text-gray-400">({model.count}x)</span>
                            </div>
                            <span className="font-mono text-sm font-semibold text-gray-900">{formatCurrency(model.estimatedCost)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                model.model.includes("claude") ? "bg-purple-400" :
                                model.model.includes("dall-e") ? "bg-amber-400" : "bg-blue-400"
                              }`}
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By Operation */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-blue-600" />
                    Custo por Tipo de Operação
                  </h3>
                  <div className="space-y-4">
                    {data.operationUsage.map((op) => {
                      const colors = operationColors[op.operation] || { bg: "bg-gray-100", text: "text-gray-700", icon: "text-gray-500" };
                      const maxCost = Math.max(...data.operationUsage.map(o => o.estimatedCost), 0.01);
                      const pct = (op.estimatedCost / maxCost) * 100;
                      return (
                        <div key={op.operation}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {op.operation === "GENERATE_IMAGE" ? <ImageIcon size={12} /> : <FileText size={12} />}
                                {operationLabels[op.operation] || op.operation}
                              </span>
                              <span className="text-xs text-gray-400">{op.count} chamadas</span>
                            </div>
                            <span className="font-mono text-sm font-semibold text-gray-900">{formatCurrency(op.estimatedCost)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                op.operation === "GENERATE_IMAGE" ? "bg-amber-400" :
                                op.operation === "GENERATE_POST" ? "bg-blue-400" : "bg-purple-400"
                              }`}
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost breakdown summary */}
                  <div className="mt-6 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Texto (Claude Sonnet)</span>
                      <span className="font-mono font-medium">{formatCurrency(data.totals.textCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Imagens (DALL-E 3)</span>
                      <span className="font-mono font-medium">{formatCurrency(data.totals.imageCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-2">
                      <span className="text-gray-700">Total Estimado</span>
                      <span className="font-mono text-green-700">{formatCurrency(data.totals.estimatedCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TAB: Daily Usage === */}
          {activeTab === "diario" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                Uso Diário
              </h3>
              {data.dailyData.length > 0 ? (
                <div className="space-y-2">
                  {data.dailyData.slice(-14).map((day) => {
                    const maxCost = Math.max(...data.dailyData.map(d => d.estimatedCost), 0.01);
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-24 shrink-0">
                          {new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-end pr-3"
                            style={{
                              width: `${Math.max(8, (day.estimatedCost / maxCost) * 100)}%`
                            }}
                          >
                            <span className="text-xs text-white font-medium whitespace-nowrap">{formatCurrency(day.estimatedCost)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right shrink-0">{day.operations} ops</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum uso registrado no período</p>
              )}
            </div>
          )}

          {/* === TAB: Recent Activity === */}
          {activeTab === "atividade" && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-5 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Atividade Recente
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Operação</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Modelo</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Post</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Custo Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(showAllLogs ? data.logs : data.logs.slice(0, 20)).map((log) => {
                      const colors = operationColors[log.operation] || { bg: "bg-gray-100", text: "text-gray-700", icon: "text-gray-500" };
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {log.operation === "GENERATE_IMAGE" ? <ImageIcon size={12} /> : <FileText size={12} />}
                              {operationLabels[log.operation] || log.operation}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700 font-mono">
                            {data.modelUsage.find(m => m.model === log.model)?.label || log.model}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700 max-w-xs truncate">
                            {log.post?.title || log.post?.briefTitle || "-"}
                          </td>
                          <td className="px-5 py-3 text-sm text-right font-mono font-medium text-gray-900">
                            {formatCurrency(log.estimatedCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {data.logs.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum uso de IA registrado no período selecionado
                  </div>
                )}
                {data.logs.length > 20 && (
                  <div className="p-4 border-t text-center">
                    <button
                      onClick={() => setShowAllLogs(!showAllLogs)}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showAllLogs ? (
                        <><ChevronUp size={16} /> Mostrar menos</>
                      ) : (
                        <><ChevronDown size={16} /> Ver todos ({data.logs.length} registros)</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Sobre a precificação</p>
                <p className="text-blue-700">
                  Os custos apresentados são estimativas em dólar (USD) baseadas na precificação oficial dos modelos de IA utilizados:
                  <strong> Claude Sonnet 4</strong> ($0.003/1K input, $0.015/1K output) e
                  <strong> DALL-E 3</strong> ($0.04/imagem).
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}