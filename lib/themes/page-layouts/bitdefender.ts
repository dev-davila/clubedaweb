import type { ThemeRequiredPages } from "../required-pages";
import { SITE_PAGE_ROUTES as R } from "../required-pages";

export function bitdefenderRequiredPageLayouts(
  companyName: string,
  tagline: string,
): ThemeRequiredPages {
  const co = companyName;
  const tg = tagline;

  return {
    home: {
      templateKey: "bitdefender",
      metaTitle: co,
      metaDescription: tg,
      layoutConfig: {
        template: "bitdefender",
        sections: [
          {
            key: "hero",
            data: {
              badge: "CYBERSEGURANÇA",
              icon: "Shield",
              title: co,
              subtitle: tg,
              bullets: [{ value: "Proteção em camadas" }, { value: "Console 100% na nuvem" }],
              ctaText: "Solicitar orçamento",
              ctaLink: R.contact,
              secondaryCtaText: "Ver edições",
              secondaryCtaLink: R.services,
            },
          },
          {
            key: "stats-strip",
            data: {
              items: [
                { value: "500M+", label: "Endpoints protegidos" },
                { value: "99.9%", label: "Detecção" },
                { value: "24x7", label: "Suporte" },
              ],
            },
          },
          { key: "cta", data: { title: "Proteja sua empresa", subtitle: tg, buttonText: "Falar com especialista", buttonLink: R.contact } },
        ],
      },
    },
    about: {
      templateKey: "bitdefender",
      metaTitle: `Quem Somos | ${co}`,
      metaDescription: tg,
      layoutConfig: {
        template: "bitdefender",
        sections: [
          {
            key: "hero",
            data: {
              badge: "SOBRE",
              icon: "Users",
              title: `Quem somos — ${co}`,
              subtitle: tg,
              ctaText: "Contato",
              ctaLink: R.contact,
            },
          },
          {
            key: "content",
            data: {
              html: `<p>A <strong>${co}</strong> é parceira Bitdefender com foco em proteção corporativa, implantação e suporte em português.</p><p>${tg}</p>`,
              maxWidth: "5xl",
            },
          },
          { key: "cta", data: { title: "Conheça nossas soluções", buttonText: "Ver serviços", buttonLink: R.services } },
        ],
      },
    },
    contact: {
      templateKey: "bitdefender",
      metaTitle: `Contato | ${co}`,
      metaDescription: `Fale com a ${co}.`,
      layoutConfig: {
        template: "bitdefender",
        sections: [
          {
            key: "hero",
            data: {
              badge: "CONTATO",
              icon: "Phone",
              title: "Entre em contato",
              subtitle: "Tire dúvidas sobre licenciamento, implantação e suporte.",
              ctaText: "WhatsApp",
              ctaLink: R.contact,
            },
          },
          {
            key: "content",
            data: {
              html: "<p>Use o formulário nesta página ou nossos canais. Retornamos em horário comercial.</p>",
              maxWidth: "4xl",
            },
          },
          { key: "cta", data: { title: "Pronto para começar?", subtitle: "Retornamos em horário comercial.", buttonText: "Enviar mensagem", buttonLink: R.contact } },
        ],
      },
    },
    services: {
      templateKey: "bitdefender",
      metaTitle: `Serviços | ${co}`,
      metaDescription: "Edições Bitdefender GravityZone para sua empresa.",
      layoutConfig: {
        template: "bitdefender",
        sections: [
          {
            key: "hero",
            data: {
              badge: "PRODUTOS",
              icon: "Shield",
              title: "GravityZone — escolha sua edição",
              subtitle: "Do essencial ao XDR enterprise.",
              ctaText: "Orçamento",
              ctaLink: R.contact,
            },
          },
          {
            key: "features-grid",
            data: {
              title: "Linha de produtos",
              items: [
                { icon: "Shield", title: "Business Security", description: "Antimalware corporativo para PMEs." },
                { icon: "ShieldCheck", title: "Premium", description: "EDR, HyperDetect e Sandbox." },
                { icon: "Lock", title: "Enterprise", description: "XDR e Threat Hunting." },
              ],
            },
          },
          { key: "cta", data: { title: "Qual edição é ideal?", buttonText: "Consultoria gratuita", buttonLink: R.contact } },
        ],
      },
    },
    blog: {
      templateKey: "bitdefender",
      metaTitle: `Notícias | ${co}`,
      metaDescription: "Artigos sobre segurança e TI.",
      layoutConfig: {
        template: "bitdefender",
        sections: [
          {
            key: "hero",
            data: {
              badge: "BLOG",
              icon: "Newspaper",
              title: "Notícias e ameaças em foco",
              subtitle: "Conteúdo técnico e novidades do ecossistema.",
              ctaText: "Ver publicações",
              ctaLink: R.blog,
            },
          },
        ],
      },
    },
  };
}
