export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError } from "@/lib/api-utils";
import { suggestLocationsSchema } from "@/lib/validation-schemas";

const ABACUS_API_URL = "https://apps.abacus.ai/v1/chat/completions";

// Dados de volume de pesquisa estimado por cidade/estado para serviços de TI
const VOLUME_DATA = {
  // Capitais e grandes centros - Alto volume
  high: [
    { state: 'SP', cities: ['São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba'] },
    { state: 'RJ', cities: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'] },
    { state: 'MG', cities: ['Belo Horizonte', 'Uberlândia', 'Contagem'] },
    { state: 'PR', cities: ['Curitiba', 'Londrina', 'Maringá'] },
    { state: 'RS', cities: ['Porto Alegre', 'Caxias do Sul'] },
    { state: 'BA', cities: ['Salvador'] },
    { state: 'PE', cities: ['Recife'] },
    { state: 'CE', cities: ['Fortaleza'] },
    { state: 'DF', cities: ['Brasília'] },
    { state: 'GO', cities: ['Goiânia'] },
    { state: 'SC', cities: ['Florianópolis', 'Joinville'] },
  ],
  // Cidades médias - Volume médio
  medium: [
    { state: 'SP', cities: ['Santos', 'Jundiaí', 'Piracicaba', 'Bauru', 'São José dos Campos', 'Mogi das Cruzes'] },
    { state: 'RJ', cities: ['Petrópolis', 'Campos dos Goytacazes', 'Nova Iguaçu'] },
    { state: 'MG', cities: ['Juiz de Fora', 'Montes Claros', 'Uberaba'] },
    { state: 'PR', cities: ['Ponta Grossa', 'Cascavel', 'Foz do Iguaçu'] },
    { state: 'RS', cities: ['Pelotas', 'Santa Maria', 'Canoas'] },
    { state: 'SC', cities: ['Blumenau', 'Itajaí', 'Chapecó'] },
  ]
};

export async function POST(req: NextRequest) {
  try {
    // Check rate limit (15 requests per minute for location suggestions)
    const ip = getClientIP(req);
    if (!checkRateLimit(`ai-locations-${ip}`, 15, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar requisição
    const body = await req.json();
    const validatedData = suggestLocationsSchema.parse(body);
    const { serviceType, attendanceType = 'REMOTE', pageObjective = 'CONVERSION', brand } = validatedData;

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      // Fallback: retorna sugestões baseadas em dados estáticos
      return NextResponse.json({
        suggestion: getStaticSuggestion(serviceType, attendanceType, pageObjective),
        source: 'static'
      });
    }

    // Usar IA para gerar sugestões personalizadas
    const prompt = `Você é um especialista em SEO local para empresas de TI no Brasil.

Serviço: ${serviceType}
${brand ? `Marca: ${brand}` : ''}
Tipo de Atendimento: ${attendanceType === 'REMOTE' ? 'Remoto' : attendanceType === 'LOCAL' ? 'Presencial' : 'Híbrido'}
Objetivo: ${pageObjective === 'CONVERSION' ? 'Conversão' : pageObjective === 'TRAFFIC' ? 'Tráfego' : 'Autoridade'}

Baseado no serviço e contexto, sugira as MELHORES localizações para criar páginas SEO local.

RETORNE APENAS um JSON válido neste formato exato (sem markdown):
{
  "recommendation": "Texto curto explicando a estratégia",
  "priority": "high" | "medium" | "low",
  "createGlobal": true | false,
  "states": ["SP", "RJ"],
  "cities": [
    {"state": "SP", "city": "São Paulo", "volume": "alto", "reason": "Capital e maior mercado"},
    {"state": "SP", "city": "Campinas", "volume": "alto", "reason": "Polo tecnológico"}
  ],
  "estimatedPages": 5,
  "estimatedMonthlySearches": "10.000-50.000"
}

PRIORIDADE: Capitais, polos tecnológicos e cidades com maior concentração de empresas.
LIMITE: Máximo 10 cidades sugeridas, priorizando ROI.`;

    const response = await fetch(ABACUS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return NextResponse.json({
        suggestion: getStaticSuggestion(serviceType, attendanceType, pageObjective),
        source: 'static'
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // Tentar parsear JSON da resposta
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ suggestion, source: 'ai' });
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Fallback
    return NextResponse.json({
      suggestion: getStaticSuggestion(serviceType, attendanceType, pageObjective),
      source: 'static'
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

function getStaticSuggestion(serviceType: string, attendanceType: string, pageObjective: string) {
  const isRemote = attendanceType === 'REMOTE';
  const isConversion = pageObjective === 'CONVERSION';
  
  const cities: { state: string; city: string; volume: string; reason: string }[] = [];
  const states: string[] = [];

  // Para serviços remotos, focar em capitais
  if (isRemote) {
    VOLUME_DATA.high.forEach(item => {
      if (!states.includes(item.state) && states.length < 5) {
        states.push(item.state);
        cities.push({
          state: item.state,
          city: item.cities[0],
          volume: 'alto',
          reason: 'Capital - maior volume de buscas'
        });
      }
    });
  } else {
    // Para serviços locais/híbridos, ser mais específico
    ['SP', 'RJ', 'MG', 'PR', 'RS'].forEach(state => {
      states.push(state);
      const highData = VOLUME_DATA.high.find(h => h.state === state);
      if (highData) {
        highData.cities.slice(0, 2).forEach(city => {
          cities.push({
            state,
            city,
            volume: 'alto',
            reason: city.includes('Paulo') || city.includes('Rio') ? 'Maior centro comercial' : 'Polo tecnológico regional'
          });
        });
      }
    });
  }

  return {
    recommendation: isRemote 
      ? `Para ${serviceType} com atendimento remoto, recomendamos focar nas capitais dos principais estados, onde há maior concentração de empresas buscando soluções de TI.`
      : `Para ${serviceType} com atendimento ${attendanceType === 'LOCAL' ? 'presencial' : 'híbrido'}, recomendamos criar páginas específicas para cada cidade onde há presença física ou potencial de atendimento.`,
    priority: isConversion ? 'high' : 'medium',
    createGlobal: true,
    states: states.slice(0, 5),
    cities: cities.slice(0, 10),
    estimatedPages: 1 + states.length + cities.length,
    estimatedMonthlySearches: isConversion ? '5.000-20.000' : '2.000-10.000'
  };
}
