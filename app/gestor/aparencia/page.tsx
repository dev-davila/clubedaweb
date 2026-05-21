export const dynamic = "force-dynamic";

import { getActiveBrand } from "@/lib/theme-config";
import { BrandEditor } from "@/components/gestor/brand-editor";
import { LogoUploader } from "@/components/gestor/logo-uploader";
import { StitchSiteSummary } from "@/components/gestor/stitch-site-summary";
import { prisma } from "@/lib/db";

export default async function AparenciaPage() {
  const brand = await getActiveBrand();
  const logoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } }).catch(() => null);
  const logoUrl = logoRow?.value ?? "";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aparência do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          Logo, paleta e tipografia do site publicado. A maior parte do tema vem do Wizard — pra trocar paleta ou estilo, gere de novo com instruções no chat.
        </p>
      </div>

      <StitchSiteSummary context="aparencia" />

      <div className="mb-6">
        <LogoUploader initialUrl={logoUrl} />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-10">
        Aparência do template legado (antes do Wizard)
      </div>
      <BrandEditor initial={brand} />
    </div>
  );
}
