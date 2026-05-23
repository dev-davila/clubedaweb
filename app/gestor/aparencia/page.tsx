export const dynamic = "force-dynamic";

import { SiteImagesEditor } from "@/components/gestor/site-images-editor";
import { SiteContactsEditor } from "@/components/gestor/site-contacts-editor";
import { SiteSocialEditor } from "@/components/gestor/site-social-editor";
import { prisma } from "@/lib/db";

const APPEARANCE_KEYS = [
  // Imagens
  "logo_url", "favicon_url", "og_image_url",
  // Contatos
  "contact_phone", "contact_email", "contact_whatsapp",
  "contact_address", "contact_hours", "company_name",
  // Redes sociais
  "social_instagram", "social_facebook", "social_linkedin",
  "social_youtube", "social_tiktok",
];

export default async function AparenciaPage() {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: APPEARANCE_KEYS } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aparência do site</h1>
        <p className="text-gray-600 text-sm mt-1">
          Logo, favicon, imagem de compartilhamento, contatos e redes sociais. Tudo aplica em todas as páginas do site publicado imediatamente após salvar.
        </p>
      </div>

      <div className="space-y-6">
        <SiteImagesEditor
          initial={{
            logo_url: map.logo_url ?? "",
            favicon_url: map.favicon_url ?? "",
            og_image_url: map.og_image_url ?? "",
          }}
        />

        <SiteContactsEditor
          initial={{
            company_name: map.company_name ?? "",
            contact_phone: map.contact_phone ?? "",
            contact_whatsapp: map.contact_whatsapp ?? "",
            contact_email: map.contact_email ?? "",
            contact_address: map.contact_address ?? "",
            contact_hours: map.contact_hours ?? "",
          }}
        />

        <SiteSocialEditor
          initial={{
            social_instagram: map.social_instagram ?? "",
            social_facebook: map.social_facebook ?? "",
            social_linkedin: map.social_linkedin ?? "",
            social_youtube: map.social_youtube ?? "",
            social_tiktok: map.social_tiktok ?? "",
          }}
        />
      </div>
    </div>
  );
}
