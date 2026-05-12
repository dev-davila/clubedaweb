export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { z } from "zod";
import { checkRateLimit, getClientIP } from "@/lib/api-utils";

const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  cnpj: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Mensagem é obrigatória"),
  _hp: z.string().optional(), // honeypot
  _ts: z.number().optional(), // timestamp
});

async function syncContactToEmailMarketing(contact: { name: string; email: string; phone?: string | null; company?: string | null; subject?: string | null }) {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            "contact_marketing_api_url",
            "contact_marketing_api_key",
            "contact_marketing_list_id",
            "contact_marketing_enabled",
          ],
        },
      },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    if (configMap["contact_marketing_enabled"] !== "true" || !configMap["contact_marketing_api_url"]) {
      console.log("Contact email marketing integration not enabled or not configured");
      return;
    }

    const payload: Record<string, unknown> = {
      email: contact.email,
      name: contact.name,
      phone: contact.phone || undefined,
      company: contact.company || undefined,
      source: "contact_form",
    };
    const listId = configMap["contact_marketing_list_id"];
    if (listId) payload.list_id = listId;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = configMap["contact_marketing_api_key"];
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(configMap["contact_marketing_api_url"], {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`Contact email marketing sync failed (${response.status}):`, errorText);
    } else {
      console.log(`Contact ${contact.email} synced to email marketing`);
    }
  } catch (error) {
    console.error("Contact email marketing sync error:", error);
  }
}

async function sendNotificationToGestores(contact: { name: string; email: string; phone?: string | null; company?: string | null; subject?: string | null; message: string }) {
  try {
    // Buscar destinatários gestores ativos
    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        active: true,
        categories: { hasSome: ["gestao", "comercial"] },
      },
      select: { email: true, name: true },
    });

    if (recipients.length === 0) {
      console.log("No active gestao/comercial notification recipients found");
      return;
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
          <h2 style="color: #000000; margin: 0; font-size: 18px;">📩 Novo Contato pelo Site</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px; vertical-align: top;">Nome:</td>
              <td style="padding: 8px 0; color: #4b5563;">${contact.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${contact.email}" style="color: #7c3aed;">${contact.email}</a></td>
            </tr>
            ${contact.phone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Telefone:</td><td style="padding: 8px 0; color: #4b5563;">${contact.phone}</td></tr>` : ""}
            ${contact.company ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Empresa:</td><td style="padding: 8px 0; color: #4b5563;">${contact.company}</td></tr>` : ""}
            ${contact.subject ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Assunto:</td><td style="padding: 8px 0; color: #4b5563;">${contact.subject}</td></tr>` : ""}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0 0 4px 0; font-weight: bold; color: #374151; font-size: 13px;">Mensagem:</p>
            <p style="margin: 0; color: #4b5563; white-space: pre-wrap; line-height: 1.5;">${contact.message}</p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">
            Recebido em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · <a href="${process.env.NEXTAUTH_URL || "https://www.m3solutions.com.br"}/gestor/contatos" style="color: #7c3aed;">Ver no painel</a>
          </p>
        </div>
      </div>
    `;

    const subjectLine = contact.subject
      ? `Novo contato: ${contact.subject} — ${contact.name}`
      : `Novo contato de ${contact.name} pelo site`;

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: subjectLine,
          html: htmlBody,
        });
      } catch (err) {
        console.error(`Failed to send notification to ${recipient.email}:`, err);
      }
    }
  } catch (error) {
    console.error("Error sending contact notifications:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting por IP: máx 5 envios por 15 minutos
    const ip = getClientIP(request);
    if (!checkRateLimit(`contact:${ip}`, 5, 15 * 60 * 1000)) {
      console.warn(`[SPAM] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = contactSchema.parse(body);

    // 2. Honeypot: se o campo oculto foi preenchido, é bot
    if (data._hp) {
      console.warn(`[SPAM] Honeypot triggered from IP: ${ip}`);
      // Retornar sucesso falso para não alertar o bot
      return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso!" }, { status: 201 });
    }

    // 3. Timestamp: rejeitar envios muito rápidos (< 3 segundos)
    if (data._ts) {
      const elapsed = Date.now() - data._ts;
      if (elapsed < 3000) {
        console.warn(`[SPAM] Submission too fast (${elapsed}ms) from IP: ${ip}`);
        return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso!" }, { status: 201 });
      }
    }

    // 4. Rate limiting por email: máx 3 envios por hora
    if (!checkRateLimit(`contact:email:${data.email.toLowerCase()}`, 3, 60 * 60 * 1000)) {
      console.warn(`[SPAM] Email rate limit for: ${data.email}`);
      return NextResponse.json(
        { success: false, message: "Você já enviou mensagens recentemente. Aguarde um pouco." },
        { status: 429 }
      );
    }

    const contact = await prisma.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        company: data.company?.trim() || null,
        cnpj: data.cnpj?.trim() || null,
        subject: data.subject?.trim() || null,
        message: data.message.trim(),
      },
    });

    // Sincronizar com email marketing (fire-and-forget)
    syncContactToEmailMarketing({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      subject: contact.subject,
    }).catch((err) => console.error("Contact marketing sync error:", err));

    // Enviar notificação por email para gestores (fire-and-forget)
    sendNotificationToGestores({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      subject: contact.subject,
      message: contact.message,
    }).catch((err) => console.error("Notification error:", err));

    return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso!" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]?.message || "Dados inválidos";
      return NextResponse.json({ success: false, message: firstError }, { status: 400 });
    }
    console.error("Contact form error:", error);
    return NextResponse.json({ success: false, message: "Erro ao enviar mensagem. Tente novamente." }, { status: 500 });
  }
}