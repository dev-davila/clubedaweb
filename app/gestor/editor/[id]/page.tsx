export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { VisualPageEditor } from "@/components/gestor/visual-page-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params;
  const page = await prisma.dynamicPage.findUnique({ where: { id } });
  if (!page) notFound();

  let layoutConfig: any = {};
  try {
    layoutConfig = page.layoutConfig ? JSON.parse(page.layoutConfig) : {};
  } catch {
    layoutConfig = {};
  }

  return (
    <VisualPageEditor
      pageId={page.id}
      slug={page.slug}
      title={page.title}
      status={page.status}
      initialLayout={layoutConfig}
    />
  );
}
