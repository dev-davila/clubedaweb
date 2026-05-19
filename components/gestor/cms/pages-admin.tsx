"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Layout,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dynamicPagePublicPath } from "@/lib/cms/page-url";

interface DynamicPageRow {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pageType: string;
  excerpt: string | null;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  children?: { id: string; title: string; slug: string }[];
}

type StatusTab = "all" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const PAGE_TYPES: Record<string, string> = {
  institutional: "Institucional",
  service: "Serviço",
  product: "Produto",
  legal: "Legal",
  landing: "Landing",
  blog: "Blog",
  other: "Outro",
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-amber-100 text-amber-800" },
  PUBLISHED: { label: "Publicado", className: "bg-green-100 text-green-800" },
  ARCHIVED: { label: "Arquivado", className: "bg-gray-100 text-gray-600" },
};

export function PagesAdmin() {
  const [pages, setPages] = useState<DynamicPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/dynamic-pages");
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const counts = useMemo(() => {
    const c = { all: pages.length, PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 };
    for (const p of pages) c[p.status]++;
    return c;
  }, [pages]);

  const filtered = useMemo(() => {
    return pages
      .filter((p) => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
        const matchStatus = statusTab === "all" || p.status === statusTab;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }, [pages, searchTerm, statusTab]);

  const byId = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);

  async function deletePage(id: string) {
    if (!confirm("Mover para lixeira? A página será excluída permanentemente.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/gestor/dynamic-pages/${id}`, { method: "DELETE" });
      if (res.ok) setPages((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function setStatus(id: string, status: DynamicPageRow["status"]) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/gestor/dynamic-pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      }
    } finally {
      setUpdating(null);
    }
  }

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "all", label: `Todas (${counts.all})` },
    { key: "PUBLISHED", label: `Publicadas (${counts.PUBLISHED})` },
    { key: "DRAFT", label: `Rascunhos (${counts.DRAFT})` },
    { key: "ARCHIVED", label: `Arquivadas (${counts.ARCHIVED})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Páginas</h1>
          <p className="text-gray-500 mt-1">Gerencie o conteúdo do site como no WordPress.</p>
        </div>
        <Button asChild>
          <Link href="/gestor/paginas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar nova
          </Link>
        </Button>
      </div>

      <ul className="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <button
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                statusTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar páginas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Nenhuma página encontrada</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/gestor/paginas/nova">Criar primeira página</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">URL</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Data</th>
                <th className="px-4 py-3 font-medium w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((page) => {
                const parent = page.parentId ? byId.get(page.parentId) : null;
                const st = STATUS_LABEL[page.status];
                const publicPath = dynamicPagePublicPath(page.slug);
                return (
                  <tr key={page.id} className="hover:bg-gray-50/80 group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {parent && (
                          <span className="text-xs text-gray-400">↳ subpágina de {parent.title}</span>
                        )}
                        <Link
                          href={`/gestor/paginas/${page.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {page.title || "(sem título)"}
                        </Link>
                        <span className="text-xs text-gray-400 md:hidden font-mono">{publicPath}</span>
                        <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition lg:hidden">
                          <Link href={`/gestor/paginas/${page.id}`} className="text-xs text-blue-600">
                            Editar
                          </Link>
                          {page.status === "PUBLISHED" && (
                            <a href={publicPath} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">
                              Ver
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{publicPath}</code>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {PAGE_TYPES[page.pageType] || page.pageType}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={page.status}
                        disabled={updating === page.id}
                        onChange={(e) => setStatus(page.id, e.target.value as DynamicPageRow["status"])}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${st.className}`}
                      >
                        <option value="DRAFT">Rascunho</option>
                        <option value="PUBLISHED">Publicado</option>
                        <option value="ARCHIVED">Arquivado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 whitespace-nowrap">
                      {new Date(page.updatedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/gestor/paginas/${page.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/gestor/editor/${page.id}`}>
                              <Layout className="mr-2 h-4 w-4" />
                              Editor visual
                            </Link>
                          </DropdownMenuItem>
                          {page.status === "PUBLISHED" && (
                            <DropdownMenuItem asChild>
                              <a href={publicPath} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver no site
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {page.status !== "PUBLISHED" && (
                            <DropdownMenuItem onClick={() => setStatus(page.id, "PUBLISHED")}>
                              Publicar
                            </DropdownMenuItem>
                          )}
                          {page.status !== "DRAFT" && (
                            <DropdownMenuItem onClick={() => setStatus(page.id, "DRAFT")}>
                              Mover para rascunho
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deletePage(page.id)}
                            disabled={deleting === page.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
