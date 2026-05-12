import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateSelectionEmailHtml } from "@/lib/cronicas/email-templates";

export const dynamic = "force-dynamic";

// Generate a random token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Webhook chamado pelo daemon de monitoramento
export async function POST(request: NextRequest) {
  try {
    // Validar API key do daemon
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (apiKey !== process.env.DAEMON_API_KEY && apiKey !== process.env.ABACUSAI_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "send_selection_email") {
      // Contar artigos pendentes
      const pendingCount = await prisma.collectedArticle.count({
        where: { status: "pending" }
      });

      if (pendingCount === 0) {
        return NextResponse.json({ 
          success: true, 
          message: "Nenhum artigo pendente para enviar" 
        });
      }

      // Buscar destinatários ativos
      const recipients = await prisma.chronicleRecipient.findMany({
        where: { active: true }
      });

      if (recipients.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: "Nenhum destinatário ativo" 
        });
      }

      // Criar token de seleção (válido por 48 horas)
      const token = generateToken();
      await prisma.selectionToken.create({
        data: {
          token,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      });

      const baseUrl = getSiteUrl();
      const selectionUrl = `${baseUrl}/cronicas/selecao/${token}`;

      // Buscar últimos artigos para preview
      const previewArticles = await prisma.collectedArticle.findMany({
        where: { status: "pending" },
        include: { site: true },
        orderBy: { collectedAt: "desc" },
        take: 8
      });

      const emailHtml = generateSelectionEmailHtml(
        pendingCount,
        selectionUrl,
        previewArticles.map(a => ({
          title: a.title,
          siteName: a.site.name,
          collectedAt: a.collectedAt
        }))
      );

      // Enviar para todos os destinatários
      let sent = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          const result = await sendEmail({
            to: recipient.email,
            subject: `${pendingCount} Novos Artigos para Cronicas`,
            html: emailHtml,
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            console.error(`Failed to send to ${recipient.email}:`, result.error);
          }
        } catch (err) {
          failed++;
          console.error(`Error sending to ${recipient.email}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        pendingArticles: pendingCount,
        emailsSent: sent,
        emailsFailed: failed,
        selectionUrl
      });
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });

  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Erro no webhook" },
      { status: 500 }
    );
  }
}

// GET para health check
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    timestamp: new Date().toISOString() 
  });
}