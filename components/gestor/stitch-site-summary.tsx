/**
 * Card resumo do site Stitch publicado, injetado no topo das telas de Editor,
 * Aparência, Temas e Menus. Mostra status, páginas, tokens e ações principais
 * (regerar pelo wizard, despublicar). Sem isso, o admin parece "vazio" porque
 * as configurações legacy (paleta/temas/menus) não refletem o que está no /.
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
import {
  Sparkles,
  ExternalLink,
  Palette,
  Type,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const PAGE_LABEL: Record<RequiredPageType, string> = {
  home: "Início",
  about: "Quem somos",
  contact: "Contato",
  services: "Soluções",
  blog: "Notícias",
};

interface PageStatus {
  type: RequiredPageType;
  label: string;
  route: string;
  bytes: number;
  hasContent: boolean;
}

async function loadPagesStatus(): Promise<PageStatus[]> {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: REQUIRED_PAGE_TYPES.map(stitchHtmlConfigKey) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return REQUIRED_PAGE_TYPES.map((type) => {
    const value = map.get(stitchHtmlConfigKey(type)) ?? "";
    return {
      type,
      label: PAGE_LABEL[type],
      route: SITE_PAGE_ROUTES[type],
      bytes: value.length,
      hasContent: value.trim().length > 100,
    };
  });
}

async function loadLatestPublishedSession(): Promise<{
  companyName: string;
  industry: string;
  colors: string;
  publishedAt: Date | null;
} | null> {
  const session = await prisma.wizardSession.findFirst({
    where: { state: "published" },
    orderBy: { updatedAt: "desc" },
  });
  if (!session) return null;
  const data = session.data as { answers?: Record<string, unknown> } | null;
  const answers = (data?.answers ?? {}) as Record<string, unknown>;
  return {
    companyName: (answers.companyName as string) || "Sem nome",
    industry: (answers.industry as string) || "",
    colors: (answers.colors as string) || "",
    publishedAt: session.updatedAt,
  };
}

interface Props {
  /** Contexto da tela onde foi injetado — só pra ajustar copy do título. */
  context: "editor" | "aparencia" | "temas" | "menus";
}

export async function StitchSiteSummary({ context }: Props) {
  const isPublished = await isStitchSitePublished();

  if (!isPublished) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 text-sm">Nenhum site Stitch publicado ainda</h3>
          <p className="text-amber-800/80 text-sm mt-1">
            Use o <strong>Wizard de configuração</strong> pra gerar um site completo com IA em 5 páginas. As configurações desta tela só se aplicam ao template legado enquanto não houver publish Stitch.
          </p>
          <Link
            href="/gestor/wizard/chat"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-amber-900 text-amber-50 text-sm font-semibold hover:bg-amber-800 transition"
          >
            <Sparkles size={14} />
            Abrir o Wizard
          </Link>
        </div>
      </div>
    );
  }

  const [pages, session] = await Promise.all([loadPagesStatus(), loadLatestPublishedSession()]);
  const totalBytes = pages.reduce((sum, p) => sum + p.bytes, 0);

  const headerCopy: Record<Props["context"], { eyebrow: string; title: string; lead: string }> = {
    editor: {
      eyebrow: "SITE PUBLICADO PELO WIZARD",
      title: "5 páginas geradas pela IA",
      lead: "O conteúdo abaixo é o site Stitch ativo. Pra editar textos/layout, regere a página pelo Wizard — o editor visual abaixo só afeta páginas legadas.",
    },
    aparencia: {
      eyebrow: "PALETA ATUAL DO SITE",
      title: "Estilo aplicado pelo Wizard",
      lead: "As cores e tipografia do site publicado vêm do briefing do Wizard. Os campos abaixo só afetam o template legado — pra mudar o tema do site Stitch, regere pelo Wizard com novas instruções.",
    },
    temas: {
      eyebrow: "TEMA ATIVO",
      title: "Site gerado pelo Wizard (Stitch)",
      lead: "Quando há site Stitch publicado, ele tem prioridade sobre os templates abaixo. Os templates listados só são usados se você desinstalar o site Stitch.",
    },
    menus: {
      eyebrow: "NAVEGAÇÃO DO SITE",
      title: "Menu definido pelo Wizard",
      lead: "As 5 páginas publicadas pelo Wizard formam o menu padrão. O menu customizado abaixo só se aplica ao template legado.",
    },
  };
  const copy = headerCopy[context];

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {copy.eyebrow}
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            {copy.title}
          </h2>
          {session?.companyName && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>{session.companyName}</strong>
              {session.industry ? ` · ${session.industry.slice(0, 80)}` : ""}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2 max-w-2xl">{copy.lead}</p>
        </div>
        <Link
          href="/gestor/wizard/chat"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <Sparkles size={14} />
          Regerar / editar pelo Wizard
        </Link>
      </div>

      <div className="grid md:grid-cols-5 gap-2 mb-4">
        {pages.map((p) => (
          <Link
            key={p.type}
            href={p.route}
            target="_blank"
            className={`rounded-xl border p-3 text-sm transition group ${
              p.hasContent
                ? "border-gray-200 bg-white hover:border-emerald-400"
                : "border-red-200 bg-red-50/60"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-gray-900 truncate">{p.label}</span>
              <ExternalLink size={12} className="text-gray-400 group-hover:text-emerald-600 shrink-0" />
            </div>
            <div className="text-[11px] text-gray-500 font-mono truncate">{p.route}</div>
            <div className="text-[11px] mt-1">
              {p.hasContent ? (
                <span className="text-emerald-700">{Math.round(p.bytes / 1024)} KB</span>
              ) : (
                <span className="text-red-700">vazia</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        {session?.colors && (
          <div className="rounded-lg bg-white/70 border border-gray-200 p-3 flex items-start gap-2">
            <Palette size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-semibold text-gray-700 mb-0.5">Paleta pedida no briefing</div>
              <div className="text-gray-600 line-clamp-2">{session.colors}</div>
            </div>
          </div>
        )}
        <div className="rounded-lg bg-white/70 border border-gray-200 p-3 flex items-start gap-2">
          <Type size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-700 mb-0.5">Tamanho total</div>
            <div className="text-gray-600">
              {Math.round(totalBytes / 1024)} KB · publicado {session?.publishedAt ? new Date(session.publishedAt).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
