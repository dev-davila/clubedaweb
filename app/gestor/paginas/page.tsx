"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Globe,
  Loader2,
  CheckCircle,
  Clock,
  Archive,
  ExternalLink,
  FileText
} from "lucide-react";

interface DynamicPage {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pageType: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: "Rascunho", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  PUBLISHED: { label: "Publicado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  ARCHIVED: { label: "Arquivado", color: "bg-gray-100 text-gray-600", icon: Archive }
};

const PAGE_TYPES: Record<string, string> = {
  institutional: "Institucional",
  service: "Serviço",
  product: "Produto",
  legal: "Legal",
  landing: "Landing Page",
  blog: "Blog",
  other: "Outro"
};

export default function PaginasPage() {
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      setLoading(true);
      const res = await fetch("/api/gestor/dynamic-pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (err) {
      console.error("Erro ao carregar páginas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/gestor/dynamic-pages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Páginas Dinâmicas</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie páginas do site sem precisar de código</p>
        </div>
        <Link
          href="/gestor/paginas/nova"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Nova Página
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Todos os status</option>
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">
            {searchTerm || statusFilter !== "all" ? "Nenhuma página encontrada" : "Nenhuma página criada"}
          </h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || statusFilter !== "all"
              ? "Tente ajustar os filtros de busca"
              : "Crie sua primeira página dinâmica"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Link
              href="/gestor/paginas/nova"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Criar Página
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Atualizado</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((page) => {
                  const statusCfg = STATUS_CONFIG[page.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={page.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{page.title}</p>
                          <p className="text-sm text-gray-400">/p/{page.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {PAGE_TYPES[page.pageType] || page.pageType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon size={12} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(page.updatedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {page.status === "PUBLISHED" && (
                            <a
                              href={`/p/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Ver no site"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <Link
                            href={`/gestor/paginas/${page.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => deletePage(page.id)}
                            disabled={deleting === page.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Excluir"
                          >
                            {deleting === page.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
