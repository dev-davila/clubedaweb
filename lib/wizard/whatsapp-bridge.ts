/**
 * Ponte entre o WhatsApp (Evolution API) e o wizard gerador de sites.
 *
 * O brasileiro manda a conversa em rajada ("oi" / "tudo bem?" / "queria um
 * site"). Em vez de processar cada mensagem isolada (e gerar várias respostas
 * fora de ordem), juntamos a rajada numa janela de debounce (~20s) e só então
 * chamamos `orchestrator.advance()` uma única vez com o texto compilado.
 *
 * O buffer é PERSISTIDO no banco (WizardInboxBuffer/WizardInboxMessage) para
 * sobreviver a reinício de processo; o disparo da janela vem do worker em
 * `instrumentation.ts` (polling) com fallback no cron.
 *
 * Roteamento: só instâncias com `purpose = "wizard"` passam por aqui — o
 * atendimento padrão (lib/ai-agent.ts) continua intacto nas demais.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createEvolutionClient } from "@/lib/evolution-api";
import { advance } from "./orchestrator";
import { getActiveWhatsappSession } from "./repository";

/** Janela de agregação: cada nova mensagem reinicia a contagem. */
export const DEBOUNCE_MS = 20_000;

/** Quantos buffers vencidos processar por ciclo do worker. */
const FLUSH_BATCH = 10;

export interface BufferInboundParams {
  instanceId: string;
  remoteJid: string;
  phone: string;
  content: string;
  externalMsgId?: string | null;
  mediaType?: string;
  contactName?: string | null;
  conversationId?: string | null;
}

/**
 * Adiciona uma mensagem recebida ao buffer do contato e (re)agenda o flush.
 * Chamado pelo webhook em fire-and-forget — retorna rápido.
 */
export async function bufferWizardInbound(params: BufferInboundParams): Promise<void> {
  const content = (params.content || "").trim();
  if (!content) return; // mídia sem legenda / vazio — nada a agregar

  const flushAt = new Date(Date.now() + DEBOUNCE_MS);

  // Janela aberta deste contato, se houver.
  const existing = await prisma.wizardInboxBuffer.findFirst({
    where: { instanceId: params.instanceId, remoteJid: params.remoteJid, status: "collecting" },
    orderBy: { createdAt: "desc" },
  });

  const buffer =
    existing ??
    (await prisma.wizardInboxBuffer.create({
      data: {
        instanceId: params.instanceId,
        remoteJid: params.remoteJid,
        phone: params.phone,
        contactName: params.contactName ?? null,
        conversationId: params.conversationId ?? null,
        status: "collecting",
        flushAt,
      },
    }));

  await prisma.wizardInboxMessage.create({
    data: {
      bufferId: buffer.id,
      content,
      externalMsgId: params.externalMsgId ?? null,
      mediaType: params.mediaType ?? "text",
    },
  });

  // Reinicia a janela e atualiza dados de contato que possam ter chegado depois.
  await prisma.wizardInboxBuffer.update({
    where: { id: buffer.id },
    data: {
      flushAt,
      contactName: params.contactName ?? buffer.contactName,
      conversationId: params.conversationId ?? buffer.conversationId,
    },
  });
}

/**
 * Processa todas as janelas cujo tempo de debounce já venceu.
 * Idempotente e seguro para rodar concorrente (lock otimista por status).
 */
export async function flushDueBuffers(): Promise<{ processed: number }> {
  const due = await prisma.wizardInboxBuffer.findMany({
    where: { status: "collecting", flushAt: { lte: new Date() } },
    orderBy: { flushAt: "asc" },
    take: FLUSH_BATCH,
  });

  let processed = 0;
  for (const buffer of due) {
    // Lock otimista: só quem conseguir virar collecting->processing processa.
    const claimed = await prisma.wizardInboxBuffer.updateMany({
      where: { id: buffer.id, status: "collecting" },
      data: { status: "processing" },
    });
    if (claimed.count === 0) continue;

    try {
      await processBuffer(buffer.id);
      processed++;
    } catch (err) {
      logger.error(`[wa-bridge] flush falhou para buffer ${buffer.id}`, String(err));
      await prisma.wizardInboxBuffer
        .update({
          where: { id: buffer.id },
          data: { status: "error", errorMessage: String(err).slice(0, 500) },
        })
        .catch(() => {});
      // Best-effort: avisa o cliente para não ficar no vácuo.
      await safeSendReply(
        buffer.instanceId,
        buffer.remoteJid,
        "Tive um probleminha aqui pra processar sua mensagem 😅 Pode me mandar de novo?",
      ).catch(() => {});
    }
  }

  return { processed };
}

async function processBuffer(bufferId: string): Promise<void> {
  const buffer = await prisma.wizardInboxBuffer.findUnique({
    where: { id: bufferId },
    include: { messages: { orderBy: { receivedAt: "asc" } } },
  });
  if (!buffer) return;

  const compiled = buffer.messages
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n");

  if (!compiled) {
    await prisma.wizardInboxBuffer.update({ where: { id: bufferId }, data: { status: "done" } });
    return;
  }

  // Reusa a sessão de wizard em andamento deste telefone, se houver.
  const existingSession = await getActiveWhatsappSession(buffer.phone);

  const result = await advance({
    channel: "whatsapp",
    channelRef: buffer.phone,
    sessionId: existingSession?.id ?? null,
    message: compiled,
    origin: process.env.NEXTAUTH_URL ?? "",
  });
  // advance() já persistiu WizardMessage dos dois lados (user compilado + assistant).

  if (result.reply) {
    const sentId = await safeSendReply(buffer.instanceId, buffer.remoteJid, result.reply);
    await persistBotMessage(buffer, result.reply, sentId);
  }

  await prisma.wizardInboxBuffer.update({
    where: { id: bufferId },
    data: { status: "done", wizardSessionId: result.sessionId },
  });
}

/**
 * Garante o "lado do bot" no painel de comunicação (WaMessage fromMe). O webhook
 * `send.message` normalmente também grava isso, então deduplicamos por messageId.
 */
async function persistBotMessage(
  buffer: { instanceId: string; remoteJid: string; conversationId: string | null },
  reply: string,
  messageId?: string | null,
): Promise<void> {
  try {
    let conversationId = buffer.conversationId;
    if (!conversationId) {
      const conv = await prisma.waConversation.findUnique({
        where: { instanceId_remoteJid: { instanceId: buffer.instanceId, remoteJid: buffer.remoteJid } },
        select: { id: true },
      });
      conversationId = conv?.id ?? null;
    }
    if (!conversationId) return;

    if (messageId) {
      const existing = await prisma.waMessage.findFirst({
        where: { messageId, conversationId },
        select: { id: true },
      });
      if (existing) return; // webhook send.message já gravou
    }

    await prisma.waMessage.create({
      data: {
        messageId: messageId ?? `wizard-${buffer.instanceId}-${Date.now()}`,
        conversationId,
        fromMe: true,
        content: reply,
        mediaType: "text",
        timestamp: new Date(),
        status: "sent",
      },
    });
    await prisma.waConversation.update({
      where: { id: conversationId },
      data: { lastMessage: reply, lastMessageAt: new Date() },
    });
  } catch (err) {
    logger.error("[wa-bridge] persistBotMessage falhou", String(err));
  }
}

/**
 * Envia o texto via Evolution API. Retorna o messageId enviado (se a API
 * devolver) para dedup. Replica o padrão de `lib/ai-agent.ts` sendReply.
 */
async function safeSendReply(
  instanceId: string,
  remoteJid: string,
  text: string,
): Promise<string | null> {
  const instance = await prisma.evolutionInstance.findUnique({
    where: { id: instanceId },
    include: { server: true },
  });
  if (!instance || !instance.instanceToken) {
    logger.error("[wa-bridge] instância sem token, não enviou:", instanceId);
    return null;
  }
  const client = createEvolutionClient({ apiUrl: instance.server.apiUrl, apiKey: instance.server.apiKey });
  const number = remoteJid.split("@")[0];
  const sent = await client.sendText(instance.instanceName, instance.instanceToken, number, text);
  return sent?.key?.id ?? null;
}
