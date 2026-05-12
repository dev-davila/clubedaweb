"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line,
} from "recharts";
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3,
  ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import Link from "next/link";

interface Props {
  years: number[];
  currentYear: number;
  monthlyByYear: Record<string, { month: number; monthLabel: string; views: number; sessions: number }[]>;
  yearlyTotals: { year: number; views: number; sessions: number }[];
  topPagesCurrentYear: { path: string; views: number }[];
  topPagesPrevYear: { path: string; views: number }[];
  channelsByYear: Record<string, { channel: string; views: number }[]>;
}

const YEAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function GrowthIndicator({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return <span className="text-gray-400 flex items-center gap-1"><Minus className="w-3 h-3" /> 0%</span>;
  if (prev === 0) return <span className="text-emerald-600 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> +100%</span>;
  const pct = ((current - prev) / prev) * 100;
  const isUp = pct > 0;
  return (
    <span className={`flex items-center gap-1 font-medium ${isUp ? "text-emerald-600" : pct < 0 ? "text-red-500" : "text-gray-400"}`}>
      {isUp ? <ArrowUp className="w-3 h-3" /> : pct < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {isUp ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export function ComparisonClient({
  years, currentYear, monthlyByYear, yearlyTotals, topPagesCurrentYear, topPagesPrevYear, channelsByYear,
}: Props) {
  const availableYears = years.length > 1 ? years : [currentYear];
  const [selectedYears, setSelectedYears] = useState<number[]>(
    years.length > 1 ? [currentYear - 1, currentYear] : [currentYear]
  );

  const toggleYear = (y: number) => {
    setSelectedYears((prev) =>
      prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y].sort()
    );
  };

  // Build chart data: months as x-axis, one line per selected year
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const row: any = { month: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][i] };
    for (const y of selectedYears) {
      const yd = monthlyByYear[String(y)];
      row[`views_${y}`] = yd ? yd[i]?.views || 0 : 0;
      row[`sessions_${y}`] = yd ? yd[i]?.sessions || 0 : 0;
    }
    return row;
  });

  const prevYear = currentYear - 1;
  const currTotal = yearlyTotals.find((y) => y.year === currentYear);
  const prevTotal = yearlyTotals.find((y) => y.year === prevYear);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/gestor/relatorios/acesso" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Comparação Anual</h1>
          </div>
          <p className="text-gray-500 text-sm ml-8">Comparação de métricas entre anos — dados armazenados por 3 anos</p>
        </div>
      </div>

      {/* Year toggles */}
      <div className="flex flex-wrap gap-2">
        {availableYears.map((y, i) => (
          <button
            key={y}
            onClick={() => toggleYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedYears.includes(y)
                ? "text-white border-transparent"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
            style={selectedYears.includes(y) ? { backgroundColor: YEAR_COLORS[i % YEAR_COLORS.length] } : {}}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Year summary cards */}
      {yearlyTotals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {yearlyTotals.map((yt, i) => {
            const prevYt = yearlyTotals[i - 1];
            return (
              <div key={yt.year} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">{yt.year}</span>
                  {prevYt && <GrowthIndicator current={yt.views} prev={prevYt.views} />}
                </div>
                <p className="text-2xl font-bold text-gray-900">{yt.views.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-400 mt-1">{yt.sessions.toLocaleString("pt-BR")} sessões</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly comparison chart - Views */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Visualizações mensais por ano</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number, name: string) => {
                  const year = name.replace("views_", "");
                  return [v.toLocaleString("pt-BR"), year];
                }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
              />
              <Legend formatter={(value) => value.replace("views_", "")} />
              {selectedYears.map((y, i) => (
                <Bar key={y} dataKey={`views_${y}`} fill={YEAR_COLORS[availableYears.indexOf(y) % YEAR_COLORS.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly comparison chart - Sessions (line) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Sessões mensais por ano</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number, name: string) => {
                  const year = name.replace("sessions_", "");
                  return [v.toLocaleString("pt-BR"), year];
                }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
              />
              <Legend formatter={(value) => value.replace("sessions_", "")} />
              {selectedYears.map((y) => (
                <Line key={y} type="monotone" dataKey={`sessions_${y}`} stroke={YEAR_COLORS[availableYears.indexOf(y) % YEAR_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month-by-month comparison table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Comparação mês a mês</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Mês</th>
                {selectedYears.map((y) => (
                  <th key={y} className="pb-2 font-medium text-right">{y} Views</th>
                ))}
                {selectedYears.length >= 2 && <th className="pb-2 font-medium text-right">Crescimento</th>}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => {
                const lastTwo = selectedYears.slice(-2);
                const currV = row[`views_${lastTwo[1]}`] || 0;
                const prevV = lastTwo.length > 1 ? (row[`views_${lastTwo[0]}`] || 0) : 0;
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-700">{row.month}</td>
                    {selectedYears.map((y) => (
                      <td key={y} className="py-2 text-right tabular-nums text-gray-600">
                        {(row[`views_${y}`] || 0).toLocaleString("pt-BR")}
                      </td>
                    ))}
                    {selectedYears.length >= 2 && (
                      <td className="py-2 text-right">
                        <GrowthIndicator current={currV} prev={prevV} />
                      </td>
                    )}
                  </tr>
                );
              })}
              {/* Total row */}
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="py-2 text-gray-800">Total</td>
                {selectedYears.map((y) => {
                  const total = chartData.reduce((s, r) => s + (r[`views_${y}`] || 0), 0);
                  return <td key={y} className="py-2 text-right tabular-nums text-gray-800">{total.toLocaleString("pt-BR")}</td>;
                })}
                {selectedYears.length >= 2 && (
                  <td className="py-2 text-right">
                    <GrowthIndicator
                      current={chartData.reduce((s, r) => s + (r[`views_${selectedYears[selectedYears.length - 1]}`] || 0), 0)}
                      prev={chartData.reduce((s, r) => s + (r[`views_${selectedYears[selectedYears.length - 2]}`] || 0), 0)}
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top pages comparison */}
      {(topPagesCurrentYear.length > 0 || topPagesPrevYear.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Páginas mais visitadas por ano</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topPagesCurrentYear.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">{currentYear}</h4>
                <div className="space-y-2">
                  {topPagesCurrentYear.slice(0, 10).map((p, i) => (
                    <div key={p.path} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-5 text-right">{i + 1}.</span>
                      <span className="font-medium text-gray-700 truncate flex-1" title={p.path}>{p.path}</span>
                      <span className="tabular-nums text-gray-500">{p.views.toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topPagesPrevYear.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">{currentYear - 1}</h4>
                <div className="space-y-2">
                  {topPagesPrevYear.slice(0, 10).map((p, i) => (
                    <div key={p.path} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-5 text-right">{i + 1}.</span>
                      <span className="font-medium text-gray-700 truncate flex-1" title={p.path}>{p.path}</span>
                      <span className="tabular-nums text-gray-500">{p.views.toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Channels by year */}
      {Object.keys(channelsByYear).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Canais de tráfego por ano</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedYears.map((y) => {
              const ch = channelsByYear[String(y)] || [];
              if (!ch.length) return null;
              const max = ch[0]?.views || 1;
              return (
                <div key={y}>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">{y}</h4>
                  <div className="space-y-2">
                    {ch.slice(0, 8).map((c, i) => (
                      <div key={c.channel}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 truncate">{c.channel}</span>
                          <span className="text-gray-500 tabular-nums">{c.views.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${(c.views / max) * 100}%`, backgroundColor: YEAR_COLORS[availableYears.indexOf(y) % YEAR_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pb-4">
        Dados armazenados por 3 anos para comparação histórica · Excluindo bots
      </p>
    </div>
  );
}
