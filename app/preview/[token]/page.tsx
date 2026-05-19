export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { StitchPageView } from "@/components/stitch/stitch-page-view";
import { REQUIRED_PAGE_TYPES } from "@/lib/themes/required-pages";
import { findByPreviewToken } from "@/lib/wizard/repository";
import { previewUrlForPage } from "@/lib/wizard/prompts";
import { previewOriginFromHeaders } from "@/lib/wizard/preview-origin";
import { unpackSessionData } from "@/lib/wizard/session-data";
import {
  parseSessionStitchPages,
  resolvePreviewPageType,
} from "@/lib/wizard/stitch-session-pages";
import { applyHomeStyling, extractHomeStyling } from "@/lib/stitch/share-page-styling";

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Preview expirado</h1>
          <p className="text-gray-600">
            O link de preview tem validade limitada. Volta no assistente e gera um novo.
          </p>
        </div>
      </main>
    );
  }

  const pageType = resolvePreviewPageType(searchParams.page);
  if (!pageType) notFound();

  const pages = parseSessionStitchPages(session);
  const rawHtml = pages[pageType]?.trim();
  if (!rawHtml) notFound();

  // Propaga estilos da home (CSS + tailwind-config + fontes) pras páginas
  // secundárias, pra que header/footer renderizem visualmente idênticos.
  // Sem isso, Stitch produz tailwind-config diferente por página → cores
  // divergentes entre pages no preview.
  const homeHtml = pages.home;
  const html =
    pageType !== "home" && homeHtml
      ? applyHomeStyling(rawHtml, extractHomeStyling(homeHtml))
      : rawHtml;

  const { answers } = unpackSessionData(session.data);
  const companyName = answers.companyName?.trim() || "Sua marca";
  const origin = previewOriginFromHeaders();

  const nav = (
    <div className="bg-gray-900 text-gray-200 text-xs py-2 px-4 flex flex-wrap gap-3 justify-center shrink-0">
      {REQUIRED_PAGE_TYPES.map((p) => (
        <Link
          key={p}
          href={previewUrlForPage(origin, params.token, p)}
          className={p === pageType ? "text-white font-semibold underline" : "hover:text-white"}
        >
          {PAGE_LABEL[p]}
        </Link>
      ))}
    </div>
  );

  return (
    <StitchPageView
      fullViewport
      html={html}
      banner={
        <>
          {nav}
          <span>
            <strong>Preview · {companyName}</strong> · {PAGE_LABEL[pageType]} · IA · expira em 24h ·{" "}
            <strong>publicar</strong> no assistente para tornar permanente
          </span>
        </>
      }
    />
  );
}

export const metadata = {
  title: "Preview · clubedaweb",
  robots: { index: false, follow: false, nocache: true },
};
