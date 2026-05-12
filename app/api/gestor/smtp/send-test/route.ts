export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const recipientEmail = body.email || (session.user as any)?.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: "Email do destinatário não informado" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: "[M3Solutions] Teste de Configuração SMTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">\u2705 SMTP Configurado!</h1>
          </div>
          <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              Este \u00e9 um email de teste enviado pelo sistema de configura\u00e7\u00f5es da M3Solutions.
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              Se voc\u00ea recebeu este email, a configura\u00e7\u00e3o SMTP est\u00e1 funcionando corretamente.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
              Enviado por M3Solutions CMS &bull; ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
