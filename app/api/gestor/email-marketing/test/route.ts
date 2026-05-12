export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            "email_marketing_api_url",
            "email_marketing_api_key",
            "email_marketing_list_id",
          ],
        },
      },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    const apiUrl = configMap["email_marketing_api_url"];
    const apiKey = configMap["email_marketing_api_key"];

    if (!apiUrl) {
      return NextResponse.json({ error: "URL da API não configurada" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const testPayload = {
      email: "teste@m3solutions.com.br",
      name: "Teste M3Solutions",
      list_id: configMap["email_marketing_list_id"] || undefined,
      test: true,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });
  } catch (error) {
    console.error("Email marketing test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao testar conexão" },
      { status: 500 }
    );
  }
}
