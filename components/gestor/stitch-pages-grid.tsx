/**
 * Grid das 5 páginas Stitch publicadas (Editor visual). Cada card mostra
 * thumbnail mini, status (publicada/vazia), links pra abrir no site e
 * regerar via Wizard.
 */

import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  isStitchSitePublished,
  stitchHtmlConfigKey,
} from "@/lib/stitch/published-pages";
import {
  REQUIRED_PAGE_TYPES,
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import { ExternalLink, Sparkles, FileText, Plus, RefreshCw } from "lucide-react";

const PAGE_LABEL: Record<RequiredPageType, string> = {
  home: "Início",
  about: "Quem somos",
  contact: "Contato",
  services: "Soluções",
  blog: "Notícias",
};

const PAGE_DESC: Record<RequiredPageType, string> = {
  home: "Hero, diferenciais, prova social, CTA principal",
  about: "História da empresa, equipe, valores",
  services: "Produto/serviço principal + detalhes",
  contact: "Formulário + canais de atendimento",
  blog: "Artigos e novidades",
};

interface GridProps {
  /** Se true, card vira link pro editor por página (em vez do site público). */
  editable?: boolean;
}

export async function StitchPagesGrid({ editable = false }: GridProps = {}) {
  const isPublished = await isStitchSitePublished();
  if (!isPublished) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-8 text-center">
        <Sparkles size={28} className="text-amber-700 mx-auto mb-2" />
        <h3 className="font-semibold text-amber-900">Nenhum site publicado pelo Wizard</h3>
        <p className="text-sm text-amber-800/80 max-w-md mx-auto mt-1.5">
          Gere o site completo (5 páginas) com IA — briefing guiado, copy + design + imagens.
        </p>
        <Link
          href="/gestor/wizard/chat"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-amber-900 text-amber-50 font-semibold hover:bg-amber-800 transition"
        >
          <Sparkles size={14} />
          Abrir Wizard de configuração
        </Link>
      </div>
    );
  }

  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: REQUIRED_PAGE_TYPES.map(stitchHtmlConfigKey) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const session = await prisma.wizardSession.findFirst({
    where: { state: "published" },
    orderBy: { updatedAt: "desc" },
  });
  const companyName =
    (session?.data as { answers?: { companyName?: string } } | null)?.answers?.companyName ??
    "Site publicado";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Páginas do site · {companyName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            5 páginas geradas e publicadas pelo Wizard. Clique pra abrir no site ou regerar com IA.
          </p>
        </div>
        <Link
          href="/gestor/wizard/chat"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <RefreshCw size={13} />
          Regerar site
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-3 mb-3">
        {REQUIRED_PAGE_TYPES.map((type) => {
          const html = map.get(stitchHtmlConfigKey(type)) ?? "";
          const bytes = html.length;
          const hasContent = bytes > 100;
          const route = SITE_PAGE_ROUTES[type];

          // Detecta colorMode pelo bg pra colorir o card
          const isDark = /class=["'][^"']*\bbg-(background|black|slate-9|zinc-9|gray-9)/i.test(html);

          return (
            <div
              key={type}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-emerald-400 transition group"
            >
              <div
                className={`h-24 flex items-center justify-center text-center px-4 ${
                  isDark
                    ? "bg-gradient-to-br from-zinc-900 to-zinc-800 text-white"
                    : "bg-gradient-to-br from-gray-50 to-white text-gray-900 border-b border-gray-100"
                }`}
              >
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-60 mb-1">{type}</div>
                  <div className="text-base font-bold">{PAGE_LABEL[type]}</div>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{PAGE_DESC[type]}</p>
                <div className="flex items-center justify-between text-[11px] mb-3">
                  <span className="font-mono text-gray-500">{route}</span>
                  {hasContent ? (
                    <span className="text-emerald-700 font-semibold">{Math.round(bytes / 1024)} KB</span>
                  ) : (
                    <span className="text-red-700">vazia</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {editable ? (
                    <Link
                      href={`/gestor/editor/${type}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition"
                    >
                      <FileText size={11} />
                      Editar
                    </Link>
                  ) : (
                    <Link
                      href={route}
                      target="_blank"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition"
                    >
                      <ExternalLink size={11} />
                      Abrir
                    </Link>
                  )}
                  <Link
                    href={`/gestor/wizard/chat?regen=${type}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
                  >
                    <Sparkles size={11} />
                    Regerar
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        <Link
          href="/gestor/wizard/chat?action=add-page"
          className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500 transition flex flex-col items-center justify-center p-6 text-center group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2 group-hover:bg-emerald-200 transition">
            <Plus size={20} className="text-emerald-700" />
          </div>
          <div className="text-sm font-bold text-emerald-900">Nova página com IA</div>
          <div className="text-[11px] text-emerald-800/70 mt-1 max-w-[160px]">
            Descreva o que precisa — a IA gera no mesmo estilo das 5 páginas
          </div>
        </Link>
      </div>

      <div className="text-[11px] text-gray-500 italic flex items-center gap-1.5">
        <FileText size={11} />
        Para editar conteúdo/layout, regere a página via Wizard com instruções específicas (ex: "muda o headline da home").
      </div>
    </div>
  );
}
