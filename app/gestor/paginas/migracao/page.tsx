"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpFromLine,
  Check,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Building2,
  Scale,
  Package,
  Briefcase,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PageStatus {
  slug: string;
  title: string;
  pageType: string;
  templateType: string;
  description: string;
  priority: number;
  sections: Array<{ key: string; label: string }>;
  migrated: boolean;
  migratedAt?: string;
  cmsStatus?: string;
}

interface MigrationStats {
  total: number;
  migrated: number;
  pending: number;
  byType: {
    institutional: number;
    legal: number;
    product: number;
    service: number;
  };
}

const TYPE_ICONS: Record<string, any> = {
  institutional: Building2,
  legal: Scale,
  product: Package,
  service: Briefcase
};

const TYPE_COLORS: Record<string, string> = {
  institutional: "bg-blue-100 text-blue-700",
  legal: "bg-purple-100 text-purple-700",
  product: "bg-green-100 text-green-700",
  service: "bg-orange-100 text-orange-700"
};

const TYPE_LABELS: Record<string, string> = {
  institutional: "Institucional",
  legal: "Legal",
  product: "Produto",
  service: "Serviço"
};

export default function MigracaoPage() {
  const [pages, setPages] = useState<PageStatus[]>([]);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState<string | null>(null);
  const [migratingAll, setMigratingAll] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/migration");
      const data = await res.json();
      setPages(data.pages || []);
      setStats(data.stats || null);
    } catch (error) {
      toast.error("Erro ao carregar status de migração");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleMigrate = async (slug: string, force = false) => {
    setMigrating(slug);
    try {
      const res = await fetch("/api/gestor/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: force ? "force" : "migrate" })
      });

      if (res.ok) {
        toast.success("Página migrada com sucesso!");
        fetchStatus();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erro ao migrar página");
      }
    } catch (error) {
      toast.error("Erro ao migrar página");
    } finally {
      setMigrating(null);
    }
  };

  const handleMigrateAll = async () => {
    if (!confirm("Deseja migrar todas as páginas pendentes?")) return;
    
    setMigratingAll(true);
    try {
      const res = await fetch("/api/gestor/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "migrate-all" })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.migrated} páginas migradas com sucesso!`);
        fetchStatus();
      } else {
        toast.error("Erro ao migrar páginas");
      }
    } catch (error) {
      toast.error("Erro ao migrar páginas");
    } finally {
      setMigratingAll(false);
    }
  };

  const filteredPages = filter === "all" 
    ? pages 
    : filter === "pending"
      ? pages.filter(p => !p.migrated)
      : filter === "migrated"
        ? pages.filter(p => p.migrated)
        : pages.filter(p => p.pageType === filter);

  const pendingCount = pages.filter(p => !p.migrated).length;
  const migratedCount = pages.filter(p => p.migrated).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/gestor/paginas"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Migração de Páginas</h1>
          </div>
          <p className="text-gray-600">
            Importe páginas estáticas existentes para o CMS
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchStatus} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
          {pendingCount > 0 && (
            <Button onClick={handleMigrateAll} disabled={migratingAll}>
              {migratingAll ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <ArrowUpFromLine size={16} className="mr-2" />
              )}
              Migrar Todas ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Páginas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="text-gray-400" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Migradas</p>
                  <p className="text-2xl font-bold text-green-600">{migratedCount}</p>
                </div>
                <CheckCircle className="text-green-500" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <Clock className="text-orange-500" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Progresso</p>
                  <p className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((migratedCount / stats.total) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 flex items-center justify-center">
                  <div 
                    className="w-8 h-8 rounded-full bg-purple-600"
                    style={{
                      background: `conic-gradient(#7c3aed ${(migratedCount / stats.total) * 360}deg, #e5e7eb 0deg)`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todas ({pages.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          <Clock size={14} className="mr-1" />
          Pendentes ({pendingCount})
        </Button>
        <Button
          variant={filter === "migrated" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("migrated")}
        >
          <Check size={14} className="mr-1" />
          Migradas ({migratedCount})
        </Button>
        <div className="w-px bg-gray-200 mx-2" />
        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const count = pages.filter(p => p.pageType === type).length;
          if (count === 0) return null;
          const Icon = TYPE_ICONS[type];
          return (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type)}
            >
              <Icon size={14} className="mr-1" />
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Pages List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === "pending" ? "Todas as páginas foram migradas!" : "Nenhuma página encontrada"}
            </h3>
            <p className="text-gray-600">
              {filter === "pending" 
                ? "Você pode editar as páginas no CMS." 
                : "Tente outro filtro."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPages.map((page) => {
            const Icon = TYPE_ICONS[page.pageType] || FileText;
            return (
              <Card key={page.slug} className={page.migrated ? "bg-green-50/50" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[page.pageType] || "bg-gray-100"}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{page.title}</h3>
                          {page.migrated ? (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                              <Check size={12} className="mr-1" />
                              Migrada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                              <Clock size={12} className="mr-1" />
                              Pendente
                            </Badge>
                          )}
                          {page.cmsStatus && (
                            <Badge variant="outline" className="text-xs">
                              {page.cmsStatus === "PUBLISHED" ? "Publicada" : 
                               page.cmsStatus === "DRAFT" ? "Rascunho" : page.cmsStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          /{page.slug} • {page.sections.length} seções • Prioridade {page.priority}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.migrated ? (
                        <>
                          <Link href={`/gestor/paginas/${page.slug}`}>
                            <Button variant="outline" size="sm">
                              Editar no CMS
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMigrate(page.slug, true)}
                            disabled={migrating === page.slug}
                          >
                            {migrating === page.slug ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RefreshCw size={14} />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleMigrate(page.slug)}
                          disabled={migrating === page.slug}
                        >
                          {migrating === page.slug ? (
                            <Loader2 size={14} className="animate-spin mr-2" />
                          ) : (
                            <ArrowUpFromLine size={14} className="mr-2" />
                          )}
                          Migrar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Sobre a Migração</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>As páginas migradas são criadas como <strong>rascunho</strong></li>
                <li>O conteúdo precisa ser editado manualmente no CMS</li>
                <li>As páginas estáticas originais continuam funcionando</li>
                <li>Após publicar no CMS, a rota /p/[slug] terá prioridade</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
