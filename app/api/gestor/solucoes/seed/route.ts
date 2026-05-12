import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { solutionsData } from "@/lib/solutions-data";

// Category and card variant mapping from listing page
const CATEGORY_MAP: Record<string, { category: string; cardVariant: string; icon?: string; logo?: string; image?: string; displayOrder: number }> = {
  // Services
  consultoria: { category: "services", cardVariant: "card", icon: "Lightbulb", image: "consultoria", displayOrder: 0 },
  gestao: { category: "services", cardVariant: "card", icon: "Settings", image: "gestao", displayOrder: 1 },
  "noc-24x7": { category: "services", cardVariant: "card", icon: "Monitor", image: "noc", displayOrder: 2 },
  "suporte-tecnico": { category: "services", cardVariant: "card", icon: "Headphones", image: "suporte", displayOrder: 3 },
  projetos: { category: "services", cardVariant: "card", icon: "FolderKanban", image: "projetos", displayOrder: 4 },
  locacao: { category: "services", cardVariant: "card", icon: "Laptop", image: "locacao", displayOrder: 5 },
  // Cloud
  multicloud: { category: "cloud", cardVariant: "cloud", icon: "Cloud", logo: "https://cdn-icons-png.flaticon.com/512/4215/4215831.png", displayOrder: 0 },
  aws: { category: "cloud", cardVariant: "cloud", icon: "Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", displayOrder: 1 },
  azure: { category: "cloud", cardVariant: "cloud", icon: "Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg", displayOrder: 2 },
  ibm: { category: "cloud", cardVariant: "cloud", icon: "Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg", displayOrder: 3 },
  "nuvem-privada": { category: "cloud", cardVariant: "cloud", icon: "Server", logo: "https://cdn-icons-png.flaticon.com/512/2920/2920349.png", displayOrder: 4 },
  "disaster-recovery": { category: "cloud", cardVariant: "cloud", icon: "Database", logo: "https://cdn-icons-png.flaticon.com/512/1995/1995574.png", displayOrder: 5 },
  // Backup
  backup: { category: "backup", cardVariant: "card", icon: "HardDrive", image: "servidores", displayOrder: 0 },
  veeam: { category: "backup", cardVariant: "card", icon: "HardDrive", image: "servidores", displayOrder: 1 },
  "acronis-backup": { category: "backup", cardVariant: "card", icon: "Shield", image: "seguranca", displayOrder: 2 },
  "acronis-disaster-recovery": { category: "backup", cardVariant: "card", icon: "Database", image: "servidores", displayOrder: 3 },
  // Security
  seguranca: { category: "security", cardVariant: "security", icon: "Shield", logo: "https://cdn-icons-png.flaticon.com/512/2092/2092663.png", displayOrder: 0 },
  antivirus: { category: "security", cardVariant: "security", icon: "Shield", logo: "https://cdn-icons-png.flaticon.com/512/2534/2534620.png", displayOrder: 1 },
  firewall: { category: "security", cardVariant: "security", icon: "Lock", logo: "https://cdn-icons-png.flaticon.com/512/1161/1161388.png", displayOrder: 2 },
  dlp: { category: "security", cardVariant: "security", icon: "FileKey", logo: "https://cdn-icons-png.flaticon.com/512/3064/3064197.png", displayOrder: 3 },
  iam: { category: "security", cardVariant: "security", icon: "Users", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", displayOrder: 4 },
  // Security Partners
  sophos: { category: "security-partners", cardVariant: "partner", icon: "Shield", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/sophos.png", displayOrder: 0 },
  "sophos-utm": { category: "security-partners", cardVariant: "partner", icon: "Lock", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/sophos.png", displayOrder: 1 },
  bitdefender: { category: "security-partners", cardVariant: "partner", icon: "Shield", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/bitdefender.png", displayOrder: 2 },
  kaspersky: { category: "security-partners", cardVariant: "partner", icon: "Shield", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/kaspersky.png", displayOrder: 3 },
  eset: { category: "security-partners", cardVariant: "partner", icon: "Shield", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/eset.png", displayOrder: 4 },
  "panda-security": { category: "security-partners", cardVariant: "partner", icon: "Shield", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/panda.png", displayOrder: 5 },
  sonicwall: { category: "security-partners", cardVariant: "partner", icon: "Lock", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/sonicwall.png", displayOrder: 6 },
  fortinet: { category: "security-partners", cardVariant: "partner", icon: "Lock", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/fortinet.png", displayOrder: 7 },
  blockbit: { category: "security-partners", cardVariant: "partner", icon: "Lock", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/blockbit.png", displayOrder: 8 },
  safetica: { category: "security-partners", cardVariant: "partner", icon: "FileKey", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/safetica.png", displayOrder: 9 },
  acronis: { category: "security-partners", cardVariant: "partner", icon: "Shield", image: "seguranca", logo: "https://cdn.m3solutions.net.br/partners/acronis.png", displayOrder: 10 },
  // Software
  licenciamento: { category: "software", cardVariant: "card", icon: "Key", image: "servidores", displayOrder: 0 },
  "microsoft-office-365": { category: "software", cardVariant: "card", icon: "Globe", image: "servidores", displayOrder: 1 },
  "google-workspace": { category: "software", cardVariant: "card", icon: "Globe", image: "cloud", displayOrder: 2 },
  // Datacenters
  "equinix-datacenter": { category: "datacenters", cardVariant: "partner", icon: "Building2", image: "servidores", logo: "https://cdn.m3solutions.net.br/partners/equinix-original.png", displayOrder: 0 },
  "ascenty-datacenter": { category: "datacenters", cardVariant: "partner", icon: "Building2", image: "servidores", logo: "https://cdn.m3solutions.net.br/partners/ascenty-original.png", displayOrder: 1 },
  "elea-datacenter": { category: "datacenters", cardVariant: "partner", icon: "Building2", image: "servidores", logo: "https://cdn.m3solutions.net.br/partners/elea-original.png", displayOrder: 2 },
};

// Sub-solutions that don't appear on the listing page but have detail pages
const SUB_SOLUTIONS_CATEGORY: Record<string, { category: string; cardVariant: string; displayOrder: number }> = {
  "projetos-personalizados": { category: "services", cardVariant: "card", displayOrder: 100 },
  nuvem: { category: "cloud", cardVariant: "cloud", displayOrder: 100 },
  "servico-de-email": { category: "software", cardVariant: "card", displayOrder: 100 },
  "microsoft-exchange-online": { category: "software", cardVariant: "card", displayOrder: 100 },
  licenciamentos: { category: "software", cardVariant: "card", displayOrder: 100 },
  parceiros: { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  autodesk: { category: "software", cardVariant: "card", displayOrder: 100 },
  // Sophos sub-products
  "sophos-endpoint": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "sophos-edr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "sophos-xdr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "sophos-mdr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  // Kaspersky sub-products
  "kaspersky-next-edr-foundations": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "kaspersky-next-edr-optimum": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "kaspersky-edr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "kaspersky-endpoint-select": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "kaspersky-endpoint-advanced": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "kaspersky-total": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  // Acronis sub-products
  "acronis-edr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "acronis-xdr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "acronis-mdr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  // ESET sub-products
  "eset-protect-entry": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "eset-protect-advanced": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "eset-protect-complete": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "eset-protect-elite": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
  "eset-protect-mdr": { category: "security-partners", cardVariant: "partner", displayOrder: 100 },
};

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const results: { slug: string; action: string }[] = [];

    for (const [slug, data] of Object.entries(solutionsData)) {
      const catInfo = CATEGORY_MAP[slug] || SUB_SOLUTIONS_CATEGORY[slug] || { category: "other", cardVariant: "card", displayOrder: 999 };

      const existing = await prisma.solution.findUnique({ where: { slug } });
      if (existing) {
        results.push({ slug, action: "skipped (already exists)" });
        continue;
      }

      await prisma.solution.create({
        data: {
          slug,
          category: catInfo.category,
          cardVariant: catInfo.cardVariant,
          displayOrder: catInfo.displayOrder,
          title: data.title || slug,
          subtitle: data.subtitle || null,
          image: (catInfo as any).image || data.image || null,
          icon: (catInfo as any).icon || null,
          logo: (catInfo as any).logo || null,
          description: data.description || null,
          longDescription: data.longDescription || null,
          benefits: data.benefits || null,
          features: data.features || null,
          highlights: data.highlights || null,
          extraSections: data.extraSections || null,
          partnerLogos: data.partnerLogos || null,
          dataCenterPartners: data.dataCenterPartners || null,
          metaTitle: data.title || null,
          metaDescription: data.description?.substring(0, 160) || null,
          active: true,
        }
      });
      results.push({ slug, action: "created" });
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
