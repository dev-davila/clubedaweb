export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StitchPageEditor } from "@/components/gestor/stitch-page-editor";
import {
  REQUIRED_PAGE_TYPES,
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";
import {
  stitchHtmlConfigKey,
  stitchCustomHtmlConfigKey,
} from "@/lib/stitch/published-pages";

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
  const isRequired = REQUIRED_PAGE_TYPES.includes(params.pageType as RequiredPageType);
  const isCustomSlug = /^[a-z0-9-]{2,60}$/.test(params.pageType);
  if (!isRequired && !isCustomSlug) notFound();

  const key = isRequired
    ? stitchHtmlConfigKey(params.pageType as RequiredPageType)
    : stitchCustomHtmlConfigKey(params.pageType);

  const row = await prisma.siteConfig.findUnique({ where: { key } });
  const initialHtml = row?.value ?? "";

  if (!initialHtml.trim()) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-2">Página vazia</h1>
        <p className="text-sm text-gray-600">
          {isRequired
            ? "Essa página ainda não tem HTML publicado pelo Wizard."
            : `A página /${params.pageType} não existe. Crie pelo chat com "cria página /${params.pageType} sobre…".`}
        </p>
      </main>
    );
  }

  const label = isRequired
    ? PAGE_LABEL[params.pageType as RequiredPageType]
    : `/${params.pageType}`;
  const publicRoute = isRequired
    ? SITE_PAGE_ROUTES[params.pageType as RequiredPageType]
    : `/${params.pageType}`;

  return (
    <StitchPageEditor
      pageType={params.pageType}
      pageLabel={label}
      publicRoute={publicRoute}
      initialHtml={initialHtml}
    />
  );
}
