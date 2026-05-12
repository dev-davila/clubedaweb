// ============================================================
// URL base do site — ALTERE APENAS AQUI ao trocar de domínio
// ============================================================
export const SITE_BASE_URL = "https://www.m3solutions.com.br";

/**
 * Retorna a URL base do site em runtime.
 * Em produção usa NEXTAUTH_URL (injetada automaticamente pelo Abacus);
 * em fallback usa SITE_BASE_URL definida acima.
 *
 * Pode ser chamada tanto em server-side quanto em client-side:
 * - Server: usa process.env.NEXTAUTH_URL
 * - Client: usa window.location.origin (quando disponível)
 */
export function getSiteUrl(): string {
  // Server-side
  if (typeof window === "undefined") {
    return process.env.NEXTAUTH_URL || SITE_BASE_URL;
  }
  // Client-side
  return window.location.origin;
}

// M3Solutions S3 Base URL for images
export const M3_S3_BASE_URL = "https://cdn.m3solutions.net.br";

// Logo oficial da M3Solutions - usar em todas as ações (emails, documentos, etc.)
export const M3_LOGO_URL = "/images/logo-m3solutions.svg";

export const SITE_CONFIG = {
  name: "M3Solutions",
  description: "Soluções em TI - Consultoria, Gestão, NOC 24x7, Cloud e muito mais",
  phone: "08008807777",
  whatsapp: "8008807777",
  whatsappLink: "https://wa.me/558008807777",
  email: "comercial@m3solutions.com.br",
  address: "Rua Gomes de Carvalho, 1629",
  addressLink: "https://maps.google.com/?q=Rua+Gomes+de+Carvalho,+1629,+São+Paulo+-+SP"
};

export const IMAGES = {
  hero: "https://cdn.abacus.ai/images/9090133f-28b9-4df4-92a8-37fd51d6f0ad.png",
  consultoria: "https://cdn.abacus.ai/images/82a45c01-73b8-42a7-903f-0b08e2c3e5e1.png",
  gestao: "https://cdn.abacus.ai/images/1aed8651-7648-4c6c-9ac6-ed41f3ede1a8.png",
  noc: "https://cdn.abacus.ai/images/f2a8bb1c-adf7-48bf-8823-5edf44933192.png",
  cloud: "https://cdn.abacus.ai/images/bacf05fc-c0e4-48d3-b8f6-de3391c3f06f.png",
  seguranca: "https://cdn.abacus.ai/images/de239951-321f-40d2-a4da-0afef7afcf98.png",
  suporte: "https://cdn.abacus.ai/images/ba35842a-4423-46af-9d42-5d41b412e808.png",
  equipe: "https://cdn.abacus.ai/images/cc4c373b-eb12-4e32-ab71-4f79e326c08c.png",
  servidores: "https://cdn.abacus.ai/images/15c39eb9-5f16-495f-977d-19b8a44ce46d.png",
  projetos: "https://cdn.abacus.ai/images/a1dbf634-4321-43ef-bf98-2265732ec731.png",
  locacao: "https://cdn.abacus.ai/images/74792b32-0a78-4a06-93ef-fddbac805895.png",
  nuvemPrivada: "https://cdn.abacus.ai/images/31419c22-b72f-4e36-956b-c217160a4f44.png"
};

export const SERVICES = [
  {
    title: "Consultoria",
    slug: "consultoria",
    description: "Análise estratégica e planejamento de TI para sua empresa",
    icon: "Lightbulb",
    image: "consultoria"
  },
  {
    title: "Gestão de TI",
    slug: "gestao",
    description: "Gestão completa da infraestrutura de TI da sua empresa",
    icon: "Settings",
    image: "gestao"
  },
  {
    title: "Nuvem Privada",
    slug: "nuvem-privada",
    description: "Infraestrutura de nuvem privada dedicada e segura",
    icon: "Cloud",
    image: "nuvemPrivada"
  },
  {
    title: "NOC 24x7",
    slug: "noc-24x7",
    description: "Monitoramento contínuo 24 horas por dia, 7 dias por semana",
    icon: "Monitor",
    image: "noc"
  },
  {
    title: "Projetos",
    slug: "projetos",
    description: "Projetos de infraestrutura de TI personalizados",
    icon: "FolderKanban",
    image: "projetos"
  },
  {
    title: "Suporte Técnico",
    slug: "suporte-tecnico",
    description: "Suporte técnico especializado e ágil",
    icon: "Headphones",
    image: "suporte"
  }
];

export const SOLUTIONS = [
  {
    title: "Multicloud",
    slug: "multicloud",
    description: "AWS, Azure, IBM Cloud integrados para sua empresa",
    icon: "Cloud",
    image: "cloud"
  },
  {
    title: "Nuvem Privada",
    slug: "nuvem-privada",
    description: "Infraestrutura de nuvem privada dedicada",
    icon: "Server",
    image: "nuvemPrivada"
  },
  {
    title: "Segurança",
    slug: "seguranca",
    description: "Proteção completa contra ameaças digitais",
    icon: "Shield",
    image: "seguranca"
  },
  {
    title: "Licenciamento",
    slug: "licenciamento",
    description: "Gestão de licenças de software corporativo",
    icon: "Key",
    image: "servidores"
  }
];

export const PARTNERS = [
  { name: "AWS", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
  { name: "Microsoft Azure", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg" },
  { name: "IBM Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" },
  { name: "Microsoft 365", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  { name: "Google Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
  { name: "HPE", logo: "https://upload.wikimedia.org/wikipedia/commons/4/46/Hewlett_Packard_Enterprise_logo.svg" },
  { name: "Equinix", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTH2dkKpG-pki7h5ySXXAJbI9o8DK0OT-Pe73qdZI93tTwSpGhbIr0puI&s=10" },
  { name: "Acronis", logo: "https://upload.wikimedia.org/wikipedia/en/8/88/Acronis-logo.svg" },
  { name: "Kaspersky", logo: "https://cdn.m3solutions.net.br/partners/kaspersky.png" },
  { name: "Bitdefender", logo: "https://cdn.m3solutions.net.br/partners/bitdefender.png" },
  { name: "Blockbit", logo: "https://www.blockbit.com/wp-content/uploads/2024/01/logo-bb-claro.png" }
];
// Updated: Mon Jan 19 22:46:16 UTC 2026
