import type { ThemeRequiredPages } from "../required-pages";
import { SITE_PAGE_ROUTES as R } from "../required-pages";

function companyCtx(companyName: string, tagline: string) {
  return { companyName, tagline };
}

export function m3RequiredPageLayouts(
  companyName: string,
  tagline: string,
): ThemeRequiredPages {
  const { companyName: co, tagline: tg } = companyCtx(companyName, tagline);

  return {
    home: {
      templateKey: "m3-base",
      metaTitle: co,
      metaDescription: tg,
      layoutConfig: {
        template: "m3-base",
        sections: [
          {
            key: "hero",
            data: {
              badge: "BEM-VINDO",
              title: co,
              subtitle: tg,
              ctaText: "Fale conosco",
              ctaLink: R.contact,
              secondaryCtaText: "Nossos serviços",
              secondaryCtaLink: R.services,
            },
          },
          {
            key: "features-grid",
            data: {
              title: "Por que escolher a gente",
              subtitle: "Soluções pensadas para o seu negócio",
              items: [
                {
                  icon: "Award",
                  title: "Experiência",
                  description: "Equipe especializada e processos maduros.",
                },
                {
                  icon: "Users",
                  title: "Parceria",
                  description: "Acompanhamento próximo em cada etapa.",
                },
                {
                  icon: "Zap",
                  title: "Agilidade",
                  description: "Respostas rápidas e entregas consistentes.",
                },
              ],
            },
          },
          { key: "cta", data: { title: "Vamos conversar?", text: tg, buttonText: "Entrar em contato", buttonLink: R.contact } },
        ],
      },
    },
    about: {
      templateKey: "m3-base",
      metaTitle: `Quem Somos | ${co}`,
      metaDescription: `Conheça a ${co}. ${tg}`,
      layoutConfig: {
        template: "m3-base",
        sections: [
          {
            key: "hero",
            data: {
              badge: "INSTITUCIONAL",
              title: `Quem somos — ${co}`,
              subtitle: tg,
              ctaText: "Fale conosco",
              ctaLink: R.contact,
            },
          },
          {
            key: "content",
            data: {
              html: `<p>A <strong>${co}</strong> atua com foco em resultados, transparência e parceria de longo prazo com nossos clientes.</p><p>${tg}</p>`,
              maxWidth: "5xl",
            },
          },
          { key: "cta", data: { title: "Quer saber mais?", buttonText: "Contato", buttonLink: R.contact } },
        ],
      },
    },
    contact: {
      templateKey: "m3-base",
      metaTitle: `Contato | ${co}`,
      metaDescription: `Entre em contato com a ${co}.`,
      layoutConfig: {
        template: "m3-base",
        sections: [
          {
            key: "hero",
            data: {
              badge: "CONTATO",
              title: "Fale conosco",
              subtitle: "Estamos prontos para ouvir você e montar a melhor proposta.",
              ctaText: "WhatsApp",
              ctaLink: R.contact,
            },
          },
          {
            key: "content",
            data: {
              html: "<p>Use o formulário nesta página ou nossos canais de atendimento. Retornamos o mais rápido possível.</p>",
              maxWidth: "4xl",
            },
          },
          { key: "cta", data: { title: "Prefere falar agora?", buttonText: "Enviar mensagem", buttonLink: R.contact } },
        ],
      },
    },
    services: {
      templateKey: "m3-base",
      metaTitle: `Serviços | ${co}`,
      metaDescription: `Conheça os serviços da ${co}.`,
      layoutConfig: {
        template: "m3-base",
        sections: [
          {
            key: "hero",
            data: {
              badge: "SERVIÇOS",
              title: "Nossas soluções",
              subtitle: "Serviços e produtos para impulsionar sua operação.",
              ctaText: "Solicitar proposta",
              ctaLink: R.contact,
            },
          },
          {
            key: "features-grid",
            data: {
              title: "O que oferecemos",
              subtitle: "Escolha a linha que faz sentido para o seu momento.",
              items: [
                { icon: "Briefcase", title: "Consultoria", description: "Diagnóstico e planejamento sob medida." },
                { icon: "Settings", title: "Operação", description: "Gestão e suporte contínuo." },
                { icon: "Shield", title: "Segurança", description: "Proteção e conformidade." },
              ],
            },
          },
          { key: "cta", data: { title: "Não encontrou o que precisa?", buttonText: "Fale com um especialista", buttonLink: R.contact } },
        ],
      },
    },
    blog: {
      templateKey: "m3-base",
      metaTitle: `Notícias | ${co}`,
      metaDescription: `Artigos e novidades da ${co}.`,
      layoutConfig: {
        template: "m3-base",
        sections: [
          {
            key: "hero",
            data: {
              badge: "BLOG",
              title: "Notícias e insights",
              subtitle: "Conteúdo sobre o mercado, tendências e boas práticas.",
              ctaText: "Ver todos os posts",
              ctaLink: R.blog,
            },
          },
          {
            key: "content",
            data: {
              html: "<p>A listagem de artigos é gerada automaticamente a partir do blog publicado no gestor.</p>",
              maxWidth: "5xl",
            },
          },
        ],
      },
    },
  };
}
