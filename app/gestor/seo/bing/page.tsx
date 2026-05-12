"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  FileText,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Clock,
  BarChart3,
  AlertCircle,
  Zap,
  List,
  Search,
  TrendingUp,
  ExternalLink,
  Database,
  Eye,
  MousePointerClick,
  Info,
} from "lucide-react";
import { format } from "date-fns";

interface Site {
  Url: string;
  IsVerified: boolean;
}

interface IndexNowLog {
  id: string;
  urls: string[];
  status: string;
  response: string | null;
  engine: string;
  createdAt: string;
}

interface Sitemap {
  Url: string;
  LastCrawledDate?: string;
  LastSubmittedDate?: string;
  SubmittedCount?: number;
  IndexedCount?: number;
}

interface KeywordResult {
  Query: string;
  Impressions: number;
  BroadImpressions: number;
  Date: string;
}

interface SubmissionRecord {
  id: string;
  sitemapUrl: string;
  urlCount: number;
  status: string;
  createdAt: string;
}

export default function BingWebmasterPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "sites";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ configured: false });
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [sitemaps, setSitemaps] = useState<Sitemap[]>([]);
  const [indexNowLogs, setIndexNowLogs] = useState<IndexNowLog[]>([]);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);

  // Stats sub-states
  const [queryStats, setQueryStats] = useState<any[]>([]);
  const [pageStats, setPageStats] = useState<any[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionRecord[]>([]);
  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordResults, setKeywordResults] = useState<KeywordResult[]>([]);
  const [searchingKeyword, setSearchingKeyword] = useState(false);
  const [urlInfo, setUrlInfo] = useState<any>(null);
  const [statsSubTab, setStatsSubTab] = useState("overview");

  // Form states
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [submittingSitemap, setSubmittingSitemap] = useState(false);
  const [indexNowUrls, setIndexNowUrls] = useState("");
  const [indexNowHost, setIndexNowHost] = useState("");
  const [submittingIndexNow, setSubmittingIndexNow] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "indexnow") {
      fetchIndexNowLogs();
    } else if (activeTab === "sitemaps" && selectedSite) {
      fetchSitemaps();
    } else if (activeTab === "stats" && selectedSite) {
      fetchStats();
    }
  }, [activeTab, selectedSite]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/gestor/seo/bing/status");
      const data = await res.json();
      setStatus(data);

      if (data.configured) {
        await fetchSites();
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/gestor/seo/bing/sites");
      const data = await res.json();
      setSites(data.sites || []);
      if (data.sites?.length > 0) {
        setSelectedSite(data.sites[0].Url);
        setIndexNowHost(new URL(data.sites[0].Url).hostname);
      }
    } catch (error) {
      console.error("Erro ao buscar sites:", error);
    }
  };

  const fetchSitemaps = async () => {
    if (!selectedSite) return;
    setLoadingSitemaps(true);
    try {
      const res = await fetch(
        `/api/gestor/seo/bing/sitemaps?siteUrl=${encodeURIComponent(selectedSite)}`
      );
      const data = await res.json();
      setSitemaps(data.sitemaps || []);
    } catch (error) {
      console.error("Erro ao buscar sitemaps:", error);
    } finally {
      setLoadingSitemaps(false);
    }
  };

  const fetchIndexNowLogs = async () => {
    try {
      const res = await fetch("/api/gestor/seo/bing/indexnow");
      const data = await res.json();
      setIndexNowLogs(data.logs || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  const fetchStats = async () => {
    if (!selectedSite) return;
    setLoadingStats(true);
    try {
      const enc = encodeURIComponent(selectedSite);
      const [crawlRes, quotaRes, queryRes, pageRes, historyRes, urlInfoRes] = await Promise.all([
        fetch(`/api/gestor/seo/bing/stats?siteUrl=${enc}&type=crawl`),
        fetch(`/api/gestor/seo/bing/stats?siteUrl=${enc}&type=quota`),
        fetch(`/api/gestor/seo/bing/stats?siteUrl=${enc}&type=query`),
        fetch(`/api/gestor/seo/bing/stats?siteUrl=${enc}&type=page`),
        fetch(`/api/gestor/seo/bing/stats?siteUrl=${enc}&type=history`),
        fetch(`/api/gestor/seo/bing/stats?siteUrl=${enc}&type=urlinfo`),
      ]);
      const crawlData = await crawlRes.json();
      const quotaData = await quotaRes.json();
      const queryData = await queryRes.json();
      const pageData = await pageRes.json();
      const historyData = await historyRes.json();
      const urlInfoData = await urlInfoRes.json();
      setStats(crawlData.data);
      setQuota(quotaData.data);
      setQueryStats(queryData.data || []);
      setPageStats(pageData.data || []);
      setSubmissionHistory(historyData.data || []);
      setUrlInfo(urlInfoData.data || null);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleKeywordSearch = async () => {
    if (!selectedSite || !keywordQuery.trim()) return;
    setSearchingKeyword(true);
    try {
      const res = await fetch(
        `/api/gestor/seo/bing/stats?siteUrl=${encodeURIComponent(selectedSite)}&type=keyword&query=${encodeURIComponent(keywordQuery.trim())}`
      );
      const data = await res.json();
      setKeywordResults(data.data || []);
    } catch (error) {
      console.error("Erro ao pesquisar keyword:", error);
    } finally {
      setSearchingKeyword(false);
    }
  };

  const [sitemapMessage, setSitemapMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleSubmitSitemap = async () => {
    if (!selectedSite || !newSitemapUrl) return;
    setSubmittingSitemap(true);
    setSitemapMessage(null);
    try {
      const res = await fetch("/api/gestor/seo/bing/sitemaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: selectedSite,
          sitemapUrl: newSitemapUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewSitemapUrl("");
        fetchSitemaps();
        setSitemapMessage({ type: 'success', text: data.message || 'Sitemap submetido com sucesso!' });
      } else {
        setSitemapMessage({ type: 'error', text: data.error || 'Erro ao submeter sitemap' });
      }
    } catch (error) {
      console.error("Erro:", error);
      setSitemapMessage({ type: 'error', text: 'Erro de conexão ao submeter sitemap' });
    } finally {
      setSubmittingSitemap(false);
    }
  };

  const handleSubmitIndexNow = async () => {
    if (!indexNowHost || !indexNowUrls.trim()) return;
    setSubmittingIndexNow(true);
    try {
      const urls = indexNowUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      if (urls.length === 0) {
        alert("Informe pelo menos uma URL");
        return;
      }

      const res = await fetch("/api/gestor/seo/bing/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: indexNowHost,
          urls,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIndexNowUrls("");
        fetchIndexNowLogs();
        alert(data.message);
      } else {
        alert(data.error || data.message || "Erro ao submeter URLs");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao submeter URLs");
    } finally {
      setSubmittingIndexNow(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!status.configured) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/gestor/seo" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Bing Webmaster</h1>
        </div>
        <div className="bg-white rounded-xl border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">API Key não configurada</h2>
          <p className="text-gray-600 mb-4">
            Configure a API Key do Bing Webmaster Tools para usar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/gestor/seo" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bing Webmaster</h1>
            <p className="text-gray-500">Gerenciamento de sites e IndexNow</p>
          </div>
        </div>
      </div>

      {/* Site Selector */}
      {sites.length > 0 && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site
          </label>
          <select
            value={selectedSite}
            onChange={(e) => {
              setSelectedSite(e.target.value);
              try {
                setIndexNowHost(new URL(e.target.value).hostname);
              } catch {}
            }}
            className="w-full md:w-auto min-w-[300px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {sites.map((site) => (
              <option key={site.Url} value={site.Url}>
                {site.Url} {site.IsVerified ? "✓" : "(não verificado)"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-1">
          {[
            { id: "sites", label: "Sites", icon: Globe },
            { id: "sitemaps", label: "Sitemaps", icon: FileText },
            { id: "indexnow", label: "IndexNow", icon: Zap },
            { id: "stats", label: "Estatísticas", icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "sites" && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Sites Cadastrados</h3>
          </div>
          {sites.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum site cadastrado no Bing Webmaster
            </div>
          ) : (
            <div className="divide-y">
              {sites.map((site) => (
                <div
                  key={site.Url}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{site.Url}</div>
                      <div className="text-sm text-gray-500">
                        {site.IsVerified ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verificado
                          </span>
                        ) : (
                          <span className="text-amber-600">Pendente verificação</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "sitemaps" && (
        <div className="space-y-6">
          {/* Add Sitemap */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Submeter Sitemap ao Bing</h3>
            <p className="text-sm text-gray-500 mb-3">
              As URLs do sitemap serão extraídas e submetidas ao Bing via URL Submission API.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={newSitemapUrl}
                onChange={(e) => setNewSitemapUrl(e.target.value)}
                placeholder="https://exemplo.com/sitemap.xml"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleSubmitSitemap}
                disabled={submittingSitemap || !newSitemapUrl || !selectedSite}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingSitemap ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Submeter
              </button>
            </div>
            {sitemapMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                sitemapMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {sitemapMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {sitemapMessage.text}
              </div>
            )}
          </div>

          {/* Sitemaps List */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Sitemaps</h3>
              <button
                onClick={fetchSitemaps}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSitemaps ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loadingSitemaps ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : sitemaps.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum sitemap encontrado
              </div>
            ) : (
              <div className="divide-y">
                {sitemaps.map((sitemap, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50">
                    <div className="font-medium text-sm">{sitemap.Url}</div>
                    <div className="text-xs text-gray-500 mt-1 flex gap-4">
                      {(sitemap as any).UrlCount > 0 && (
                        <span>URLs submetidas: {(sitemap as any).UrlCount}</span>
                      )}
                      {(sitemap as any).LastSubmittedDate && (
                        <span>Submetido em: {new Date((sitemap as any).LastSubmittedDate).toLocaleString('pt-BR')}</span>
                      )}
                      {(sitemap as any).Status && (
                        <span className={`${(sitemap as any).Status === 'SUBMITTED' ? 'text-green-600' : 'text-amber-600'}`}>
                          {(sitemap as any).Status}
                        </span>
                      )}
                      {sitemap.SubmittedCount !== undefined && (
                        <span>Submetidos: {sitemap.SubmittedCount}</span>
                      )}
                      {sitemap.IndexedCount !== undefined && (
                        <span>Indexados: {sitemap.IndexedCount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "indexnow" && (
        <div className="space-y-6">
          {/* IndexNow Info */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-800 flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              O que é IndexNow?
            </h3>
            <p className="text-sm text-teal-700">
              IndexNow permite notificar os mecanismos de busca (Bing, Yandex, etc.) sobre URLs novas
              ou alteradas para indexação mais rápida. Máximo de 10.000 URLs por requisição.
            </p>
          </div>

          {/* Submit URLs */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Enviar URLs via IndexNow</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  value={indexNowHost}
                  onChange={(e) => setIndexNowHost(e.target.value)}
                  placeholder="www.exemplo.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URLs (uma por linha)
                </label>
                <textarea
                  value={indexNowUrls}
                  onChange={(e) => setIndexNowUrls(e.target.value)}
                  placeholder={`https://${indexNowHost || "www.exemplo.com"}/pagina1\nhttps://${indexNowHost || "www.exemplo.com"}/pagina2`}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                />
              </div>
              <button
                onClick={handleSubmitIndexNow}
                disabled={submittingIndexNow || !indexNowHost || !indexNowUrls.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingIndexNow ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar para IndexNow
              </button>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Submissões Recentes</h3>
              <button
                onClick={fetchIndexNowLogs}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {indexNowLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhuma submissão IndexNow registrada
              </div>
            ) : (
              <div className="divide-y">
                {indexNowLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.status === "SUCCESS" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            log.status === "SUCCESS" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.urls.length} URL(s)
                      </span>
                    </div>
                    {log.response && (
                      <p className="text-sm text-gray-600">{log.response}</p>
                    )}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Ver URLs
                      </summary>
                      <ul className="mt-2 text-xs text-gray-600 space-y-1 max-h-32 overflow-auto">
                        {log.urls.map((url, idx) => (
                          <li key={idx} className="truncate">
                            {url}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : !selectedSite ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Selecione um site para ver as estatísticas</p>
            </div>
          ) : (
            <>
              {/* Stats Sub-Tabs */}
              <div className="bg-white rounded-lg border">
                <div className="flex gap-1 p-2 border-b overflow-x-auto">
                  {[
                    { id: "overview", label: "Visão Geral", icon: BarChart3 },
                    { id: "keywords", label: "Palavras-chave", icon: Search },
                    { id: "traffic", label: "Tráfego", icon: TrendingUp },
                    { id: "history", label: "Submissões", icon: Database },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatsSubTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                        statsSubTab === tab.id
                          ? "bg-teal-50 text-teal-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* OVERVIEW */}
                {statsSubTab === "overview" && (
                  <div className="p-6 space-y-6">
                    {/* Quota com barras */}
                    {quota && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Database className="w-4 h-4 text-teal-600" />
                          Quota de Submissão
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">Quota Diária Restante</span>
                              <span className="text-2xl font-bold text-teal-600">{quota.DailyQuota || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-teal-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, ((quota.DailyQuota || 0) / Math.max(1, (quota.MonthlyQuota || 100) / 30)) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">Quota Mensal Restante</span>
                              <span className="text-2xl font-bold text-blue-600">{quota.MonthlyQuota || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, ((quota.MonthlyQuota || 0) / 1500) * 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">de 1.500 URLs/mês</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Crawl Stats */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Rastreamento (Crawl)
                      </h4>
                      {stats && (typeof stats === 'object') && (stats.CrawledPages !== undefined || stats.InIndex !== undefined || stats.CrawlErrors !== undefined) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-white border rounded-xl text-center">
                            <Globe className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-gray-900">{stats.CrawledPages ?? 0}</div>
                            <div className="text-sm text-gray-600 mt-1">Páginas Rastreadas</div>
                          </div>
                          <div className="p-4 bg-white border rounded-xl text-center">
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-green-600">{stats.InIndex ?? 0}</div>
                            <div className="text-sm text-gray-600 mt-1">No Índice do Bing</div>
                          </div>
                          <div className="p-4 bg-white border rounded-xl text-center">
                            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-red-600">{stats.CrawlErrors ?? 0}</div>
                            <div className="text-sm text-gray-600 mt-1">Erros de Crawl</div>
                          </div>
                        </div>
                      ) : Array.isArray(stats) && stats.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {stats.slice(0, 6).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white border rounded-xl text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {item.CrawledPages ?? item.Count ?? 0}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {item.Date ? format(new Date(parseInt(item.Date.match(/\d+/)?.[0] || '0')), 'dd/MM/yyyy') : `Registro ${idx + 1}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
                          <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Dados de rastreamento ainda não disponíveis.</p>
                          <p className="text-xs mt-1">O Bing pode levar alguns dias para rastrear um site recém-adicionado.</p>
                        </div>
                      )}
                    </div>

                    {/* URL Info */}
                    {urlInfo && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4 text-purple-600" />
                          Informações do Site
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 bg-white border rounded-lg">
                            <div className="text-xs text-gray-500">É Página</div>
                            <div className="font-semibold mt-1">{urlInfo.IsPage ? 'Sim' : 'Não'}</div>
                          </div>
                          <div className="p-3 bg-white border rounded-lg">
                            <div className="text-xs text-gray-500">URLs Filhas</div>
                            <div className="font-semibold mt-1">{urlInfo.TotalChildUrlCount ?? 0}</div>
                          </div>
                          <div className="p-3 bg-white border rounded-lg">
                            <div className="text-xs text-gray-500">Âncoras</div>
                            <div className="font-semibold mt-1">{urlInfo.AnchorCount ?? 0}</div>
                          </div>
                          <div className="p-3 bg-white border rounded-lg">
                            <div className="text-xs text-gray-500">Tamanho Doc</div>
                            <div className="font-semibold mt-1">
                              {urlInfo.DocumentSize ? `${(urlInfo.DocumentSize / 1024).toFixed(1)} KB` : '—'}
                            </div>
                          </div>
                          {urlInfo.HttpStatus > 0 && (
                            <div className="p-3 bg-white border rounded-lg">
                              <div className="text-xs text-gray-500">Status HTTP</div>
                              <div className={`font-semibold mt-1 ${urlInfo.HttpStatus === 200 ? 'text-green-600' : 'text-amber-600'}`}>
                                {urlInfo.HttpStatus}
                              </div>
                            </div>
                          )}
                          {urlInfo.LastCrawledDate && !urlInfo.LastCrawledDate.includes('-6213') && (
                            <div className="p-3 bg-white border rounded-lg">
                              <div className="text-xs text-gray-500">Último Rastreio</div>
                              <div className="font-semibold mt-1 text-sm">
                                {(() => {
                                  try {
                                    const ms = parseInt(urlInfo.LastCrawledDate.match(/\d+/)?.[0] || '0');
                                    return ms > 0 ? format(new Date(ms), 'dd/MM/yyyy') : '—';
                                  } catch { return '—'; }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Query Stats */}
                    {queryStats.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Search className="w-4 h-4 text-orange-600" />
                          Consultas de Pesquisa
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left p-3 font-medium text-gray-600">Consulta</th>
                                <th className="text-right p-3 font-medium text-gray-600">Impressões</th>
                                <th className="text-right p-3 font-medium text-gray-600">Cliques</th>
                                <th className="text-right p-3 font-medium text-gray-600">Data</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queryStats.slice(0, 20).map((q: any, idx: number) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="p-3 font-medium">{q.Query || '—'}</td>
                                  <td className="p-3 text-right">{q.Impressions ?? 0}</td>
                                  <td className="p-3 text-right">{q.Clicks ?? 0}</td>
                                  <td className="p-3 text-right text-gray-500">
                                    {q.Date ? (() => { try { return format(new Date(parseInt(q.Date.match(/\d+/)?.[0] || '0')), 'dd/MM/yy'); } catch { return '—'; } })() : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Page Stats */}
                    {pageStats.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          Páginas com Tráfego
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left p-3 font-medium text-gray-600">URL</th>
                                <th className="text-right p-3 font-medium text-gray-600">Impressões</th>
                                <th className="text-right p-3 font-medium text-gray-600">Cliques</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageStats.slice(0, 20).map((p: any, idx: number) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="p-3">
                                    <a href={p.Query || p.Url || '#'} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline flex items-center gap-1">
                                      <span className="truncate max-w-[300px]">{p.Query || p.Url || '—'}</span>
                                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                  </td>
                                  <td className="p-3 text-right">{p.Impressions ?? 0}</td>
                                  <td className="p-3 text-right">{p.Clicks ?? 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Nota se dados vazios */}
                    {(!stats || (Array.isArray(stats) && stats.length === 0)) && queryStats.length === 0 && pageStats.length === 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Site recém-adicionado</p>
                            <p className="text-xs text-amber-700 mt-1">
                              O Bing ainda não coletou dados suficientes de rastreamento e tráfego para este site.
                              Continue submetendo URLs e use o IndexNow para acelerar a indexação.
                              Os dados começarão a aparecer dentro de alguns dias.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* KEYWORDS */}
                {statsSubTab === "keywords" && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Search className="w-4 h-4 text-teal-600" />
                        Pesquisa de Palavras-chave
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Descubra o volume de impressões de qualquer palavra-chave no Bing. Útil para planejamento de conteúdo e SEO.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keywordQuery}
                          onChange={(e) => setKeywordQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                          placeholder="Digite uma palavra-chave (ex: marketing digital)"
                          className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <button
                          onClick={handleKeywordSearch}
                          disabled={searchingKeyword || !keywordQuery.trim()}
                          className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                        >
                          {searchingKeyword ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          Pesquisar
                        </button>
                      </div>
                    </div>

                    {keywordResults.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-700">
                            Resultados para &quot;{keywordQuery}&quot;
                          </h5>
                          <span className="text-xs text-gray-500">{keywordResults.length} registros</span>
                        </div>

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                            <Eye className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-teal-700">
                              {keywordResults.reduce((sum, k) => sum + (k.Impressions || 0), 0).toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-600">Impressões Exatas (Total)</div>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-center">
                            <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-blue-700">
                              {keywordResults.reduce((sum, k) => sum + (k.BroadImpressions || 0), 0).toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-600">Impressões Amplas (Total)</div>
                          </div>
                          <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-center">
                            <BarChart3 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-purple-700">
                              {keywordResults.length > 0 ? Math.round(keywordResults.reduce((sum, k) => sum + (k.Impressions || 0), 0) / keywordResults.length).toLocaleString('pt-BR') : 0}
                            </div>
                            <div className="text-xs text-gray-600">Média Semanal</div>
                          </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left p-3 font-medium text-gray-600">Semana</th>
                                <th className="text-right p-3 font-medium text-gray-600">Impressões Exatas</th>
                                <th className="text-right p-3 font-medium text-gray-600">Impressões Amplas</th>
                                <th className="p-3 font-medium text-gray-600 w-40">Volume</th>
                              </tr>
                            </thead>
                            <tbody>
                              {keywordResults.map((k, idx) => {
                                const maxBroad = Math.max(...keywordResults.map(r => r.BroadImpressions || 0), 1);
                                return (
                                  <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-gray-700">
                                      {(() => {
                                        try {
                                          const ms = parseInt(k.Date?.match?.(/\d+/)?.[0] || '0');
                                          return ms > 0 ? format(new Date(ms), 'dd/MM/yyyy') : '—';
                                        } catch { return '—'; }
                                      })()}
                                    </td>
                                    <td className="p-3 text-right font-medium">{(k.Impressions || 0).toLocaleString('pt-BR')}</td>
                                    <td className="p-3 text-right font-medium">{(k.BroadImpressions || 0).toLocaleString('pt-BR')}</td>
                                    <td className="p-3">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-teal-500 h-2 rounded-full"
                                          style={{ width: `${((k.BroadImpressions || 0) / maxBroad) * 100}%` }}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          * Impressões Exatas = correspondência exata da palavra-chave. Impressões Amplas = inclui variações e sinônimos.
                        </p>
                      </div>
                    )}

                    {keywordResults.length === 0 && keywordQuery && !searchingKeyword && (
                      <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum resultado encontrado para esta palavra-chave.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TRAFFIC */}
                {statsSubTab === "traffic" && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Dados de Tráfego
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Impressões e cliques das suas páginas no Bing Search.
                      </p>
                    </div>

                    {queryStats.length > 0 ? (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Consultas de Pesquisa</h5>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left p-3 font-medium text-gray-600">Consulta</th>
                                <th className="text-right p-3 font-medium text-gray-600">Impressões</th>
                                <th className="text-right p-3 font-medium text-gray-600">Cliques</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queryStats.slice(0, 25).map((q: any, idx: number) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="p-3 font-medium">{q.Query || '—'}</td>
                                  <td className="p-3 text-right">{q.Impressions ?? 0}</td>
                                  <td className="p-3 text-right">{q.Clicks ?? 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
                        <MousePointerClick className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Sem dados de consultas ainda.</p>
                        <p className="text-xs mt-1">Os dados de tráfego de pesquisa aparecerão quando seu site receber impressões no Bing.</p>
                      </div>
                    )}

                    {pageStats.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Páginas com Tráfego</h5>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left p-3 font-medium text-gray-600">URL</th>
                                <th className="text-right p-3 font-medium text-gray-600">Impressões</th>
                                <th className="text-right p-3 font-medium text-gray-600">Cliques</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageStats.slice(0, 25).map((p: any, idx: number) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="p-3">
                                    <a href={p.Query || p.Url || '#'} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate block max-w-[350px]">
                                      {p.Query || p.Url || '—'}
                                    </a>
                                  </td>
                                  <td className="p-3 text-right">{p.Impressions ?? 0}</td>
                                  <td className="p-3 text-right">{p.Clicks ?? 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBMISSION HISTORY */}
                {statsSubTab === "history" && (
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-600" />
                        Histórico de Submissões
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Todas as submissões de URLs realizadas para o Bing via Sitemaps.
                      </p>
                    </div>

                    {submissionHistory.length > 0 ? (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                            <div className="text-lg font-bold text-teal-700">{submissionHistory.length}</div>
                            <div className="text-xs text-gray-600">Total Submissões</div>
                          </div>
                          <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
                            <div className="text-lg font-bold text-green-700">
                              {submissionHistory.reduce((sum, s) => sum + (s.urlCount || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-600">URLs Submetidas</div>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-center">
                            <div className="text-lg font-bold text-blue-700">
                              {submissionHistory.filter(s => s.status === 'SUCCESS' || s.status === 'PARTIAL').length}
                            </div>
                            <div className="text-xs text-gray-600">Bem Sucedidas</div>
                          </div>
                        </div>

                        {/* List */}
                        <div className="border rounded-lg divide-y">
                          {submissionHistory.map((sub) => (
                            <div key={sub.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    sub.status === 'SUCCESS' ? 'bg-green-500' :
                                    sub.status === 'PARTIAL' ? 'bg-amber-500' :
                                    sub.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'
                                  }`} />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[400px]">
                                      {sub.sitemapUrl}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(sub.createdAt), 'dd/MM/yyyy HH:mm')}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {sub.urlCount} URLs
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  sub.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                  sub.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                                  sub.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {sub.status === 'SUCCESS' ? 'Sucesso' :
                                   sub.status === 'PARTIAL' ? 'Parcial' :
                                   sub.status === 'FAILED' ? 'Falhou' : sub.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
                        <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma submissão registrada ainda.</p>
                        <p className="text-xs mt-1">Use a aba &quot;Sitemaps&quot; para submeter URLs ao Bing.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
