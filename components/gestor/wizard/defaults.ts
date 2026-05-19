import { THEME_PRESETS } from "@/lib/themes/presets";
import type { ThemeKey, WizardData } from "./types";

export function emptyWizardData(): WizardData {
  return {
    theme: null,
    identity: {
      companyName: "",
      tagline: "",
      logoUrl: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      linkedin: "",
      instagram: "",
      facebook: "",
    },
    home: {
      badge: "",
      title: "",
      titleHighlight: "",
      subtitle: "",
      ctaPrimaryText: "",
      ctaPrimaryLink: "/contato",
      ctaSecondaryText: "",
      ctaSecondaryLink: "",
      backgroundImage: "",
      services: [],
      features: [],
      testimonials: [],
    },
    partners: [],
    google: {
      property: "",
    },
  };
}

export function dataForTheme(themeKey: ThemeKey): WizardData {
  const preset = THEME_PRESETS[themeKey === "bitdefender" ? "bitdefender" : "m3"];
  return {
    theme: themeKey,
    identity: {
      companyName: preset.siteConfig.company_name,
      tagline: preset.siteConfig.tagline,
      logoUrl: preset.brand.logoUrl ?? "",
      phone: "0800 880 7777",
      whatsapp: "(11) 94720-0889",
      email: themeKey === "bitdefender" ? "contato@bitdefender.com.br" : "comercial@m3solutions.com.br",
      address: "Rua Gomes de Carvalho, 1629 — São Paulo/SP",
      linkedin: "https://linkedin.com/company/m3solutions",
      instagram: "https://instagram.com/m3solutions",
      facebook: "https://facebook.com/m3solutions",
    },
    home: {
      badge: preset.home.hero.badge,
      title: preset.home.hero.title,
      titleHighlight: preset.home.hero.titleHighlight,
      subtitle: preset.home.hero.subtitle,
      ctaPrimaryText: preset.home.hero.ctaPrimaryText,
      ctaPrimaryLink: preset.home.hero.ctaPrimaryLink,
      ctaSecondaryText: preset.home.hero.ctaSecondaryText,
      ctaSecondaryLink: preset.home.hero.ctaSecondaryLink,
      backgroundImage: preset.home.hero.backgroundImage,
      services: preset.home.services.map((s: any) => ({
        icon: s.icon || "Shield",
        title: s.title,
        description: s.description,
      })),
      features: preset.home.features.map((f: any) => ({
        icon: f.icon,
        title: f.title,
        description: f.description,
      })),
      testimonials: preset.home.testimonials.map((t: any) => ({
        name: t.name,
        role: t.role,
        company: t.company,
        content: t.content,
        rating: t.rating || 5,
      })),
    },
    partners: [
      { name: "Microsoft", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
      { name: "AWS", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
      { name: "Google Cloud", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
      { name: "IBM", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" },
    ],
    google: {
      property: "",
    },
  };
}

export function brandPreviewForTheme(themeKey: ThemeKey) {
  const preset = THEME_PRESETS[themeKey === "bitdefender" ? "bitdefender" : "m3"];
  return preset.preview;
}
