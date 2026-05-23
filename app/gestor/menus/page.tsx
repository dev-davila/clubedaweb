export const dynamic = "force-dynamic";

import { StitchMenuEditor } from "@/components/gestor/stitch-menu-editor";
import { getStitchMenuItems } from "@/lib/stitch/menu-items";
import {
  isStitchSitePublished,
  listStitchCustomPages,
} from "@/lib/stitch/published-pages";

function humanizeSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function MenusPage() {
  const stitchPublished = await isStitchSitePublished();
  const stitchItems = stitchPublished ? await getStitchMenuItems() : [];
  const customs = stitchPublished ? await listStitchCustomPages() : [];

  const inMenuRoutes = new Set(stitchItems.map((i) => i.route));
  const availablePages = customs
    .filter((c) => !inMenuRoutes.has(`/${c.slug}`))
    .map((c) => ({ slug: c.slug, label: humanizeSlug(c.slug) }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Menu do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          Organize a navegação do header. Arraste itens pra reordenar, edite o texto, ative ou desative.
          Páginas criadas em <a href="/gestor/paginas" className="text-emerald-700 underline">Páginas</a> podem ser adicionadas aqui.
        </p>
      </div>

      {stitchPublished && (
        <StitchMenuEditor initialItems={stitchItems} availablePages={availablePages} />
      )}
    </div>
  );
}
