import { prisma } from "@/lib/db";
import { SERVICES, SOLUTIONS, IMAGES } from "@/lib/constants";

// ===================== Types =====================

export interface HeroConfig {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  backgroundImage: string;
  stats: { value: string; label: string }[];
  featureCards: { icon: string; title: string; description: string }[];
}

export interface ServiceItem {
  title: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
}

export interface SolutionItem {
  title: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

export interface HomeConfig {
  hero: HeroConfig;
  services: ServiceItem[];
  solutions: SolutionItem[];
  features: FeatureItem[];
  testimonials: TestimonialItem[];
}

// ===================== Defaults =====================

export const DEFAULT_HERO: HeroConfig = {
  badge: "+ de 12 anos transformando TI",
  title: "Soluções em {highlight} que impulsionam seu negócio",
  titleHighlight: "TI",
  subtitle: "Consultoria, Suporte, Gestão, NOC 24x7, Soluções em nuvem e segurança. Tudo o que sua empresa precisa para crescer com tecnologia.",
  ctaPrimaryText: "Fale com um especialista",
  ctaPrimaryLink: "/contato",
  ctaSecondaryText: "Conheça nossas soluções",
  ctaSecondaryLink: "/solucoes",
  backgroundImage: IMAGES.hero,
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
};

export const DEFAULT_SERVICES: ServiceItem[] = SERVICES;

export const DEFAULT_SOLUTIONS: SolutionItem[] = SOLUTIONS;

export const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "Award", title: "Experiência Comprovada", description: "Mais de 12 anos no mercado de TI, atendendo empresas de todos os portes." },
  { icon: "Users", title: "Equipe Especializada", description: "Profissionais certificados nas principais tecnologias do mercado." },
  { icon: "Clock", title: "Suporte 24x7", description: "Monitoramento e suporte contínuo, 24 horas por dia, 7 dias por semana." },
  { icon: "Zap", title: "Soluções Rápidas", description: "Tempo de resposta ágil para resolver seus problemas rapidamente." },
  { icon: "CheckCircle", title: "SLA Garantido", description: "Acordos de nível de serviço com garantia de disponibilidade." },
  { icon: "TrendingUp", title: "Foco em Resultados", description: "Soluções orientadas a resultados e ROI para seu negócio." }
];

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  { name: "Ricardo Almeida", role: "Diretor de TI", company: "Indústria ABC", content: "A M3Solutions transformou nossa infraestrutura de TI. O NOC 24x7 nos dá a tranquilidade de saber que estamos sempre protegidos e monitorados.", rating: 5 },
  { name: "Fernanda Costa", role: "CEO", company: "Logística Express", content: "A migração para o multicloud foi tranquila e eficiente. A equipe da M3Solutions entendeu nossas necessidades e entregou muito mais do que esperávamos.", rating: 5 },
  { name: "Paulo Mendes", role: "Gerente de Operações", company: "Fintech Solutions", content: "A consultoria em segurança foi fundamental para nossa adequação à LGPD. Profissionais competentes e atenciosos.", rating: 5 }
];

// ===================== Fetch =====================

export async function getHomeConfig(): Promise<HomeConfig> {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { category: "home" }
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    const hero = configMap.home_hero ? safeParseJSON<HeroConfig>(configMap.home_hero, DEFAULT_HERO) : DEFAULT_HERO;
    const services = configMap.home_services ? safeParseJSON<ServiceItem[]>(configMap.home_services, DEFAULT_SERVICES) : DEFAULT_SERVICES;
    const solutions = configMap.home_solutions ? safeParseJSON<SolutionItem[]>(configMap.home_solutions, DEFAULT_SOLUTIONS) : DEFAULT_SOLUTIONS;
    const features = configMap.home_features ? safeParseJSON<FeatureItem[]>(configMap.home_features, DEFAULT_FEATURES) : DEFAULT_FEATURES;
    const testimonials = configMap.home_testimonials ? safeParseJSON<TestimonialItem[]>(configMap.home_testimonials, DEFAULT_TESTIMONIALS) : DEFAULT_TESTIMONIALS;

    return { hero, services, solutions, features, testimonials };
  } catch (error) {
    console.error("Error loading home config:", error);
    return {
      hero: DEFAULT_HERO,
      services: DEFAULT_SERVICES,
      solutions: DEFAULT_SOLUTIONS,
      features: DEFAULT_FEATURES,
      testimonials: DEFAULT_TESTIMONIALS
    };
  }
}

// ===================== Client-side fetch =====================

export async function fetchHomeConfigAPI(): Promise<HomeConfig> {
  const res = await fetch("/api/gestor/home-config");
  if (!res.ok) throw new Error("Failed to fetch home config");
  return res.json();
}

// ===================== Helpers =====================

function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
