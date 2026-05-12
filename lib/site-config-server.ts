import { prisma } from "@/lib/db";
import { SITE_CONFIG } from "@/lib/constants";
import type { SiteContactConfig } from "@/lib/use-site-config";

export async function getSiteConfigServer(): Promise<SiteContactConfig> {
  const fallback: SiteContactConfig = {
    phone: SITE_CONFIG.phone || "0800 880 7777",
    whatsapp: SITE_CONFIG.whatsapp || "(11) 94720-0889",
    whatsappLink: SITE_CONFIG.whatsappLink || "https://wa.me/5511947200889",
    email: SITE_CONFIG.email || "comercial@m3solutions.com.br",
    address: SITE_CONFIG.address || "Rua Gomes de Carvalho, 1629",
    addressLink: SITE_CONFIG.addressLink || "https://maps.google.com",
    linkedin: "",
    instagram: "",
    facebook: "",
    companyName: "M3Solutions",
    logoUrl: "",
    tagline: "",
  };
  try {
    const rows = await prisma.siteConfig.findMany({
      where: { category: { in: ["contact", "general"] } },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      phone: map.contact_phone || fallback.phone,
      whatsapp: map.contact_whatsapp || fallback.whatsapp,
      whatsappLink: map.contact_whatsapp
        ? `https://wa.me/55${map.contact_whatsapp.replace(/\D/g, "")}`
        : fallback.whatsappLink,
      email: map.contact_email || fallback.email,
      address: map.contact_address || fallback.address,
      addressLink: map.contact_address
        ? `https://maps.google.com/?q=${encodeURIComponent(map.contact_address)}`
        : fallback.addressLink,
      linkedin: map.social_linkedin || map.contact_linkedin || "",
      instagram: map.social_instagram || map.contact_instagram || "",
      facebook: map.social_facebook || map.contact_facebook || "",
      companyName: map.company_name || map.contact_company_name || fallback.companyName,
      logoUrl: map.logo_url || map.brand_logo_url || "",
      tagline: map.tagline || map.company_tagline || "",
    };
  } catch {
    return fallback;
  }
}
