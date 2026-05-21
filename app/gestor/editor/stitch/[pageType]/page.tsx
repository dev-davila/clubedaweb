export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StitchPageEditor } from "@/components/gestor/stitch-page-editor";
import {
  REQUIRED_PAGE_TYPES,
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import { stitchHtmlConfigKey } from "@/lib/stitch/published-pages";

const PAGE_LABEL: Record<RequiredPageType, string> = {
  home: "Início",
  about: "Quem somos",
  contact: "Contato",
  services: "Soluções",
  blog: "Notícias",
};

interface Props {
  params: { pageType: string };
}

export default async function StitchPageEditPage({ params }: Props) {
  if (!REQUIRED_PAGE_TYPES.includes(params.pageType as RequiredPageType)) {
    notFound();
  }
  const pageType = params.pageType as RequiredPageType;
  const row = await prisma.siteConfig.findUnique({
    where: { key: stitchHtmlConfigKey(pageType) },
  });
  const initialHtml = row?.value ?? "";

  if (!initialHtml.trim()) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">Página vazia</h1>
        <p className="text-sm text-gray-600">
          Essa página ainda não tem HTML publicado pelo Wizard. Volte ao chat e gere o site primeiro.
        </p>
      </main>
    );
  }

  return (
    <StitchPageEditor
      pageType={pageType}
      pageLabel={PAGE_LABEL[pageType]}
      publicRoute={SITE_PAGE_ROUTES[pageType]}
      initialHtml={initialHtml}
    />
  );
}
