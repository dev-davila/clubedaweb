"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  BarChart3,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

interface ServiceStatus {
  google: {
    configured: boolean;
    authenticated: boolean;
  };
  bing: {
    configured: boolean;
  };
}

export default function SEODashboardPage() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const [googleRes, bingRes] = await Promise.all([
        fetch("/api/gestor/seo/google/status"),
        fetch("/api/gestor/seo/bing/status"),
      ]);

      const google = await googleRes.json();
      const bing = await bingRes.json();

      setStatus({
        google: {
          configured: google.configured || false,
          authenticated: google.authenticated || false,
        },
        bing: {
          configured: bing.configured || false,
        },
      });
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/gestor"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-7 w-7 text-blue-600" />
            Módulo SEO
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas integrações com mecanismos de busca
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Search Console */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Google Search Console</h2>
                    <p className="text-sm text-gray-500">Monitoramento e indexação</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  ok={status?.google.configured || false}
                  label={status?.google.configured ? "Configurado" : "Não configurado"}
                />
                <StatusBadge
                  ok={status?.google.authenticated || false}
                  label={status?.google.authenticated ? "Autenticado" : "Não autenticado"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4" />
                  Propriedades verificadas
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  Sitemaps
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                  Dados de performance
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Send className="w-4 h-4" />
                  Submissão de URLs
                </div>
              </div>

              <Link
                href="/gestor/seo/google"
                className="block w-full py-2.5 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Gerenciar Google Search Console
              </Link>
            </div>
          </div>

          {/* Bing Webmaster */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path
                        fill="#008373"
                        d="M5 3v18l4-1.5V6.5l6 2.25V20l4 1.5V8L5 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Bing Webmaster</h2>
                    <p className="text-sm text-gray-500">Bing + IndexNow</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  ok={status?.bing.configured || false}
                  label={status?.bing.configured ? "API Key configurada" : "Não configurado"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4" />
                  Sites cadastrados
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  Sitemaps
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Send className="w-4 h-4" />
                  IndexNow (URLs)
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                  Estatísticas de crawl
                </div>
              </div>

              <Link
                href="/gestor/seo/bing"
                className="block w-full py-2.5 px-4 bg-teal-600 text-white text-center rounded-lg hover:bg-teal-700 transition font-medium"
              >
                Gerenciar Bing Webmaster
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/gestor/seo/google?tab=sitemaps"
            className="p-4 bg-white border rounded-lg hover:border-blue-500 hover:shadow-sm transition"
          >
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Submeter Sitemap</h4>
            <p className="text-sm text-gray-500">Google e Bing</p>
          </Link>

          <Link
            href="/gestor/seo/bing?tab=indexnow"
            className="p-4 bg-white border rounded-lg hover:border-teal-500 hover:shadow-sm transition"
          >
            <Send className="w-6 h-6 text-teal-600 mb-2" />
            <h4 className="font-medium text-gray-900">IndexNow</h4>
            <p className="text-sm text-gray-500">Enviar URLs para indexação</p>
          </Link>

          <Link
            href="/gestor/seo/google?tab=performance"
            className="p-4 bg-white border rounded-lg hover:border-purple-500 hover:shadow-sm transition"
          >
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Performance</h4>
            <p className="text-sm text-gray-500">Dados do Google Search</p>
          </Link>

          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white border rounded-lg hover:border-gray-400 hover:shadow-sm transition"
          >
            <ExternalLink className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-900">Abrir Console</h4>
            <p className="text-sm text-gray-500">Google Search Console</p>
          </a>
        </div>
      </div>
    </div>
  );
}
