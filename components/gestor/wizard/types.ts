export type ThemeKey = "m3" | "bitdefender";

export interface WizardData {
  theme: ThemeKey | null;
  identity: {
    companyName: string;
    tagline: string;
    logoUrl: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    linkedin: string;
    instagram: string;
    facebook: string;
  };
  home: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
    backgroundImage: string;
    services: Array<{ icon: string; title: string; description: string }>;
    features: Array<{ icon: string; title: string; description: string }>;
    testimonials: Array<{ name: string; role: string; company: string; content: string; rating: number }>;
  };
  partners: Array<{ name: string; logoUrl: string }>;
  google: {
    property: string;
  };
}

export const STEP_KEYS = ["theme", "identity", "home", "partners", "google", "review"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface StepMeta {
  key: StepKey;
  label: string;
  description: string;
}

export const STEPS: StepMeta[] = [
  { key: "theme", label: "Tema", description: "Escolha o ponto de partida" },
  { key: "identity", label: "Identidade", description: "Marca e contato" },
  { key: "home", label: "Home", description: "Conteúdo principal" },
  { key: "partners", label: "Parceiros", description: "Logos da home" },
  { key: "google", label: "Google", description: "Conectar Search Console" },
  { key: "review", label: "Revisar", description: "Conferir e aplicar" },
];
