"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { WizardData } from "../types";

interface Property {
  siteUrl: string;
  permissionLevel: string;
}

interface Props {
  data: WizardData["google"];
  onChange: (key: keyof WizardData["google"], value: string) => void;
  onBeforeOAuth?: () => void;
  oauthReturn?: { success: boolean; error?: string };
}

export function StepGoogle({ data, onChange, onBeforeOAuth, oauthReturn }: Props) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ configured: false, authenticated: false });
  const [properties, setProperties] = useState<Property[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (oauthReturn?.success) {
      setFeedback({ type: "success", text: "Conectado ao Google Search Console!" });
      setTimeout(() => setFeedback(null), 4000);
    } else if (oauthReturn?.error) {
      setFeedback({ type: "error", text: `Erro: ${oauthReturn.error}` });
    }
  }, [oauthReturn]);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/seo/google/status");
      const s = await res.json();
      setStatus(s);
      if (s.authenticated) {
        await fetchProperties();
      }
    } catch {
      setFeedback({ type: "error", text: "Falha ao verificar status" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchProperties() {
    try {
      const res = await fetch("/api/gestor/seo/google/properties");
      const d = await res.json();
      const props: Property[] = d.properties || [];
      setProperties(props);
      if (!data.property) {
        if (d.defaultProperty && props.find((p) => p.siteUrl === d.defaultProperty)) {
          onChange("property", d.defaultProperty);
        } else if (props.length > 0) {
          onChange("property", props[0].siteUrl);
        }
      }
    } catch {
      // silencioso
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      onBeforeOAuth?.();
      const res = await fetch(
        `/api/gestor/seo/google/auth?redirect_to=${encodeURIComponent("/gestor/wizard")}`
      );
      const d = await res.json();
      if (d.authUrl) {
        window.location.href = d.authUrl;
      } else {
        setFeedback({ type: "error", text: d.error || "Não foi possível iniciar a autenticação" });
        setConnecting(false);
      }
    } catch (e: any) {
      setFeedback({ type: "error", text: e.message || "Erro ao conectar" });
      setConnecting(false);
    }
  }

  async function handleSaveDefault() {
    if (!data.property) return;
    setSavingDefault(true);
    try {
      const res = await fetch("/api/gestor/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo_google_default_property: data.property }),
      });
      if (res.ok) {
        setFeedback({ type: "success", text: "Propriedade salva como padrão!" });
      } else {
        setFeedback({ type: "error", text: "Falha ao salvar propriedade" });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao salvar" });
    } finally {
      setSavingDefault(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4">
          <Sparkles size={11} />
          Google Search Console
        </span>
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
          Conecte o Google
          <br />
          <span className="text-gray-400">pra indexar seu site</span>
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Permite enviar sitemaps, acompanhar performance de buscas e validar a propriedade. Você pode pular e configurar depois em SEO &gt; Google.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-5 p-3.5 rounded-2xl border text-sm flex items-start gap-2 ${
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-200 p-7">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !status.configured ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-heading font-bold text-gray-900 mb-1.5">
              Credenciais OAuth não configuradas
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              É preciso configurar o Client ID e o Client Secret do Google antes de conectar. Acesse <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">Configurações &gt; SEO</span> e tente novamente.
            </p>
          </div>
        ) : !status.authenticated ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <Globe className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-heading font-bold text-gray-900 mb-1.5">
              Conectar conta Google
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-5">
              Você será redirecionado para o Google autorizar acesso ao Search Console. O wizard retorna automaticamente após a autenticação.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {connecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Redirecionando…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                  Conectar com Google
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-2xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-green-900">Conta conectada</div>
                <div className="text-green-700 text-xs">Token ativo para Search Console</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Propriedade padrão
              </label>
              {properties.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500 flex items-center gap-2">
                  <Search size={14} />
                  Nenhuma propriedade verificada na conta. Verifique uma no Search Console e volte aqui.
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-2">
                    <select
                      value={data.property}
                      onChange={(e) => onChange("property", e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                    >
                      {properties.map((p) => (
                        <option key={p.siteUrl} value={p.siteUrl}>
                          {p.siteUrl} ({p.permissionLevel})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveDefault}
                      disabled={savingDefault || !data.property}
                      className="inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 whitespace-nowrap"
                    >
                      {savingDefault ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Salvar padrão
                    </button>
                  </div>
                  {data.property && properties.find((p) => p.siteUrl === data.property)?.permissionLevel === "siteUnverifiedUser" && (
                    <div className="mt-3 p-3 rounded-xl text-xs bg-red-50 text-red-700 border border-red-200 flex items-start gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Permissão insuficiente.</strong> Verifique a propriedade no{" "}
                        <a
                          href="https://search.google.com/search-console"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          Search Console
                        </a>{" "}
                        para acessar sitemaps e performance.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <a
              href="/gestor/seo/google"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition"
            >
              Configurações avançadas
              <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
