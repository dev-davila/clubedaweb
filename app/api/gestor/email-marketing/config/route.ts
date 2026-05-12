export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const CONFIG_KEYS = [
  "email_marketing_enabled",
  "email_marketing_api_url",
  "email_marketing_api_key",
  "email_marketing_list_id",
  "contact_marketing_enabled",
  "contact_marketing_api_url",
  "contact_marketing_api_key",
  "contact_marketing_list_id",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: CONFIG_KEYS } },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      // Mascarar API key parcialmente
      if ((c.key === "email_marketing_api_key" || c.key === "contact_marketing_api_key") && c.value) {
        configMap[c.key] = c.value.length > 8
          ? c.value.substring(0, 4) + "****" + c.value.substring(c.value.length - 4)
          : "****";
      } else {
        configMap[c.key] = c.value;
      }
    }

    return NextResponse.json(configMap);
  } catch (error) {
    console.error("Error fetching email marketing config:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    for (const key of CONFIG_KEYS) {
      if (body[key] !== undefined) {
        // Se a api_key veio mascarada, não atualizar
        if ((key === "email_marketing_api_key" || key === "contact_marketing_api_key") && body[key]?.includes("****")) {
          continue;
        }

        await prisma.siteConfig.upsert({
          where: { key },
          create: {
            key,
            value: String(body[key]),
            label: getLabel(key),
            category: "integrations",
          },
          update: { value: String(body[key]) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating email marketing config:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

function getLabel(key: string): string {
  const labels: Record<string, string> = {
    email_marketing_enabled: "Email Marketing Newsletter Ativo",
    email_marketing_api_url: "URL da API Newsletter",
    email_marketing_api_key: "Chave da API Newsletter",
    email_marketing_list_id: "ID da Lista Newsletter",
    contact_marketing_enabled: "Email Marketing Contato Ativo",
    contact_marketing_api_url: "URL da API Contato",
    contact_marketing_api_key: "Chave da API Contato",
    contact_marketing_list_id: "ID da Lista Contato",
  };
  return labels[key] || key;
}
