export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit } from "@/lib/api-utils";
import { createTagSchema, updateTagSchema } from "@/lib/validation-schemas";

// Normalizar string para slug
function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET - Listar tags
export async function GET(request: NextRequest) {
  try {
    // Check rate limit (100 requests per minute)
    const ip = getClientIP(request);
    if (!checkRateLimit(`tags-list-${ip}`, 100, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const withCount = searchParams.get("withCount") === "true";
    const categoryId = searchParams.get("categoryId");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // Filtrar por categoria se especificado
    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }

    const tags = await prisma.blogTag.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: withCount ? {
          select: { posts: true }
        } : undefined,
        posts: withCount ? {
          take: 3,
          include: {
            post: {
              select: { id: true, title: true, status: true }
            }
          }
        } : undefined,
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, color: true }
            }
          }
        }
      }
    });

    return NextResponse.json(tags);
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST - Criar tag ou sugerir tags com IA
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (10 creates per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`tags-create-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, name, serviceType, content, title, categoryIds } = body;

    // Validate input with Zod for normal tag creation
    if (!action || action === "create") {
      try {
        createTagSchema.parse({ name });
      } catch (error) {
        return NextResponse.json(
          { error: "Dados de tag inválidos" },
          { status: 400 }
        );
      }
    }

    // Ação: Sugerir tags com IA
    if (action === "suggest") {
      const suggestions = await suggestTagsWithAI(serviceType, content, title);
      return NextResponse.json({ suggestions });
    }

    // Ação: Criar nova tag
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome da tag é obrigatório" }, { status: 400 });
    }

    // Validar categorias obrigatórias
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos uma categoria" }, { status: 400 });
    }

    const slug = normalizeSlug(name);
    
    // Verificar se já existe
    const existing = await prisma.blogTag.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Tag já existe", tag: existing }, { status: 409 });
    }

    const tag = await prisma.blogTag.create({
      data: {
        name: name.trim(),
        slug,
        categories: {
          create: categoryIds.map((categoryId: string) => ({ categoryId }))
        }
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, color: true }
            }
          }
        }
      }
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE - Remover múltiplas tags
export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit (5 deletes per minute per IP)
    const ip = getClientIP(request);
    if (!checkRateLimit(`tags-delete-${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs são obrigatórios" }, { status: 400 });
    }

    // Primeiro remover relações
    await prisma.blogPostTag.deleteMany({
      where: { tagId: { in: ids } }
    });

    // Depois remover tags
    const result = await prisma.blogTag.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    return handleAPIError(error);
  }
}

// Interface para sugestão de tag com volume
interface TagSuggestion {
  name: string;
  volume: 'alto' | 'médio' | 'baixo';
  reason: string;
}

// Função para sugerir tags com IA
async function suggestTagsWithAI(
  serviceType?: string,
  content?: string,
  title?: string
): Promise<TagSuggestion[]> {
  try {
    // Buscar tags existentes para contexto
    const existingTags = await prisma.blogTag.findMany({
      take: 50,
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } }
    });
    const existingTagNames = existingTags.map(t => `${t.name} (${t._count.posts} posts)`);

    // Extrair apenas os nomes das tags existentes para comparação
    const existingTagNamesOnly = existingTags.map(t => t.name.toLowerCase());
    
    const prompt = `Você é um especialista em SEO e marketing de conteúdo para uma empresa de TI (M3Solutions).

Contexto do conteúdo:
- Tipo de serviço: ${serviceType || "Não especificado"}
- Título: ${title || "Não especificado"}
- Conteúdo: ${content ? content.substring(0, 500) : "Não especificado"}

⚠️ TAGS QUE JÁ EXISTEM NO SISTEMA (NÃO SUGERIR ESTAS):
${existingTagNamesOnly.join(", ") || "Nenhuma"}

REGRAS IMPORTANTES:
1. NÃO sugira nenhuma tag que já existe na lista acima (nem variações com maiúsculas/minúsculas diferentes)
2. NÃO sugira tags muito similares às existentes (ex: se "Cloud" existe, não sugira "Cloud Computing")
3. Sugira APENAS tags NOVAS e DIFERENTES das existentes

Sugira 10-15 tags NOVAS e relevantes para este conteúdo, avaliando o VOLUME DE BUSCA estimado de cada uma.

Para cada tag, avalie:
- "alto": Termos genéricos muito buscados (ex: "TI", "cloud", "segurança")
- "médio": Termos específicos mas comuns (ex: "backup empresarial", "suporte técnico")
- "baixo": Termos muito específicos ou nicho (ex: "gestão NOC 24x7", "compliance LGPD")

Responda APENAS com um JSON array no formato:
[{"name": "tag1", "volume": "alto", "reason": "motivo curto"}, ...]`;

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return getStaticSuggestionsWithVolume(serviceType, title);
    }

    const response = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return getStaticSuggestionsWithVolume(serviceType, title);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    
    // Extrair JSON do texto
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const tags = JSON.parse(jsonMatch[0]);
        if (Array.isArray(tags) && tags[0]?.name) {
          // Filtrar tags que já existem (comparação case-insensitive)
          const filteredTags = tags.filter((t: any) => {
            const tagName = (t.name || t).toLowerCase().trim();
            return !existingTagNamesOnly.includes(tagName);
          });
          
          return filteredTags.slice(0, 12).map((t: any) => ({
            name: t.name || t,
            volume: t.volume || 'médio',
            reason: t.reason || ''
          }));
        }
      } catch {
        return getStaticSuggestionsWithVolume(serviceType, title);
      }
    }

    return getStaticSuggestionsWithVolume(serviceType, title);
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return getStaticSuggestionsWithVolume(serviceType, title);
  }
}

// Sugestões estáticas com volume como fallback
function getStaticSuggestionsWithVolume(serviceType?: string, title?: string): TagSuggestion[] {
  const baseTags: TagSuggestion[] = [
    { name: "TI", volume: "alto", reason: "Termo genérico muito buscado" },
    { name: "Tecnologia", volume: "alto", reason: "Ampla aplicação" },
    { name: "Empresa", volume: "alto", reason: "Contexto B2B" },
    { name: "Negócios", volume: "médio", reason: "Foco empresarial" },
    { name: "Digital", volume: "médio", reason: "Transformação digital" }
  ];
  
  const serviceBasedTags: Record<string, TagSuggestion[]> = {
    "Suporte em TI": [
      { name: "Suporte Técnico", volume: "alto", reason: "Alta demanda" },
      { name: "Help Desk", volume: "médio", reason: "Termo técnico comum" },
      { name: "Manutenção", volume: "médio", reason: "Serviço recorrente" },
      { name: "Infraestrutura", volume: "médio", reason: "Área fundamental" },
      { name: "TI Terceirizada", volume: "baixo", reason: "Nicho específico" }
    ],
    "Gestão de TI": [
      { name: "Gestão de TI", volume: "médio", reason: "Termo específico" },
      { name: "NOC", volume: "baixo", reason: "Termo técnico" },
      { name: "Monitoramento", volume: "médio", reason: "Serviço essencial" },
      { name: "ITSM", volume: "baixo", reason: "Framework específico" },
      { name: "Governança TI", volume: "baixo", reason: "Nicho corporativo" }
    ],
    "Cloud Computing": [
      { name: "Cloud", volume: "alto", reason: "Tendência forte" },
      { name: "Nuvem", volume: "alto", reason: "Termo em português" },
      { name: "AWS", volume: "médio", reason: "Líder de mercado" },
      { name: "Azure", volume: "médio", reason: "Grande provedor" },
      { name: "Migração Cloud", volume: "baixo", reason: "Processo específico" }
    ],
    "Segurança da Informação": [
      { name: "Cibersegurança", volume: "alto", reason: "Tema em alta" },
      { name: "Firewall", volume: "médio", reason: "Solução comum" },
      { name: "Antivírus", volume: "alto", reason: "Termo popular" },
      { name: "LGPD", volume: "médio", reason: "Regulamentação" },
      { name: "Proteção de Dados", volume: "médio", reason: "Preocupação atual" }
    ],
    "Consultoria de TI": [
      { name: "Consultoria", volume: "alto", reason: "Serviço amplo" },
      { name: "Projetos de TI", volume: "médio", reason: "Área comum" },
      { name: "Transformação Digital", volume: "alto", reason: "Tendência" },
      { name: "Estratégia TI", volume: "baixo", reason: "Nicho executivo" }
    ],
    "Backup": [
      { name: "Backup", volume: "alto", reason: "Necessidade básica" },
      { name: "Recuperação de Dados", volume: "médio", reason: "Serviço crítico" },
      { name: "Disaster Recovery", volume: "baixo", reason: "Termo técnico" },
      { name: "Armazenamento", volume: "médio", reason: "Infraestrutura" }
    ]
  };
  
  const serviceTags = serviceType && serviceBasedTags[serviceType] 
    ? serviceBasedTags[serviceType] 
    : [];
  
  const allTags = [...serviceTags, ...baseTags];
  const uniqueTags = allTags.filter((tag, index, self) => 
    index === self.findIndex(t => t.name === tag.name)
  );
  
  return uniqueTags.slice(0, 20);
}
