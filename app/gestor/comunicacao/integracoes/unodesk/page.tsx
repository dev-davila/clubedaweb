"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Ticket, Loader2, CheckCircle, XCircle, Search, Building2,
  Phone, Mail, User, AlertTriangle, ExternalLink, RefreshCw, FileText,
  Settings, Eye, EyeOff, Save, ChevronDown, ChevronUp,
} from "lucide-react";

interface UnodeskStatus {
  configured: boolean;
  baseUrl: string;
  hasSignature: boolean;
  hasToken: boolean;
}

// CNPJ mask: 12.345.678/0001-99
function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

// Phone mask: (11) 94249-0999
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function UnodeskPage() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === "admin";
  const [status, setStatus] = useState<UnodeskStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchType, setSearchType] = useState<"cnpj" | "telefone" | "email">("telefone");
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  // Chamados
  const [chamados, setChamados] = useState<any[] | null>(null);
  const [loadingChamados, setLoadingChamados] = useState(false);
  const [selectedPessoa, setSelectedPessoa] = useState<any | null>(null);

  // Config section
  const [showConfig, setShowConfig] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState("");
  const [cfgBaseUrl, setCfgBaseUrl] = useState("");
  const [cfgSignature, setCfgSignature] = useState("");
  const [cfgToken, setCfgToken] = useState("");
  const [showSignature, setShowSignature] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (session?.user) checkStatus();
  }, [session]);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/integracoes/unodesk?action=status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, baseUrl: "", hasSignature: false, hasToken: false });
    } finally {
      setLoading(false);
    }
  }

  async function loadConfig() {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/integracoes/unodesk?action=config");
      const data = await res.json();
      setCfgBaseUrl(data.baseUrl || "");
      setCfgSignature(data.signature || "");
      setCfgToken(data.token || "");
    } catch {}
    setConfigLoading(false);
  }

  async function saveConfig() {
    setConfigSaving(true);
    setConfigMsg("");
    try {
      const res = await fetch("/api/gestor/comunicacao/integracoes/unodesk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: cfgBaseUrl, signature: cfgSignature, token: cfgToken }),
      });
      if (!res.ok) throw new Error();
      setConfigMsg("Configuração salva com sucesso!");
      checkStatus();
      setTimeout(() => setConfigMsg(""), 4000);
    } catch {
      setConfigMsg("Erro ao salvar configuração.");
    } finally {
      setConfigSaving(false);
    }
  }

  function handleSearchInput(val: string) {
    if (searchType === "cnpj") {
      setSearchValue(maskCnpj(val));
    } else if (searchType === "telefone") {
      setSearchValue(maskPhone(val));
    } else {
      setSearchValue(val);
    }
  }

  async function handleSearch() {
    if (!searchValue.trim()) return;
    setSearching(true);
    setError("");
    setResults(null);
    setChamados(null);
    setSelectedPessoa(null);

    try {
      let url = "/api/gestor/comunicacao/integracoes/unodesk?";
      if (searchType === "cnpj") {
        url += `action=empresa&cnpj=${encodeURIComponent(searchValue)}`;
      } else if (searchType === "telefone") {
        url += `action=pessoa-telefone&telefone=${encodeURIComponent(searchValue)}`;
      } else {
        url += `action=pessoa-email&email=${encodeURIComponent(searchValue)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na busca");

      const list = data.empresas || data.pessoas || [];
      setResults(list);
      if (list.length === 0) setError("Nenhum resultado encontrado.");
    } catch (err: any) {
      setError(err.message || "Erro ao buscar");
    } finally {
      setSearching(false);
    }
  }

  async function loadChamados(pessoaId: number, pessoa: any) {
    setSelectedPessoa(pessoa);
    setLoadingChamados(true);
    setChamados(null);
    try {
      const res = await fetch(`/api/gestor/comunicacao/integracoes/unodesk?action=chamados&pessoa_id=${pessoaId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChamados(data.chamados || []);
    } catch (err: any) {
      setChamados([]);
    } finally {
      setLoadingChamados(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Unodesk — ServiceDesk</h1>
            <p className="text-xs text-gray-400">Integração com o sistema de chamados</p>
          </div>
        </div>
        <button onClick={checkStatus} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Status da Conexão</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Base URL</span>
            </div>
            <p className="text-sm text-white font-mono break-all">{status?.baseUrl || "Não configurada"}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <span className="text-xs font-medium">X-Signature</span>
            </div>
            <p className="text-sm">
              {status?.hasSignature
                ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Configurada</span>
                : <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Ausente</span>}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <span className="text-xs font-medium">Bearer Token</span>
            </div>
            <p className="text-sm">
              {status?.hasToken
                ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Configurado</span>
                : <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Ausente</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Config Section (admin only) */}
      {isAdmin && (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <button
            onClick={() => {
              const next = !showConfig;
              setShowConfig(next);
              if (next) loadConfig();
            }}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Configuração de Credenciais</h2>
            </div>
            {showConfig ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showConfig && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-700 pt-4">
              {configLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Base URL</label>
                    <input
                      type="text"
                      value={cfgBaseUrl}
                      onChange={(e) => setCfgBaseUrl(e.target.value)}
                      placeholder="https://servicedesk.m3solutions.net.br"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">X-Signature (Assinatura da API)</label>
                    <div className="relative">
                      <input
                        type={showSignature ? "text" : "password"}
                        value={cfgSignature}
                        onChange={(e) => setCfgSignature(e.target.value)}
                        placeholder="Assinatura da API"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 pr-10 text-white text-sm font-mono focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignature(!showSignature)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSignature ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Bearer Token</label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={cfgToken}
                        onChange={(e) => setCfgToken(e.target.value)}
                        placeholder="Token de autenticação"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 pr-10 text-white text-sm font-mono focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {configMsg && (
                    <div className={`text-sm px-3 py-2 rounded-lg ${
                      configMsg.includes("sucesso") ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {configMsg.includes("sucesso") ? <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                      {configMsg}
                    </div>
                  )}

                  <button
                    onClick={saveConfig}
                    disabled={configSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                  >
                    {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Configuração
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Section */}
      {status?.configured && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Consulta Rápida</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={searchType}
              onChange={(e) => { setSearchType(e.target.value as any); setSearchValue(""); setResults(null); setChamados(null); setError(""); }}
              className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="telefone">Telefone (Pessoa)</option>
              <option value="email">E-mail (Pessoa)</option>
              <option value="cnpj">CNPJ (Empresa)</option>
            </select>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  searchType === "cnpj" ? "Ex: 12.345.678/0001-99"
                    : searchType === "telefone" ? "Ex: (11) 94249-0999"
                    : "Ex: joao@email.com"
                }
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchValue.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              {error}
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-gray-400">
                {searchType === "cnpj" ? "Empresas encontradas" : "Pessoas encontradas"} ({results.length})
              </h3>
              <div className="grid gap-2">
                {results.map((item: any) => (
                  <div key={item.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        {searchType === "cnpj"
                          ? <Building2 className="w-4 h-4 text-gray-400" />
                          : <User className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{item.nome}</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          <span>ID: {item.id}</span>
                          {item.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{item.email}</span>}
                          {item.numero && <span className="font-mono">{item.numero}</span>}
                          {item.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{item.telefone}</span>}
                        </div>
                      </div>
                    </div>
                    {searchType !== "cnpj" && (
                      <button
                        onClick={() => loadChamados(item.id, item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver Chamados
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chamados */}
          {selectedPessoa && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <h3 className="text-xs font-medium text-gray-400">
                Chamados de {selectedPessoa.nome} (ID: {selectedPessoa.id})
              </h3>
              {loadingChamados ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando chamados...
                </div>
              ) : chamados && chamados.length > 0 ? (
                <div className="grid gap-2">
                  {chamados.map((ch: any) => (
                    <div key={ch.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ticket className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="text-sm text-white">{ch.titulo || `Chamado #${ch.id}`}</p>
                          <span className="text-[11px] text-gray-500">#{ch.id}</span>
                        </div>
                      </div>
                      <a
                        href={`${status.baseUrl}/chamados/view/${ch.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">Nenhum chamado encontrado.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* API Docs Reference */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Endpoints Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { method: "GET", path: "/empresas/index.json?numero={cnpj}", desc: "Buscar empresa por CNPJ" },
            { method: "GET", path: "/pessoas/index.json?telefone={tel}", desc: "Buscar pessoa por telefone" },
            { method: "GET", path: "/pessoas/index.json?email={email}", desc: "Buscar pessoa por e-mail" },
            { method: "GET", path: "/chamados/getPessoaId/{id}.json", desc: "Chamados de uma pessoa" },
            { method: "POST", path: "/pessoas/edit/{id}.json", desc: "Atualizar dados da pessoa" },
            { method: "POST", path: "/webhook", desc: "Criar/encaminhar chamado" },
          ].map((ep, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  ep.method === "GET" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                }`}>{ep.method}</span>
                <span className="font-mono text-gray-400 truncate">{ep.path}</span>
              </div>
              <p className="text-gray-500">{ep.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
