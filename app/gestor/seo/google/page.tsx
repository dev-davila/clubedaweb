"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  FileText,
  BarChart3,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  TrendingUp,
  MousePointer,
  Eye,
  ExternalLink,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface Property {
  siteUrl: string;
  permissionLevel: string;
}

interface Sitemap {
  path: string;
  lastSubmitted: string;
  isPending: boolean;
  isSitemapsIndex: boolean;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
}

interface PerformanceData {
  rows?: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  responseAggregationType?: string;
}

export default function GoogleSearchConsolePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "properties";
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ configured: false, authenticated: false });
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [sitemaps, setSitemaps] = useState<Sitemap[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [submittingSitemap, setSubmittingSitemap] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 28), "yyyy-MM-dd"),
    endDate: format(subDays(new Date(), 1), "yyyy-MM-dd"),
  });
  const [dimension, setDimension] = useState("query");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [sitemapMessage, setSitemapMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (selectedProperty && activeTab === "sitemaps") {
      fetchSitemaps();
    } else if (selectedProperty && activeTab === "performance") {
      fetchPerformance();
    }
  }, [selectedProperty, activeTab]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/gestor/seo/google/status");
      const data = await res.json();
      setStatus(data);

      if (data.authenticated) {
        await fetchProperties();
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/gestor/seo/google/properties");
      const data = await res.json();
      setProperties(data.properties || []);
      
      // Try to load saved default property
      const defaultProp = data.defaultProperty;
      const props = data.properties || [];
      
      if (defaultProp && props.find((p: Property) => p.siteUrl === defaultProp)) {
        setSelectedProperty(defaultProp);
      } else if (props.length > 0) {
        // Auto-select the property matching the site domain
        const matching = props.find((p: Property) => 
          p.siteUrl.includes("m3solutions.com.br") || p.siteUrl.includes("m3solutions")
        );
        setSelectedProperty(matching ? matching.siteUrl : props[0].siteUrl);
      }
    } catch (error) {
      console.error("Erro ao buscar propriedades:", error);
    }
  };

  const fetchSitemaps = async () => {
    if (!selectedProperty) return;
    setLoadingSitemaps(true);
    try {
      const res = await fetch(
        `/api/gestor/seo/google/sitemaps?siteUrl=${encodeURIComponent(selectedProperty)}`
      );
      const data = await res.json();
      setSitemaps(data.sitemaps || []);
    } catch (error) {
      console.error("Erro ao buscar sitemaps:", error);
    } finally {
      setLoadingSitemaps(false);
    }
  };

  const fetchPerformance = async () => {
    if (!selectedProperty) return;
    setLoadingPerformance(true);
    try {
      const res = await fetch("/api/gestor/seo/google/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: selectedProperty,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dimensions: [dimension],
          rowLimit: 25,
        }),
      });
      const data = await res.json();
      setPerformanceData(data);
    } catch (error) {
      console.error("Erro ao buscar performance:", error);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/gestor/seo/google/auth");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      alert("Erro ao iniciar conexão");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar do Google Search Console?")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/gestor/seo/google/status", { method: "DELETE" });
      setStatus({ configured: true, authenticated: false });
      setProperties([]);
      setSelectedProperty("");
    } catch (error) {
      console.error("Erro ao desconectar:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveDefaultProperty = async () => {
    if (!selectedProperty) return;
    setSavingDefault(true);
    try {
      await fetch("/api/gestor/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo_google_default_property: selectedProperty }),
      });
      setSitemapMessage({ type: 'success', text: 'Propriedade padrão salva com sucesso!' });
      setTimeout(() => setSitemapMessage(null), 3000);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setSavingDefault(false);
    }
  };

  const getSitemapUrlFromProperty = (prop: string): string => {
    // For domain properties like sc-domain:example.com, build URL
    if (prop.startsWith("sc-domain:")) {
      const domain = prop.replace("sc-domain:", "");
      return `https://${domain}/sitemap.xml`;
    }
    // For URL-prefix properties, append /sitemap.xml
    try {
      const url = new URL(prop);
      return `${url.origin}/sitemap.xml`;
    } catch {
      return `${prop}/sitemap.xml`;
    }
  };

  const handleSubmitSitemap = async () => {
    if (!selectedProperty || !newSitemapUrl) return;
    setSubmittingSitemap(true);
    setSitemapMessage(null);
    try {
      const res = await fetch("/api/gestor/seo/google/sitemaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: selectedProperty,
          sitemapUrl: newSitemapUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewSitemapUrl("");
        setSitemapMessage({ type: 'success', text: 'Sitemap submetido com sucesso!' });
        fetchSitemaps();
      } else {
        setSitemapMessage({ type: 'error', text: data.error || "Erro ao submeter sitemap" });
      }
    } catch (error: any) {
      setSitemapMessage({ type: 'error', text: error.message || "Erro ao submeter sitemap" });
    } finally {
      setSubmittingSitemap(false);
      setTimeout(() => setSitemapMessage(null), 8000);
    }
  };

  const handleDeleteSitemap = async (sitemapUrl: string) => {
    if (!confirm("Remover este sitemap?")) return;
    try {
      const res = await fetch(
        `/api/gestor/seo/google/sitemaps?siteUrl=${encodeURIComponent(
          selectedProperty
        )}&sitemapUrl=${encodeURIComponent(sitemapUrl)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchSitemaps();
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/gestor/seo"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Search Console</h1>
            <p className="text-gray-500">Gerenciamento de propriedades e sitemaps</p>
          </div>
        </div>
        {status.authenticated && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
          >
            {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Desconectar
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Conectado com sucesso ao Google Search Console!</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">Erro na conexão: {error}</span>
        </div>
      )}

      {/* Not Connected State */}
      {!status.authenticated ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Conectar ao Google Search Console</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Conecte sua conta do Google para acessar dados de performance, gerenciar sitemaps e mais.
          </p>
          {!status.configured ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-amber-800 text-sm">
                Credenciais OAuth do Google não configuradas. Configure o Client ID e Client Secret.
              </p>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              {connecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                </svg>
              )}
              Conectar com Google
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Property Selector */}
          <div className="bg-white rounded-lg border p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propriedade
            </label>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full md:w-auto min-w-[300px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {properties.map((prop) => (
                  <option key={prop.siteUrl} value={prop.siteUrl}>
                    {prop.siteUrl} ({prop.permissionLevel})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveDefaultProperty}
                disabled={savingDefault || !selectedProperty}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm whitespace-nowrap"
              >
                {savingDefault ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Definir como Padrão
              </button>
            </div>
            {/* Permission warning */}
            {selectedProperty && properties.find(p => p.siteUrl === selectedProperty)?.permissionLevel === 'siteUnverifiedUser' && (
              <div className="mt-3 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Permissão insuficiente</strong> para esta propriedade ({`"`}siteUnverifiedUser{`"`}). 
                  Você precisa verificar a propriedade do site no{' '}
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    Google Search Console
                  </a>{' '}
                  para poder submeter sitemaps e acessar dados de performance. 
                  Siga as instruções de verificação do Google (DNS, meta tag ou arquivo HTML).
                </div>
              </div>
            )}
            {sitemapMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                sitemapMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {sitemapMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {sitemapMessage.text}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex gap-1">
              {[
                { id: "properties", label: "Propriedades", icon: Globe },
                { id: "sitemaps", label: "Sitemaps", icon: FileText },
                { id: "performance", label: "Performance", icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
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
          {activeTab === "properties" && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Propriedades Verificadas</h3>
              </div>
              <div className="divide-y">
                {properties.map((prop) => (
                  <div
                    key={prop.siteUrl}
                    className="p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium">{prop.siteUrl}</div>
                        <div className="text-sm text-gray-500">{prop.permissionLevel}</div>
                      </div>
                    </div>
                    <a
                      href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(
                        prop.siteUrl
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                    >
                      Abrir no Console
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "sitemaps" && (
            <div className="space-y-6">
              {/* Sitemap submission messages */}
              {sitemapMessage && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  sitemapMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {sitemapMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className={`text-sm ${sitemapMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {sitemapMessage.text}
                  </div>
                </div>
              )}

              {/* Add Sitemap */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Submeter Novo Sitemap</h3>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newSitemapUrl}
                    onChange={(e) => setNewSitemapUrl(e.target.value)}
                    placeholder={getSitemapUrlFromProperty(selectedProperty)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setNewSitemapUrl(getSitemapUrlFromProperty(selectedProperty))}
                    className="px-3 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm whitespace-nowrap"
                    title="Preencher automaticamente"
                  >
                    Auto
                  </button>
                  <button
                    onClick={handleSubmitSitemap}
                    disabled={submittingSitemap || !newSitemapUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingSitemap ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Submeter
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  A URL do sitemap deve pertencer à propriedade selecionada ({selectedProperty}).
                  {selectedProperty.startsWith("sc-domain:") && (
                    <span className="block mt-1 text-amber-600">
                      ⚠ Propriedade de domínio detectada. Certifique-se de que o sitemap está acessível no subdomínio correto.
                    </span>
                  )}
                </p>
              </div>

              {/* Sitemaps List */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Sitemaps Cadastrados</h3>
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
                    Nenhum sitemap cadastrado
                  </div>
                ) : (
                  <div className="divide-y">
                    {sitemaps.map((sitemap) => (
                      <div
                        key={sitemap.path}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-sm">{sitemap.path}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Submetido: {new Date(sitemap.lastSubmitted).toLocaleDateString("pt-BR")}
                            {sitemap.warnings ? ` • ${sitemap.warnings} avisos` : ""}
                            {sitemap.errors ? ` • ${sitemap.errors} erros` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSitemap(sitemap.path)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg border p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensão
                    </label>
                    <select
                      value={dimension}
                      onChange={(e) => setDimension(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="query">Consultas</option>
                      <option value="page">Páginas</option>
                      <option value="country">Países</option>
                      <option value="device">Dispositivos</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchPerformance}
                      disabled={loadingPerformance}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      {loadingPerformance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Dados de Performance</h3>
                </div>
                {loadingPerformance ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : !performanceData?.rows?.length ? (
                  <div className="p-8 text-center text-gray-500">
                    Nenhum dado disponível para o período selecionado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                            {dimension === "query" ? "Consulta" : dimension === "page" ? "Página" : dimension}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            <div className="flex items-center justify-end gap-1">
                              <MousePointer className="w-4 h-4" />
                              Cliques
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            <div className="flex items-center justify-end gap-1">
                              <Eye className="w-4 h-4" />
                              Impressões
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            CTR
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Posição
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {performanceData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <span className="truncate block max-w-xs" title={row.keys[0]}>
                                {row.keys[0]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {row.clicks.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {row.impressions.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {(row.ctr * 100).toFixed(2)}%
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {row.position.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
