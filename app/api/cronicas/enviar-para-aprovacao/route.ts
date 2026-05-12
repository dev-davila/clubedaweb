import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Função para limpar conteúdo de markdown/html artifacts
function cleanContent(content: string): string {
  return content
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// POST: Enviar email com crônicas pendentes para aprovação do cliente
export async function POST(request: NextRequest) {
  try {
    // Buscar crônicas pendentes
    const chronicles = await prisma.chronicle.findMany({
      where: { status: "pending_review" },
      include: {
        article: { include: { site: true } },
        category: true,
        author: true
      },
      orderBy: { createdAt: "desc" }
    });

    if (chronicles.length === 0) {
      return NextResponse.json({ 
        error: "Nenhuma crônica pendente para enviar" 
      }, { status: 400 });
    }

    // Buscar destinatários ativos
    const recipients = await prisma.chronicleRecipient.findMany({
      where: { active: true }
    });

    if (recipients.length === 0) {
      return NextResponse.json({ 
        error: "Nenhum destinatário cadastrado. Adicione destinatários em Crônicas → Destinatários" 
      }, { status: 400 });
    }

    // Gerar token de aprovação (válido por 7 dias)
    const tokenValue = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.approvalToken.create({
      data: {
        token: tokenValue,
        expiresAt
      }
    });

    const baseUrl = getSiteUrl();
    const approvalUrl = `${baseUrl}/cronicas/aprovacao/${tokenValue}`;

    // Montar HTML das crônicas
    const chroniclesHtml = chronicles.map((chronicle, index) => {
      const cleanedContent = cleanContent(chronicle.content);
      
      return `
      <tr>
        <td style="padding: 0; border-bottom: 1px solid #e5e7eb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <tr>
              <td style="padding: 20px;">
                <!-- Número e Título -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 32px; vertical-align: top;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 28px; height: 28px; background-color: #f97316; border-radius: 14px; color: white; font-weight: bold; font-size: 14px; text-align: center;">
                            ${index + 1}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="padding-left: 12px;">
                      <span style="font-weight: bold; color: #1e40af; font-size: 18px; line-height: 1.4;">
                        ${chronicle.title}
                      </span>
                    </td>
                  </tr>
                </table>
                
                <!-- Conteúdo Preview -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0;">
                  <tr>
                    <td style="color: #444444; font-size: 14px; line-height: 1.7; padding: 15px; background-color: #f8fafc; border-left: 3px solid #3b82f6;">
                      ${cleanedContent.substring(0, 350)}${cleanedContent.length > 350 ? '...' : ''}
                    </td>
                  </tr>
                </table>
                
                <!-- Metadados -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                  <tr>
                    <td>
                      <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px;">
                        Fonte: ${chronicle.article?.site?.name || 'N/A'}
                      </span>
                      ${chronicle.category ? `
                        <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px;">
                          ${chronicle.category.name}
                        </span>
                      ` : '<span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px;">Sem categoria</span>'}
                      <span style="display: inline-block; background-color: #f3f4f6; color: #666666; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                        Por ${chronicle.author?.name || 'Márcio Petito'}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `}).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #f97316; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">Cronicas para Aprovacao</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                      ${chronicles.length} cronica(s) aguardando sua revisao
                    </p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Ola!<br><br>
                      As cronicas abaixo foram geradas e estao prontas para sua <strong>revisao e aprovacao</strong>.
                      Clique no botao abaixo para acessar a pagina de aprovacao.
                    </p>
                    
                    <!-- Main CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background-color: #16a34a; border-radius: 8px;">
                                <a href="${approvalUrl}" 
                                   style="display: inline-block; color: #ffffff; padding: 16px 40px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                  Revisar e Aprovar Cronicas
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <h3 style="color: #f97316; margin: 30px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #fed7aa; font-size: 18px;">
                      Resumo das Cronicas:
                    </h3>
                    
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px;">
                      ${chroniclesHtml}
                    </table>
                    
                    <!-- Tip Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                      <tr>
                        <td style="background-color: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px 20px;">
                          <p style="color: #0369a1; margin: 0; font-size: 14px;">
                            <strong>Dica:</strong> Na pagina de aprovacao voce podera definir a categoria e se cada cronica sera publicada nas redes sociais.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Link expiration notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                      <tr>
                        <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 13px;">
                            Este link de aprovacao e valido por 7 dias.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1e3a5f; padding: 25px; text-align: center;">
                    <p style="color: #ffffff; margin: 0; font-size: 14px;">
                      M3Solutions - Sistema de Cronicas Automatizadas
                    </p>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px;">
                      Este email foi enviado automaticamente. Nao responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Enviar para todos os destinatários
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const result = await sendEmail({
          to: recipient.email,
          subject: `${chronicles.length} Cronicas Aguardando Sua Aprovacao`,
          html: emailHtml,
        });

        if (result.success) {
          emailsSent++;
          console.log(`Email sent to ${recipient.email}`);
        } else {
          emailsFailed++;
          errors.push(`${recipient.email}: ${result.error}`);
          console.error(`Failed to send to ${recipient.email}:`, result.error);
        }
      } catch (err: any) {
        emailsFailed++;
        errors.push(`${recipient.email}: ${err.message}`);
        console.error(`Error sending to ${recipient.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      chroniclesCount: chronicles.length,
      emailsSent,
      emailsFailed,
      recipients: recipients.map(r => r.email),
      errors: errors.length > 0 ? errors : undefined,
      message: `Email enviado para ${emailsSent} destinatario(s) com ${chronicles.length} cronica(s)`
    });

  } catch (error: any) {
    console.error("Error sending approval email:", error);
    return NextResponse.json({ 
      error: "Erro ao enviar email", 
      details: error.message 
    }, { status: 500 });
  }
}