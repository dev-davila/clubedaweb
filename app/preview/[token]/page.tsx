export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StitchPageView } from "@/components/stitch/stitch-page-view";
import { polishStitchPage } from "@/lib/stitch/polish-stitch-pages";
import { REQUIRED_PAGE_TYPES } from "@/lib/themes/required-pages";
import { findByPreviewToken } from "@/lib/wizard/repository";
import { previewUrlForPage } from "@/lib/wizard/prompts";
import { previewOriginFromHeaders } from "@/lib/wizard/preview-origin";
import { unpackSessionData } from "@/lib/wizard/session-data";
import {
  parseSessionStitchPages,
  resolvePreviewPageType,
} from "@/lib/wizard/stitch-session-pages";

const PAGE_LABEL: Record<string, string> = {
  home: "Home",
  about: "Quem somos",
  contact: "Contato",
  services: "Serviços",
  blog: "Blog",
};

interface PageProps {
  params: { token: string };
  searchParams: { page?: string | string[] };
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const session = await findByPreviewToken(params.token);
  if (!session) notFound();
  if (session.previewExpiresAt && session.previewExpiresAt < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Preview expirado</h1>
          <p className="text-zinc-400">
            O link de preview tem validade limitada. Volta no assistente e gera um novo.
          </p>
        </div>
      </main>
    );
  }

  const pageType = resolvePreviewPageType(searchParams.page);
  if (!pageType) notFound();

  const pages = parseSessionStitchPages(session);
  if (!pages[pageType]?.trim()) notFound();

  // Mesmo pipeline do publish: o cliente vê EXATAMENTE o que vai ser publicado.
  const { answers } = unpackSessionData(session.data);
  const logoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } }).catch(() => null);
  const logoUrl = logoRow?.value?.trim() || null;
  const html = polishStitchPage(pageType, pages, { answers, logoUrl });
  if (!html) notFound();

  const companyName = answers.companyName?.trim() || "Sua marca";
  const origin = previewOriginFromHeaders();

  return (
    <StitchPageView
      fullViewport
      html={html}
      banner={
        <PreviewBanner
          companyName={companyName}
          pageType={pageType}
          token={params.token}
          origin={origin}
        />
      }
    />
  );
}

interface BannerProps {
  companyName: string;
  pageType: string;
  token: string;
  origin: string;
}

function PreviewBanner({ companyName, pageType, token, origin }: BannerProps) {
  const currentLabel = PAGE_LABEL[pageType] ?? pageType;
  return (
    <div className="bg-zinc-950 text-zinc-100 border-b border-zinc-800 px-5 py-2.5 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Preview
        </span>
        <span className="font-semibold text-zinc-50 text-sm tracking-tight">{companyName}</span>
        <span className="text-zinc-500 text-xs hidden sm:inline">·</span>
        <span className="text-zinc-400 text-xs hidden sm:inline">{currentLabel}</span>
      </div>

      <nav className="flex items-center gap-1 ml-auto order-3 sm:order-2 w-full sm:w-auto">
        {REQUIRED_PAGE_TYPES.map((p) => (
          <Link
            key={p}
            href={previewUrlForPage(origin, token, p)}
            className={
              p === pageType
                ? "px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-50 text-xs font-medium"
                : "px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 text-xs transition"
            }
          >
            {PAGE_LABEL[p]}
          </Link>
        ))}
      </nav>

      <div className="text-zinc-500 text-[11px] order-2 sm:order-3 shrink-0">
        expira em 24h · use <strong className="text-zinc-300">publicar</strong> no chat pra tornar permanente
      </div>
    </div>
  );
}

export const metadata = {
  title: "Preview · clubedaweb",
  robots: { index: false, follow: false, nocache: true },
};
