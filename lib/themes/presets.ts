import { buildRequiredPageLayouts, type ThemeLayoutKey } from "./page-layouts";
import type { ThemeRequiredPages } from "./required-pages";
import { assertThemeHasRequiredPages, SITE_PAGE_ROUTES } from "./required-pages";

export interface ThemePreset {
  key: string;
  name: string;
  tagline: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  brand: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textColor: string;
    textLightColor: string;
    backgroundColor: string;
    surfaceColor: string;
    fontPrimary: string;
    fontSecondary: string;
    fontHeading: string;
    logoUrl: string;
    logoLightUrl: string;
    borderRadius: string;
    styleType: string;
    buttonStyle: string;
  };
  siteConfig: {
    company_name: string;
    tagline: string;
  };
  home: {
    hero: any;
    services: any[];
    solutions: any[];
    features: any[];
    testimonials: any[];
  };
  /** Layouts obrigatórios: home, sobre, contato, serviços, blog. */
  pages: ThemeRequiredPages;
}

function attachRequiredPages(
  key: ThemeLayoutKey,
  siteConfig: ThemePreset["siteConfig"],
  preset: Omit<ThemePreset, "pages">,
): ThemePreset {
  const full: ThemePreset = {
    ...preset,
    pages: buildRequiredPageLayouts(key, siteConfig.company_name, siteConfig.tagline),
  };
  assertThemeHasRequiredPages(full.key, full.pages);
  return full;
}

const M3_PRESET_BASE = {
  key: "m3",
    name: "M3Solutions (Original)",
    tagline: "Soluções completas em TI para sua empresa",
    description: "Tema corporativo azul, foco em consultoria e serviços de TI.",
    preview: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#10B981",
      bg: "#FFFFFF",
    },
    brand: {
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      accentColor: "#10B981",
      textColor: "#1F2937",
      textLightColor: "#6B7280",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F9FAFB",
      fontPrimary: "'Inter', sans-serif",
      fontSecondary: "'JetBrains Mono', monospace",
      fontHeading: "'Manrope', sans-serif",
      logoUrl: "/images/logo-m3solutions.svg",
      logoLightUrl: "/images/logo-m3solutions.svg",
      borderRadius: "12px",
      styleType: "corporate",
      buttonStyle: "rounded",
    },
    siteConfig: {
      company_name: "M3Solutions",
      tagline: "Soluções completas em TI: consultoria, gestão, NOC 24x7, multicloud e segurança.",
    },
    home: {
      hero: {
        badge: "+ DE 12 ANOS TRANSFORMANDO TI",
        title: "Soluções em {highlight} que impulsionam seu negócio",
        titleHighlight: "TI",
        subtitle: "Consultoria, suporte, gestão, NOC 24x7, multicloud e segurança. Tudo o que sua empresa precisa para crescer com tecnologia.",
        ctaPrimaryText: "Fale com um especialista",
        ctaPrimaryLink: SITE_PAGE_ROUTES.contact,
        ctaSecondaryText: "Conheça nossas soluções",
        ctaSecondaryLink: SITE_PAGE_ROUTES.services,
        backgroundImage: "https://cdn.abacus.ai/images/9090133f-28b9-4df4-92a8-37fd51d6f0ad.png",
        stats: [
          { value: "5597+", label: "Clientes atendidos" },
          { value: "24x7", label: "Monitoramento contínuo" },
          { value: "99.9%", label: "Uptime" }
        ],
        featureCards: [
          { icon: "Shield", title: "Segurança", description: "Proteção completa contra ameaças digitais" },
          { icon: "Cloud", title: "Multicloud", description: "AWS, Azure, IBM Cloud e Nuvem privada" },
          { icon: "Headphones", title: "Suporte", description: "Especializado para empresas" }
        ]
      },
      services: [
        { title: "Consultoria", slug: "consultoria", description: "Diagnóstico, planejamento e estratégia de TI alinhada ao negócio.", icon: "Lightbulb", image: "hero" },
        { title: "Gestão de TI", slug: "gestao", description: "Operação, monitoramento e governança da sua infraestrutura.", icon: "Settings", image: "cloud" },
        { title: "NOC 24x7", slug: "noc-24x7", description: "Centro de operações de rede com monitoramento contínuo.", icon: "Headphones", image: "hero" }
      ],
      solutions: [
        { title: "Multicloud", slug: "multicloud", description: "AWS, Azure e IBM Cloud com gestão unificada.", icon: "Cloud", image: "cloud" },
        { title: "Nuvem Privada", slug: "nuvem-privada", description: "Infraestrutura dedicada com soberania total.", icon: "Server", image: "hero" },
        { title: "Segurança", slug: "seguranca", description: "Antimalware, EDR e proteção em camadas.", icon: "Shield", image: "cloud" },
        { title: "Backup & DR", slug: "backup", description: "Backup contínuo e recuperação de desastres.", icon: "Lock", image: "hero" }
      ],
      features: [
        { icon: "Award", title: "Experiência Comprovada", description: "Mais de 12 anos no mercado de TI atendendo empresas de todos os portes." },
        { icon: "Users", title: "Equipe Especializada", description: "Profissionais certificados nas principais tecnologias do mercado." },
        { icon: "Clock", title: "Suporte 24x7", description: "Monitoramento e suporte contínuo, 24 horas por dia, 7 dias por semana." },
        { icon: "Zap", title: "Soluções Rápidas", description: "Tempo de resposta ágil para resolver seus problemas." },
        { icon: "CheckCircle", title: "SLA Garantido", description: "Acordos de nível de serviço com garantia de disponibilidade." },
        { icon: "TrendingUp", title: "Foco em Resultados", description: "Soluções orientadas a resultados e ROI para seu negócio." }
      ],
      testimonials: [
        { name: "Ricardo Almeida", role: "Diretor de TI", company: "Indústria ABC", content: "A M3Solutions transformou nossa infraestrutura. O NOC 24x7 nos dá tranquilidade total.", rating: 5 },
        { name: "Fernanda Costa", role: "CEO", company: "Logística Express", content: "A migração para multicloud foi tranquila. Entregaram mais do que esperávamos.", rating: 5 },
        { name: "Paulo Mendes", role: "Gerente de Operações", company: "Fintech Solutions", content: "A consultoria em segurança foi fundamental para nossa adequação à LGPD.", rating: 5 }
      ]
    }
};

const BITDEFENDER_PRESET_BASE = {
  key: "bitdefender",
    name: "Bitdefender",
    tagline: "Cybersegurança que se antecipa às ameaças",
    description: "Tema vermelho focado em produto Bitdefender — antimalware, EDR e XDR.",
    preview: {
      primary: "#CC0000",
      secondary: "#8B0000",
      accent: "#3B82F6",
      bg: "#FFFFFF",
    },
    brand: {
      primaryColor: "#CC0000",
      secondaryColor: "#8B0000",
      accentColor: "#3B82F6",
      textColor: "#1F2937",
      textLightColor: "#6B7280",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F9FAFB",
      fontPrimary: "'Inter', sans-serif",
      fontSecondary: "'JetBrains Mono', monospace",
      fontHeading: "'Manrope', sans-serif",
      logoUrl: "",
      logoLightUrl: "",
      borderRadius: "12px",
      styleType: "tech",
      buttonStyle: "rounded",
    },
    siteConfig: {
      company_name: "Bitdefender",
      tagline: "Cybersegurança que se antecipa às ameaças. Proteção de classe mundial para empresas que não podem parar.",
    },
    home: {
      hero: {
        badge: "PROTEÇÃO BITDEFENDER",
        title: "Segurança que {highlight} ataques antes que aconteçam",
        titleHighlight: "antecipa",
        subtitle: "Bitdefender GravityZone — antimalware, EDR e XDR de classe mundial. Proteção em camadas para endpoints, servidores e cargas de trabalho na nuvem.",
        ctaPrimaryText: "Solicitar orçamento",
        ctaPrimaryLink: SITE_PAGE_ROUTES.contact,
        ctaSecondaryText: "Ver edições",
        ctaSecondaryLink: "/p/bitdefender-business-security",
        backgroundImage: "https://cdn.abacus.ai/images/9090133f-28b9-4df4-92a8-37fd51d6f0ad.png",
        stats: [
          { value: "500M+", label: "Endpoints protegidos" },
          { value: "99.9%", label: "Detecção de malware" },
          { value: "150+", label: "Países atendidos" }
        ],
        featureCards: [
          { icon: "Shield", title: "Antimalware #1", description: "Líder em rankings AV-TEST e AV-COMPARATIVES" },
          { icon: "Zap", title: "EDR avançado", description: "Detecção e resposta a ameaças sofisticadas" },
          { icon: "Lock", title: "Anti-Ransomware", description: "Backup automático e rollback de ataques" }
        ]
      },
      services: [
        { title: "Business Security", slug: "../p/bitdefender-business-security", description: "Antivírus corporativo essencial para PMEs com gestão na nuvem.", icon: "Shield", image: "hero" },
        { title: "Business Security Premium", slug: "../p/bitdefender-business-security-premium", description: "EDR + HyperDetect + Sandbox para empresas em crescimento.", icon: "ShieldCheck", image: "cloud" },
        { title: "Business Security Enterprise", slug: "../p/bitdefender-business-security-enterprise", description: "XDR, Threat Hunting e MDR opcional pra empresas com SOC.", icon: "Lock", image: "hero" }
      ],
      solutions: [
        { title: "Antimalware ML", slug: "../p/bitdefender-business-security", description: "Machine learning treinado em bilhões de amostras detecta malware conhecido e zero-day em milissegundos.", icon: "ShieldCheck", image: "cloud" },
        { title: "EDR & XDR", slug: "../p/bitdefender-business-security-premium", description: "Detecção, investigação e resposta a ameaças avançadas em endpoints, identidade, rede e cloud.", icon: "Activity", image: "hero" },
        { title: "Anti-Ransomware", slug: "../p/bitdefender-business-security", description: "Múltiplas camadas: backup automático e rollback instantâneo de alterações maliciosas.", icon: "Lock", image: "cloud" },
        { title: "Sandbox & HyperDetect", slug: "../p/bitdefender-business-security-premium", description: "Análise heurística avançada e sandbox em nuvem para ameaças sofisticadas e fileless.", icon: "Shield", image: "hero" }
      ],
      features: [
        { icon: "Award", title: "#1 em Detecção", description: "Reconhecido como melhor antimalware corporativo pela AV-TEST e AV-COMPARATIVES." },
        { icon: "Zap", title: "Baixo Consumo", description: "Tecnologia de cache global reduz uso de CPU e memória nos endpoints." },
        { icon: "Cloud", title: "100% Cloud", description: "Console de gestão na nuvem — sem servidor local, sem manutenção." },
        { icon: "Users", title: "Suporte M3", description: "Time brasileiro de especialistas certificados Bitdefender, em português." },
        { icon: "CheckCircle", title: "LGPD Ready", description: "Logs detalhados, auditoria e relatórios de compliance prontos." },
        { icon: "TrendingUp", title: "Escala fácil", description: "De 5 a 50.000 endpoints na mesma console, sem reconfigurar nada." }
      ],
      testimonials: [
        { name: "Ricardo Almeida", role: "Diretor de TI", company: "Indústria ABC", content: "Migramos pra Bitdefender e os falsos positivos caíram 95%. O EDR detectou um ataque de ransomware antes mesmo da execução.", rating: 5 },
        { name: "Fernanda Costa", role: "CEO", company: "Logística Express", content: "A console na nuvem é simples até pra quem não é especialista. E o suporte da M3 fala português, isso faz toda diferença.", rating: 5 },
        { name: "Paulo Mendes", role: "Gerente de Operações", company: "Fintech Solutions", content: "Compliance LGPD virou trivial — relatórios prontos, logs detalhados, e o XDR cruza endpoint com identidade.", rating: 5 }
      ]
    }
};

export const THEME_PRESETS: Record<string, ThemePreset> = {
  m3: attachRequiredPages("m3", M3_PRESET_BASE.siteConfig, M3_PRESET_BASE as Omit<ThemePreset, "pages">),
  bitdefender: attachRequiredPages(
    "bitdefender",
    BITDEFENDER_PRESET_BASE.siteConfig,
    BITDEFENDER_PRESET_BASE as Omit<ThemePreset, "pages">,
  ),
};

export const THEME_LIST: ThemePreset[] = Object.values(THEME_PRESETS);
