"use client";

import { useState, useEffect } from "react";
import { SITE_BASE_URL } from "@/lib/constants";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Key, Globe, Code, Copy, Check } from "lucide-react";

export default function SEOConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Google Search Console
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  // Bing Webmaster
  const [bingApiKey, setBingApiKey] = useState("");
  const [showBingKey, setShowBingKey] = useState(false);
  const [bingConfigured, setBingConfigured] = useState(false);

  // Meta Tags de Verificação
  const [bingMetaTag, setBingMetaTag] = useState("");
  const [googleMetaTag, setGoogleMetaTag] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/gestor/seo/config");
      if (res.ok) {
        const data = await res.json();
        setGoogleClientId(data.googleClientId || "");
        setGoogleClientSecret(data.googleClientSecret || "");
        setGoogleConfigured(data.googleConfigured);
        setBingApiKey(data.bingApiKey || "");
        setBingConfigured(data.bingConfigured);
        setBingMetaTag(data.bingMetaTag || "");
        setGoogleMetaTag(data.googleMetaTag || "");
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/gestor/seo/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleClientId,
          googleClientSecret,
          bingApiKey,
          bingMetaTag,
          googleMetaTag,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Configurações salvas com sucesso!" });
        loadConfig();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Erro ao salvar configurações" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao salvar configurações" });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const extractMetaContent = (input: string): string => {
    // Se já é só o content, retorna direto
    if (!input.includes("<meta")) return input.trim();
    // Extrai o content da meta tag
    const match = input.match(/content=["']([^"']+)["']/i);
    return match ? match[1] : input.trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/gestor/seo"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Configurações SEO</h1>
            <p className="text-gray-600">Gerencie as credenciais de integração</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Google Search Console */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Google Search Console</h2>
            <p className="text-sm text-gray-500">OAuth 2.0 - Aplicativo da Web</p>
          </div>
          {googleConfigured && (
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Configurado
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="Ex: 123456789-abc123.apps.googleusercontent.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showGoogleSecret ? "text" : "password"}
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                placeholder="Ex: GOCSPX-abc123..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showGoogleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Como obter as credenciais:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Clique em "+ Criar credenciais" → "ID do cliente OAuth"</li>
              <li>Selecione "Aplicativo da Web" como tipo</li>
              <li>Em &quot;URIs de redirecionamento autorizados&quot;, adicione:<br/>
                <code className="bg-blue-100 px-2 py-0.5 rounded text-xs break-all">{`${SITE_BASE_URL}/api/gestor/seo/google/callback`}</code>
              </li>
              <li>Copie o Client ID e Client Secret gerados</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Bing Webmaster */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Bing Webmaster Tools</h2>
            <p className="text-sm text-gray-500">API Key para IndexNow e Sitemaps</p>
          </div>
          {bingConfigured && (
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Configurado
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showBingKey ? "text" : "password"}
                value={bingApiKey}
                onChange={(e) => setBingApiKey(e.target.value)}
                placeholder="Ex: abc123def456..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowBingKey(!showBingKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showBingKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h4 className="font-medium text-teal-800 mb-2">Como obter a API Key:</h4>
            <ol className="text-sm text-teal-700 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://www.bing.com/webmasters/apikey" target="_blank" rel="noopener noreferrer" className="underline">Bing Webmaster Tools</a></li>
              <li>Faça login com sua conta Microsoft</li>
              <li>Vá em Configurações → API access</li>
              <li>Gere ou copie sua API Key</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Meta Tags de Verificação */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Meta Tags de Verificação</h2>
            <p className="text-sm text-gray-500">Tags HTML para verificar propriedade do site</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Bing Meta Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bing Webmaster - Meta Tag
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Cole a meta tag completa ou apenas o valor do content
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={bingMetaTag}
                onChange={(e) => setBingMetaTag(extractMetaContent(e.target.value))}
                placeholder="Ex: ABCD1234567890 ou <meta name=&quot;msvalidate.01&quot; content=&quot;ABCD...&quot; />"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              {bingMetaTag && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(`<meta name="msvalidate.01" content="${bingMetaTag}" />`, "bing")}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 text-sm"
                >
                  {copied === "bing" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            {bingMetaTag && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Tag gerada (já ativa no site):</p>
                <code className="text-xs text-purple-700 break-all">
                  {`<meta name="msvalidate.01" content="${bingMetaTag}" />`}
                </code>
              </div>
            )}
          </div>

          {/* Google Meta Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Search Console - Meta Tag
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Cole a meta tag completa ou apenas o valor do content
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={googleMetaTag}
                onChange={(e) => setGoogleMetaTag(extractMetaContent(e.target.value))}
                placeholder="Ex: abc123xyz ou <meta name=&quot;google-site-verification&quot; content=&quot;abc...&quot; />"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              {googleMetaTag && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(`<meta name="google-site-verification" content="${googleMetaTag}" />`, "google")}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 text-sm"
                >
                  {copied === "google" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            {googleMetaTag && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Tag gerada (já ativa no site):</p>
                <code className="text-xs text-purple-700 break-all">
                  {`<meta name="google-site-verification" content="${googleMetaTag}" />`}
                </code>
              </div>
            )}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2">Como funciona:</h4>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li>No Bing Webmaster ou Google Search Console, escolha "HTML Meta Tag" como método de verificação</li>
              <li>Copie a meta tag fornecida e cole no campo acima</li>
              <li>Clique em "Salvar" - a tag será adicionada automaticamente ao site</li>
              <li>Volte ao Bing/Google e clique em "Verificar"</li>
            </ol>
            <p className="text-sm text-purple-600 mt-3 font-medium">
              ⚠️ Após salvar, aguarde o deploy do site (alguns minutos) antes de verificar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
