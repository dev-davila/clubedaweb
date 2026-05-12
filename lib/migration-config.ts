// Configuração das páginas estáticas para migração

export interface StaticPageConfig {
  slug: string;
  title: string;
  pageType: "institutional" | "legal" | "product" | "service" | "landing";
  templateType: string;
  description: string;
  priority: number; // 1-5, 5 being highest
  sections: Array<{
    key: string;
    label: string;
    defaultContent?: Record<string, any>;
  }>;
}

export const STATIC_PAGES_CONFIG: StaticPageConfig[] = [
  // Páginas Institucionais
  {
    slug: "quem-somos",
    title: "Quem Somos",
    pageType: "institutional",
    templateType: "ABOUT",
    description: "Página sobre a empresa M3Solutions",
    priority: 5,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "text", label: "História da Empresa" },
      { key: "features", label: "Diferenciais" },
      { key: "cta", label: "Call to Action" }
    ]
  },
  {
    slug: "missao-visao-e-valores",
    title: "Missão, Visão e Valores",
    pageType: "institutional",
    templateType: "ABOUT",
    description: "Missão, visão e valores da M3Solutions",
    priority: 4,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "text", label: "Missão" },
      { key: "text", label: "Visão" },
      { key: "features", label: "Valores" }
    ]
  },
  {
    slug: "nossos-parceiros",
    title: "Nossos Parceiros",
    pageType: "institutional",
    templateType: "ABOUT",
    description: "Parceiros tecnológicos da M3Solutions",
    priority: 4,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "partners", label: "Grid de Parceiros" },
      { key: "features", label: "Benefícios das Parcerias" },
      { key: "cta", label: "Call to Action" }
    ]
  },
  {
    slug: "portfolio",
    title: "Portfólio",
    pageType: "institutional",
    templateType: "SERVICES",
    description: "Portfólio de projetos da M3Solutions",
    priority: 4,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "services", label: "Projetos" },
      { key: "cta", label: "Call to Action" }
    ]
  },
  {
    slug: "contato",
    title: "Contato",
    pageType: "institutional",
    templateType: "CONTACT",
    description: "Página de contato",
    priority: 5,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "contact", label: "Formulário e Informações" }
    ]
  },
  {
    slug: "trabalhe-conosco",
    title: "Trabalhe Conosco",
    pageType: "institutional",
    templateType: "CONTACT",
    description: "Página de carreiras",
    priority: 3,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "text", label: "Por que trabalhar conosco" },
      { key: "features", label: "Benefícios" },
      { key: "contact", label: "Formulário" }
    ]
  },
  
  // Páginas Legais
  {
    slug: "lgpd",
    title: "LGPD",
    pageType: "legal",
    templateType: "LEGAL",
    description: "Política de conformidade com a LGPD",
    priority: 5,
    sections: [
      { key: "text", label: "Conteúdo da Política" }
    ]
  },
  {
    slug: "aviso-de-privacidade",
    title: "Aviso de Privacidade",
    pageType: "legal",
    templateType: "LEGAL",
    description: "Aviso de privacidade do site",
    priority: 5,
    sections: [
      { key: "text", label: "Conteúdo do Aviso" }
    ]
  },
  {
    slug: "aviso-de-cookies",
    title: "Aviso de Cookies",
    pageType: "legal",
    templateType: "LEGAL",
    description: "Política de cookies do site",
    priority: 4,
    sections: [
      { key: "text", label: "Conteúdo do Aviso" }
    ]
  },
  {
    slug: "politica-antissuborno-e-anticorrupcao",
    title: "Política Antissuborno e Anticorrupção",
    pageType: "legal",
    templateType: "LEGAL",
    description: "Política de compliance",
    priority: 3,
    sections: [
      { key: "text", label: "Conteúdo da Política" }
    ]
  },
  {
    slug: "etica",
    title: "Código de Ética",
    pageType: "legal",
    templateType: "LEGAL",
    description: "Código de ética da empresa",
    priority: 3,
    sections: [
      { key: "text", label: "Conteúdo do Código" }
    ]
  },
  {
    slug: "canal-de-denuncias",
    title: "Canal de Denúncias",
    pageType: "legal",
    templateType: "LEGAL",
    description: "Canal para denúncias anônimas",
    priority: 3,
    sections: [
      { key: "text", label: "Informações do Canal" },
      { key: "contact", label: "Formulário de Denúncia" }
    ]
  },
  
  // Compliance/Responsabilidade
  {
    slug: "sustentabilidade",
    title: "Sustentabilidade",
    pageType: "institutional",
    templateType: "ABOUT",
    description: "Iniciativas de sustentabilidade",
    priority: 3,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "text", label: "Nosso Compromisso" },
      { key: "features", label: "Iniciativas" }
    ]
  },
  {
    slug: "responsabilidade-social",
    title: "Responsabilidade Social",
    pageType: "institutional",
    templateType: "ABOUT",
    description: "Ações de responsabilidade social",
    priority: 3,
    sections: [
      { key: "hero", label: "Banner Principal" },
      { key: "text", label: "Nosso Compromisso" },
      { key: "features", label: "Ações" }
    ]
  },
  
  // Páginas de Produtos
  {
    slug: "bitdefender-gravityzone-business-security",
    title: "Bitdefender GravityZone Business Security",
    pageType: "product",
    templateType: "PRODUCTS",
    description: "Solução de segurança Bitdefender",
    priority: 4,
    sections: [
      { key: "hero", label: "Banner do Produto" },
      { key: "features", label: "Recursos" },
      { key: "text", label: "Descrição Detalhada" },
      { key: "cta", label: "Call to Action" }
    ]
  },
  {
    slug: "bitdefender-gravityzone-business-security-premium",
    title: "Bitdefender GravityZone Business Security Premium",
    pageType: "product",
    templateType: "PRODUCTS",
    description: "Solução de segurança Bitdefender Premium",
    priority: 4,
    sections: [
      { key: "hero", label: "Banner do Produto" },
      { key: "features", label: "Recursos" },
      { key: "text", label: "Descrição Detalhada" },
      { key: "cta", label: "Call to Action" }
    ]
  },
  {
    slug: "bitdefender-gravityzone-business-security-enterprise",
    title: "Bitdefender GravityZone Business Security Enterprise",
    pageType: "product",
    templateType: "PRODUCTS",
    description: "Solução de segurança Bitdefender Enterprise",
    priority: 4,
    sections: [
      { key: "hero", label: "Banner do Produto" },
      { key: "features", label: "Recursos" },
      { key: "text", label: "Descrição Detalhada" },
      { key: "cta", label: "Call to Action" }
    ]
  }
];

export function getPageConfig(slug: string): StaticPageConfig | undefined {
  return STATIC_PAGES_CONFIG.find(p => p.slug === slug);
}

export function getPagesByType(type: StaticPageConfig["pageType"]): StaticPageConfig[] {
  return STATIC_PAGES_CONFIG.filter(p => p.pageType === type);
}
