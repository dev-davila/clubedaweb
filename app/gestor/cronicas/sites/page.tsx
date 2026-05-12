"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Globe, Plus, Pencil, Trash2, Loader2, Check, X, Clock, RefreshCw } from "lucide-react";

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleString("pt-BR");
  } catch {
    return "";
  }
}

interface Site {
  id: string;
  name: string;
  url: string;
  feedUrl: string | null;
  selector: string | null;
  active: boolean;
  checkInterval: number;
  lastCheckedAt: string | null;
  _count: { articles: number };
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/cronicas/sites");
      const data = await res.json();
      setSites(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este site? Todas as matérias coletadas serão removidas.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/cronicas/sites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      fetchSites();
    } catch (error) {
      alert("Erro ao excluir site");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (site: Site) => {
    try {
      await fetch(`/api/cronicas/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...site, active: !site.active })
      });
      fetchSites();
    } catch (error) {
      alert("Erro ao atualizar site");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites Monitorados</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os sites de notícias que serão monitorados
          </p>
        </div>
        <Link
          href="/gestor/cronicas/sites/novo"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus size={18} />
          Novo Site
        </Link>
      </div>

      {/* Sites List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {sites.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum site cadastrado</p>
            <Link
              href="/gestor/cronicas/sites/novo"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Cadastrar primeiro site
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sites.map((site) => (
              <div key={site.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${site.active ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                      <Globe className={site.active ? 'text-blue-600' : 'text-gray-400'} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{site.name}</h3>
                        {site.active ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Ativo</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Inativo</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{site.url}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          A cada {site.checkInterval}h
                        </span>
                        <span>{site._count.articles} matérias</span>
                        {mounted && site.lastCheckedAt && (
                          <span className="flex items-center gap-1">
                            <RefreshCw size={12} />
                            Última: {formatDate(site.lastCheckedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(site)}
                      className={`p-2 rounded-lg transition ${site.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={site.active ? "Desativar" : "Ativar"}
                    >
                      {site.active ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <Link
                      href={`/gestor/cronicas/sites/${site.id}/editar`}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(site.id)}
                      disabled={deleting === site.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      {deleting === site.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
