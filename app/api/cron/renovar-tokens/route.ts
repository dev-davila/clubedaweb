export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Chave secreta para proteger o endpoint (configure no .env)
const CRON_SECRET = process.env.CRON_SECRET;

interface RenewalResult {
  platform: string;
  accountName: string | null;
  success: boolean;
  message: string;
  newExpiry?: string;
}

// POST - Renovar tokens de redes sociais
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const results: RenewalResult[] = [];
    const failures: RenewalResult[] = [];
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    // Buscar contas que expiram em 5 dias ou menos
    const accountsToRenew = await prisma.socialMediaAccount.findMany({
      where: {
        isConnected: true,
        active: true,
        expiresAt: {
          lte: fiveDaysFromNow
        }
      }
    });

    console.log(`[CRON] Encontradas ${accountsToRenew.length} contas para renovar`);

    for (const account of accountsToRenew) {
      try {
        let renewalResult: RenewalResult;

        switch (account.platform) {
          case "facebook":
            renewalResult = await renewFacebookToken(account);
            break;
          case "instagram":
            renewalResult = await renewInstagramToken(account);
            break;
          case "linkedin":
            renewalResult = await renewLinkedInToken(account);
            break;
          case "twitter":
            renewalResult = await renewTwitterToken(account);
            break;
          default:
            renewalResult = {
              platform: account.platform,
              accountName: account.accountName,
              success: false,
              message: "Plataforma não suportada"
            };
        }

        results.push(renewalResult);
        
        if (!renewalResult.success) {
          failures.push(renewalResult);
        }

      } catch (error: any) {
        const errorResult: RenewalResult = {
          platform: account.platform,
          accountName: account.accountName,
          success: false,
          message: error.message || "Erro desconhecido"
        };
        results.push(errorResult);
        failures.push(errorResult);

        // Atualizar lastError no banco
        await prisma.socialMediaAccount.update({
          where: { id: account.id },
          data: { lastError: error.message }
        });
      }
    }

    // Se houver falhas, enviar email de notificação
    if (failures.length > 0) {
      await sendFailureNotification(failures);
    }

    return NextResponse.json({
      success: true,
      message: `Processadas ${results.length} contas`,
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: failures.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[CRON] Erro geral:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Verificar status das contas (sem renovar)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const now = new Date();
    const accounts = await prisma.socialMediaAccount.findMany({
      where: { active: true },
      select: {
        platform: true,
        accountName: true,
        isConnected: true,
        expiresAt: true,
        lastError: true,
        updatedAt: true
      }
    });

    const status = accounts.map(acc => ({
      platform: acc.platform,
      accountName: acc.accountName,
      isConnected: acc.isConnected,
      expiresAt: acc.expiresAt,
      daysUntilExpiry: acc.expiresAt 
        ? Math.ceil((acc.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      lastError: acc.lastError,
      lastUpdated: acc.updatedAt
    }));

    return NextResponse.json({
      success: true,
      accounts: status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  }
}

// ===== FUNÇÕES DE RENOVAÇÃO POR PLATAFORMA =====

async function renewFacebookToken(account: any): Promise<RenewalResult> {
  const appIdConfig = await prisma.siteConfig.findFirst({ where: { key: "facebook_app_id" } });
  const appSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "facebook_app_secret" } });

  if (!appIdConfig?.value || !appSecretConfig?.value) {
    return {
      platform: "facebook",
      accountName: account.accountName,
      success: false,
      message: "Credenciais do Facebook não configuradas"
    };
  }

  // Usar refreshToken (user token) para gerar novo long-lived token
  const tokenToRefresh = account.refreshToken || account.accessToken;
  
  const url = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appIdConfig.value);
  url.searchParams.set("client_secret", appSecretConfig.value);
  url.searchParams.set("fb_exchange_token", tokenToRefresh);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || "Falha na renovação";
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: { lastError: errorMsg }
    });
    return {
      platform: "facebook",
      accountName: account.accountName,
      success: false,
      message: errorMsg
    };
  }

  // Calcular nova expiração (~60 dias)
  const expiresIn = data.expires_in || 5184000;
  const newExpiry = new Date(Date.now() + expiresIn * 1000);

  // Se temos page token, precisamos atualizar também
  if (account.accountId) {
    // Buscar novo page token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,access_token&access_token=${data.access_token}`
    );
    const pagesData = await pagesResponse.json();
    const page = pagesData.data?.find((p: any) => p.id === account.accountId);
    
    if (page) {
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: {
          accessToken: page.access_token,
          refreshToken: data.access_token,
          expiresAt: newExpiry,
          lastError: null,
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: {
          refreshToken: data.access_token,
          expiresAt: newExpiry,
          lastError: null,
          updatedAt: new Date()
        }
      });
    }
  } else {
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.access_token,
        expiresAt: newExpiry,
        lastError: null,
        updatedAt: new Date()
      }
    });
  }

  return {
    platform: "facebook",
    accountName: account.accountName,
    success: true,
    message: "Token renovado com sucesso",
    newExpiry: newExpiry.toISOString()
  };
}

async function renewInstagramToken(account: any): Promise<RenewalResult> {
  // Instagram usa a mesma API do Facebook
  const appIdConfig = await prisma.siteConfig.findFirst({ where: { key: "instagram_app_id" } });
  const appSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "instagram_app_secret" } });

  if (!appIdConfig?.value || !appSecretConfig?.value) {
    return {
      platform: "instagram",
      accountName: account.accountName,
      success: false,
      message: "Credenciais do Instagram não configuradas"
    };
  }

  const tokenToRefresh = account.refreshToken || account.accessToken;
  
  const url = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appIdConfig.value);
  url.searchParams.set("client_secret", appSecretConfig.value);
  url.searchParams.set("fb_exchange_token", tokenToRefresh);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || "Falha na renovação";
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: { lastError: errorMsg }
    });
    return {
      platform: "instagram",
      accountName: account.accountName,
      success: false,
      message: errorMsg
    };
  }

  const expiresIn = data.expires_in || 5184000;
  const newExpiry = new Date(Date.now() + expiresIn * 1000);

  await prisma.socialMediaAccount.update({
    where: { id: account.id },
    data: {
      refreshToken: data.access_token,
      expiresAt: newExpiry,
      lastError: null,
      updatedAt: new Date()
    }
  });

  return {
    platform: "instagram",
    accountName: account.accountName,
    success: true,
    message: "Token renovado com sucesso",
    newExpiry: newExpiry.toISOString()
  };
}

async function renewLinkedInToken(account: any): Promise<RenewalResult> {
  const clientIdConfig = await prisma.siteConfig.findFirst({ where: { key: "linkedin_client_id" } });
  const clientSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "linkedin_client_secret" } });

  if (!clientIdConfig?.value || !clientSecretConfig?.value) {
    return {
      platform: "linkedin",
      accountName: account.accountName,
      success: false,
      message: "Credenciais do LinkedIn não configuradas"
    };
  }

  if (!account.refreshToken) {
    return {
      platform: "linkedin",
      accountName: account.accountName,
      success: false,
      message: "Refresh token não disponível - reconexão manual necessária"
    };
  }

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: clientIdConfig.value,
      client_secret: clientSecretConfig.value
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error || "Falha na renovação";
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: { lastError: errorMsg }
    });
    return {
      platform: "linkedin",
      accountName: account.accountName,
      success: false,
      message: errorMsg
    };
  }

  const expiresIn = data.expires_in || 5184000;
  const newExpiry = new Date(Date.now() + expiresIn * 1000);

  await prisma.socialMediaAccount.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || account.refreshToken,
      expiresAt: newExpiry,
      lastError: null,
      updatedAt: new Date()
    }
  });

  return {
    platform: "linkedin",
    accountName: account.accountName,
    success: true,
    message: "Token renovado com sucesso",
    newExpiry: newExpiry.toISOString()
  };
}

async function renewTwitterToken(account: any): Promise<RenewalResult> {
  const clientIdConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_client_id" } });
  const clientSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_client_secret" } });

  if (!clientIdConfig?.value) {
    return {
      platform: "twitter",
      accountName: account.accountName,
      success: false,
      message: "Client ID do Twitter não configurado"
    };
  }

  if (!account.refreshToken) {
    return {
      platform: "twitter",
      accountName: account.accountName,
      success: false,
      message: "Refresh token não disponível - reconexão manual necessária"
    };
  }

  // Twitter usa Basic Auth com client_id:client_secret
  const basicAuth = Buffer.from(
    `${clientIdConfig.value}:${clientSecretConfig?.value || ""}`
  ).toString("base64");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: clientIdConfig.value
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error || "Falha na renovação";
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: { lastError: errorMsg }
    });
    return {
      platform: "twitter",
      accountName: account.accountName,
      success: false,
      message: errorMsg
    };
  }

  // Twitter access token expira em ~2 horas, refresh token é permanente
  const expiresIn = data.expires_in || 7200;
  const newExpiry = new Date(Date.now() + expiresIn * 1000);

  await prisma.socialMediaAccount.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || account.refreshToken,
      expiresAt: newExpiry,
      lastError: null,
      updatedAt: new Date()
    }
  });

  return {
    platform: "twitter",
    accountName: account.accountName,
    success: true,
    message: "Token renovado com sucesso",
    newExpiry: newExpiry.toISOString()
  };
}

// ===== NOTIFICAÇÃO DE FALHAS =====

async function sendFailureNotification(failures: RenewalResult[]) {
  try {
    const appUrl = getSiteUrl();
    const reconnectUrl = `${appUrl}/gestor/redes-sociais`;
    
    const failureRows = failures.map(f => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${f.platform.charAt(0).toUpperCase() + f.platform.slice(1)}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${f.accountName || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #dc2626;">${f.message}</td>
      </tr>
    `).join("");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
          ⚠️ Falha na Renovação de Tokens
        </h2>
        
        <p style="color: #374151; font-size: 14px;">
          A renovação automática de tokens falhou para as seguintes contas de redes sociais:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left;">Plataforma</th>
              <th style="padding: 12px; text-align: left;">Conta</th>
              <th style="padding: 12px; text-align: left;">Erro</th>
            </tr>
          </thead>
          <tbody>
            ${failureRows}
          </tbody>
        </table>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Ação necessária:</strong> Acesse o painel de redes sociais e reconecte as contas manualmente.
          </p>
        </div>
        
        <a href="${reconnectUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Reconectar Contas
        </a>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Gerado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: "gestores@m3solutions.com.br",
      subject: `[ALERTA] Falha na renovação de ${failures.length} token(s) de redes sociais`,
      html: htmlBody,
    });

    console.log("[CRON] Email de notificação enviado:", result);

  } catch (error) {
    console.error("[CRON] Erro ao enviar email de notificação:", error);
  }
}