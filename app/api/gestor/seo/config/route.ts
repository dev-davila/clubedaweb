import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ENV_PATH = path.join(process.cwd(), ".env");

async function readEnvFile(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(ENV_PATH, "utf-8");
    const lines = content.split("\n");
    const env: Record<string, string> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex);
          let value = trimmed.slice(eqIndex + 1);
          if ((value.startsWith("'") && value.endsWith("'")) || 
              (value.startsWith('"') && value.endsWith('"'))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    }
    return env;
  } catch {
    return {};
  }
}

async function writeEnvFile(env: Record<string, string>): Promise<void> {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (value.includes(" ") || value.includes("=") || value.includes("#")) {
      lines.push(`${key}='${value}'`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }
  await fs.writeFile(ENV_PATH, lines.join("\n") + "\n");
}

async function getSiteConfigValue(key: string): Promise<string | null> {
  const config = await prisma.siteConfig.findUnique({ where: { key } });
  return config?.value || null;
}

async function setSiteConfigValue(key: string, value: string, label?: string): Promise<void> {
  await prisma.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value, label, category: "seo" },
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const env = await readEnvFile();

    // Env credentials
    const googleClientId = env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || "";
    const googleClientSecret = env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || "";
    const bingApiKey = env.BING_WEBMASTER_API_KEY || "";

    // Meta tags from database
    const bingMetaTag = await getSiteConfigValue("seo_bing_meta_tag");
    const googleMetaTag = await getSiteConfigValue("seo_google_meta_tag");

    return NextResponse.json({
      googleClientId,
      googleClientSecret: googleClientSecret ? "*".repeat(20) + googleClientSecret.slice(-4) : "",
      googleConfigured: !!(googleClientId && googleClientSecret),
      bingApiKey: bingApiKey ? "*".repeat(20) + bingApiKey.slice(-4) : "",
      bingConfigured: !!bingApiKey,
      bingMetaTag: bingMetaTag || "",
      googleMetaTag: googleMetaTag || "",
    });
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { googleClientId, googleClientSecret, bingApiKey, bingMetaTag, googleMetaTag } = body;

    const env = await readEnvFile();

    // Update Google credentials
    if (googleClientId !== undefined) {
      if (googleClientId) {
        env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID = googleClientId;
      } else {
        delete env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
      }
    }

    if (googleClientSecret !== undefined) {
      if (googleClientSecret && !googleClientSecret.startsWith("*")) {
        env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET = googleClientSecret;
      } else if (!googleClientSecret) {
        delete env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
      }
    }

    // Update Bing credentials
    if (bingApiKey !== undefined) {
      if (bingApiKey && !bingApiKey.startsWith("*")) {
        env.BING_WEBMASTER_API_KEY = bingApiKey;
      } else if (!bingApiKey) {
        delete env.BING_WEBMASTER_API_KEY;
      }
    }

    await writeEnvFile(env);

    // Save meta tags to database
    if (bingMetaTag !== undefined) {
      await setSiteConfigValue("seo_bing_meta_tag", bingMetaTag, "Bing Meta Tag de Verificação");
    }
    if (googleMetaTag !== undefined) {
      await setSiteConfigValue("seo_google_meta_tag", googleMetaTag, "Google Meta Tag de Verificação");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
