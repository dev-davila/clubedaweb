import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const prompt = `Você é um especialista em desenvolvimento web e UX/UI. Crie um briefing completo e detalhado para o desenvolvimento de um site baseado nas seguintes informações:

## Informações da Empresa
- Nome: ${data.companyName}
- Setor: ${data.industry}
- Descrição: ${data.companyDescription}
- Público-alvo: ${data.targetAudience}
- Concorrentes: ${data.competitors}
- Diferenciais: ${data.differentials}

## Identidade Visual
- Cor primária: ${data.primaryColor}
- Cor secundária: ${data.secondaryColor}
- Cor de destaque: ${data.accentColor}
- Tom da marca: ${data.brandTone}
- Estilo visual: ${data.visualStyle}

## Estrutura do Site
- Tipo: ${data.siteType}
- Páginas: ${data.mainPages.join(", ")}
- Recursos: ${data.features.join(", ") || "Nenhum especificado"}
- Blog: ${data.hasBlog ? "Sim" : "Não"}
- E-commerce: ${data.hasEcommerce ? "Sim" : "Não"}
- Portfólio: ${data.hasPortfolio ? "Sim" : "Não"}

## Conteúdo Base
- Hero: ${data.heroTitle} - ${data.heroSubtitle}
- CTA: ${data.ctaText}
- Sobre: ${data.aboutContent}
- Serviços: ${data.servicesDescription}
- Contato: ${data.contactInfo}

Crie um briefing profissional em formato markdown com as seguintes seções:
1. Resumo Executivo
2. Objetivos do Projeto
3. Escopo e Entregáveis
4. Arquitetura da Informação (mapa do site detalhado)
5. Wireframes Sugeridos (descrição de cada página)
6. Guia de Estilo (cores, tipografia, componentes)
7. Requisitos Técnicos
8. SEO e Performance
9. Cronograma Sugerido
10. Checklist de Lançamento

Seja detalhado e profissional.`;

    const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em desenvolvimento web, UX/UI design e gestão de projetos digitais. Crie briefings detalhados e profissionais."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const result = await response.json();
    const briefing = result.choices?.[0]?.message?.content || "";

    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("Error generating briefing:", error);
    return NextResponse.json(
      { error: "Erro ao gerar briefing" },
      { status: 500 }
    );
  }
}
