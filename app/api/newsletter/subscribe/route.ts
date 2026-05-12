export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
});

// Sincronizar com sistema de email marketing externo
async function syncToEmailMarketing(email: string, name?: string | null) {
  try {
    // Buscar configurações de integração
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            "email_marketing_api_url",
            "email_marketing_api_key",
            "email_marketing_list_id",
            "email_marketing_enabled",
          ],
        },
      },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    const enabled = configMap["email_marketing_enabled"];
    const apiUrl = configMap["email_marketing_api_url"];
    const apiKey = configMap["email_marketing_api_key"];
    const listId = configMap["email_marketing_list_id"];

    if (enabled !== "true" || !apiUrl) {
      console.log("Email marketing integration not enabled or not configured");
      return { synced: false, reason: "not_configured" };
    }

    // Enviar para o sistema de email marketing
    const payload: Record<string, unknown> = {
      email,
      name: name || undefined,
    };
    if (listId) payload.list_id = listId;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`Email marketing sync failed (${response.status}):`, errorText);
      return { synced: false, reason: "api_error", status: response.status };
    }

    console.log(`Newsletter subscriber ${email} synced to email marketing`);
    return { synced: true };
  } catch (error) {
    console.error("Email marketing sync error:", error);
    return { synced: false, reason: "exception" };
  }
}

async function sendNotificationToGestores(email: string, name?: string | null) {
  try {
    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        active: true,
        categories: { hasSome: ["gestao", "marketing"] },
      },
    });

    if (recipients.length === 0) {
      console.log("No active gestores to notify about newsletter subscription");
      return;
    }

    const totalSubscribers = await prisma.newsletterSubscriber.count({
      where: { status: "ACTIVE" },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">📬 Nova Inscrição na Newsletter</h2>
        </div>
        <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <p><strong>Email:</strong> ${email}</p>
          ${name ? `<p><strong>Nome:</strong> ${name}</p>` : ""}
          <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="color: #64748b; font-size: 14px;">Total de inscritos ativos: <strong>${totalSubscribers}</strong></p>
        </div>
      </div>
    `;

    for (const recipient of recipients) {
      sendEmail({
        to: recipient.email,
        subject: `Nova inscrição na newsletter: ${email}`,
        html: htmlContent,
      }).catch((err) => console.error(`Failed to notify ${recipient.email}:`, err));
    }

    console.log(`Newsletter subscription notification sent to ${recipients.length} gestores`);
  } catch (error) {
    console.error("Error sending newsletter notification:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = subscribeSchema.parse(body);

    // Verificar se já existe
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        // Reativar
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", unsubscribedAt: null },
        });

        // Sincronizar reativação com email marketing
        syncToEmailMarketing(email.toLowerCase(), name).catch((err) =>
          console.error("Email marketing sync error:", err)
        );

        // Notificar gestores sobre reativação
        sendNotificationToGestores(email.toLowerCase(), name).catch((err) =>
          console.error("Newsletter notification error:", err)
        );

        return NextResponse.json({ success: true, message: "Inscrição reativada!" });
      }
      return NextResponse.json({ success: true, message: "Já inscrito!" });
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
      },
    });

    // Sincronizar com email marketing (fire-and-forget)
    syncToEmailMarketing(email.toLowerCase(), name).catch((err) =>
      console.error("Email marketing sync error:", err)
    );

    // Notificar gestores sobre nova inscrição
    sendNotificationToGestores(email.toLowerCase(), name).catch((err) =>
      console.error("Newsletter notification error:", err)
    );

    return NextResponse.json({ success: true, message: "Inscrito com sucesso!" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Erro ao inscrever" }, { status: 500 });
  }
}