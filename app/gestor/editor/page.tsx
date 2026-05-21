export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Edit3, Plus, ExternalLink, Sparkles } from "lucide-react";
import { listTemplates } from "@/lib/templates";
import { StitchPagesGrid } from "@/components/gestor/stitch-pages-grid";

export default async function EditorListPage() {
  const pages = await prisma.dynamicPage.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      pageType: true,
      updatedAt: true,
      layoutConfig: true,
    },
  });

  const templates = listTemplates();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Editor visual</h1>
          <p className="text-gray-600 text-sm mt-1.5 max-w-2xl">
            Edite o conteúdo das páginas dinâmicas com preview ao vivo. Selecione uma página abaixo ou crie uma nova.
          </p>
        </div>
      </div>

      <StitchPagesGrid />

      <div className="mb-3 mt-10 flex items-end justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Páginas legadas (template antigo, antes do Wizard)
        </h2>
      </div>

      {/* Templates */}
      <div className="mb-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          Templates disponíveis
        </h2>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <div
              key={t.key}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Sparkles size={12} className="text-gray-500" />
              {t.name}
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{Object.keys(t.sections).length} seções</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Páginas ({pages.length})</h2>
          <Link
            href="/gestor/paginas/nova"
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
          >
            <Plus size={14} />
            Nova página
          </Link>
        </div>
        {pages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhuma página dinâmica ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pages.map((p) => {
              let template: string | null = null;
              let sectionCount = 0;
              try {
                const cfg = p.layoutConfig ? JSON.parse(p.layoutConfig) : null;
                template = cfg?.template ?? null;
                sectionCount = Array.isArray(cfg?.sections) ? cfg.sections.length : 0;
              } catch {}
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate">{p.title}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          p.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : p.status === "DRAFT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                      {template && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {template}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      /p/{p.slug} · {sectionCount} seções · {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                    >
                      <ExternalLink size={12} />
                      Ver
                    </a>
                    <Link
                      href={`/gestor/editor/${p.id}`}
                      className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
                    >
                      <Edit3 size={12} />
                      Editar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
