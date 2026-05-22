export const dynamic = "force-dynamic";

import { LogoUploader } from "@/components/gestor/logo-uploader";
import { SiteContactsEditor } from "@/components/gestor/site-contacts-editor";
import { StitchSiteSummary } from "@/components/gestor/stitch-site-summary";
import { prisma } from "@/lib/db";

const CONTACT_KEYS = [
  "contact_phone", "contact_email", "contact_whatsapp",
  "contact_address", "contact_hours", "company_name",
];

export default async function AparenciaPage() {
  const logoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } }).catch(() => null);
  const logoUrl = logoRow?.value ?? "";

  const contactRows = await prisma.siteConfig.findMany({ where: { key: { in: CONTACT_KEYS } } });
  const contactMap = Object.fromEntries(contactRows.map((r) => [r.key, r.value]));
  const initialContacts = {
    contact_phone: contactMap.contact_phone ?? "",
    contact_email: contactMap.contact_email ?? "",
    contact_whatsapp: contactMap.contact_whatsapp ?? "",
    contact_address: contactMap.contact_address ?? "",
    contact_hours: contactMap.contact_hours ?? "",
    company_name: contactMap.company_name ?? "",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aparência do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          Logo, contatos e tema do site. A maior parte do design vem do Wizard — edite logo e contatos aqui; pra trocar paleta/fontes, regere pelo chat.
        </p>
      </div>

      <StitchSiteSummary context="aparencia" />

      <div className="mb-6">
        <LogoUploader initialUrl={logoUrl} />
      </div>

      <div className="mb-6">
        <SiteContactsEditor initial={initialContacts} />
      </div>
    </div>
  );
}
