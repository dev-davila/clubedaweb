/**
 * Testes da ponte WhatsApp -> wizard: agregação da rajada (debounce) e flush
 * com lock otimista. Prisma e dependências externas são mockados.
 */

jest.mock("@/lib/db", () => ({
  prisma: {
    wizardInboxBuffer: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    wizardInboxMessage: { create: jest.fn() },
    evolutionInstance: { findUnique: jest.fn() },
    waConversation: { findUnique: jest.fn(), update: jest.fn() },
    waMessage: { findFirst: jest.fn(), create: jest.fn() },
  },
}));
jest.mock("@/lib/logger", () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock("@/lib/wizard/orchestrator", () => ({ advance: jest.fn() }));
jest.mock("@/lib/wizard/repository", () => ({ getActiveWhatsappSession: jest.fn() }));
jest.mock("@/lib/evolution-api", () => ({ createEvolutionClient: jest.fn() }));

const { prisma } = jest.requireMock("@/lib/db");
const { advance } = jest.requireMock("@/lib/wizard/orchestrator");
const { getActiveWhatsappSession } = jest.requireMock("@/lib/wizard/repository");
const { createEvolutionClient } = jest.requireMock("@/lib/evolution-api");
const sendText = jest.fn();
createEvolutionClient.mockReturnValue({ sendText });

const { bufferWizardInbound, flushDueBuffers, DEBOUNCE_MS } = require("@/lib/wizard/whatsapp-bridge");

beforeEach(() => {
  jest.clearAllMocks();
  createEvolutionClient.mockReturnValue({ sendText });
  // Por padrão os métodos do prisma resolvem (no real retornam Promise; o
  // caminho de erro encadeia .catch no resultado de update).
  prisma.wizardInboxBuffer.update.mockResolvedValue({});
  prisma.waConversation.update.mockResolvedValue({});
  prisma.waMessage.create.mockResolvedValue({});
});

const base = {
  instanceId: "inst1",
  remoteJid: "5511999@s.whatsapp.net",
  phone: "5511999",
};

describe("bufferWizardInbound", () => {
  it("cria buffer novo, adiciona a mensagem e agenda o flush ~DEBOUNCE_MS à frente", async () => {
    prisma.wizardInboxBuffer.findFirst.mockResolvedValue(null);
    prisma.wizardInboxBuffer.create.mockResolvedValue({ id: "b1", contactName: null, conversationId: null });

    const before = Date.now();
    await bufferWizardInbound({ ...base, content: "oi" });

    expect(prisma.wizardInboxBuffer.create).toHaveBeenCalledTimes(1);
    expect(prisma.wizardInboxMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bufferId: "b1", content: "oi" }) }),
    );
    const upd = prisma.wizardInboxBuffer.update.mock.calls[0][0];
    const flushAt = upd.data.flushAt.getTime();
    expect(flushAt).toBeGreaterThanOrEqual(before + DEBOUNCE_MS - 50);
  });

  it("reusa o buffer aberto (collecting) em vez de criar outro — agrega a rajada", async () => {
    prisma.wizardInboxBuffer.findFirst.mockResolvedValue({ id: "bX", contactName: "Zé", conversationId: "c1" });

    await bufferWizardInbound({ ...base, content: "tudo bem?" });

    expect(prisma.wizardInboxBuffer.create).not.toHaveBeenCalled();
    expect(prisma.wizardInboxMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bufferId: "bX" }) }),
    );
    expect(prisma.wizardInboxBuffer.update).toHaveBeenCalledTimes(1); // reinicia flushAt
  });

  it("ignora mensagem vazia (mídia sem legenda)", async () => {
    await bufferWizardInbound({ ...base, content: "   " });
    expect(prisma.wizardInboxBuffer.findFirst).not.toHaveBeenCalled();
    expect(prisma.wizardInboxMessage.create).not.toHaveBeenCalled();
  });
});

describe("flushDueBuffers", () => {
  it("respeita o lock otimista: se outro worker já tomou o buffer, não chama advance", async () => {
    prisma.wizardInboxBuffer.findMany.mockResolvedValue([{ id: "b1", instanceId: "inst1", remoteJid: base.remoteJid }]);
    prisma.wizardInboxBuffer.updateMany.mockResolvedValue({ count: 0 }); // perdeu a corrida

    const res = await flushDueBuffers();

    expect(advance).not.toHaveBeenCalled();
    expect(res.processed).toBe(0);
  });

  it("compila a rajada em um texto, chama advance com a sessão existente e envia a resposta", async () => {
    prisma.wizardInboxBuffer.findMany.mockResolvedValue([{ id: "b1", instanceId: "inst1", remoteJid: base.remoteJid }]);
    prisma.wizardInboxBuffer.updateMany.mockResolvedValue({ count: 1 });
    prisma.wizardInboxBuffer.findUnique.mockResolvedValue({
      id: "b1",
      instanceId: "inst1",
      remoteJid: base.remoteJid,
      phone: base.phone,
      conversationId: "c1",
      messages: [
        { content: "oi", receivedAt: new Date(1) },
        { content: "tudo bem?", receivedAt: new Date(2) },
        { content: "queria um site", receivedAt: new Date(3) },
      ],
    });
    getActiveWhatsappSession.mockResolvedValue({ id: "sess1" });
    advance.mockResolvedValue({ sessionId: "sess1", reply: "Claro! Vamos começar?" });
    prisma.evolutionInstance.findUnique.mockResolvedValue({
      instanceName: "wz",
      instanceToken: "tok",
      server: { apiUrl: "http://x", apiKey: "k" },
    });
    sendText.mockResolvedValue({ key: { id: "sent-1" } });
    prisma.waMessage.findFirst.mockResolvedValue(null);

    const res = await flushDueBuffers();

    expect(advance).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "whatsapp",
        channelRef: "5511999",
        sessionId: "sess1",
        message: "oi\ntudo bem?\nqueria um site",
      }),
    );
    expect(sendText).toHaveBeenCalledWith("wz", "tok", "5511999", "Claro! Vamos começar?");
    expect(prisma.waMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fromMe: true, content: "Claro! Vamos começar?" }) }),
    );
    expect(prisma.wizardInboxBuffer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b1" }, data: expect.objectContaining({ status: "done" }) }),
    );
    expect(res.processed).toBe(1);
  });

  it("em erro no processamento marca o buffer como error e avisa o cliente", async () => {
    prisma.wizardInboxBuffer.findMany.mockResolvedValue([{ id: "b1", instanceId: "inst1", remoteJid: base.remoteJid }]);
    prisma.wizardInboxBuffer.updateMany.mockResolvedValue({ count: 1 });
    prisma.wizardInboxBuffer.findUnique.mockResolvedValue({
      id: "b1",
      instanceId: "inst1",
      remoteJid: base.remoteJid,
      phone: base.phone,
      conversationId: "c1",
      messages: [{ content: "oi", receivedAt: new Date(1) }],
    });
    getActiveWhatsappSession.mockResolvedValue(null);
    advance.mockRejectedValue(new Error("stitch caiu"));
    prisma.evolutionInstance.findUnique.mockResolvedValue({
      instanceName: "wz",
      instanceToken: "tok",
      server: { apiUrl: "http://x", apiKey: "k" },
    });
    sendText.mockResolvedValue({ key: { id: "err-1" } });

    await flushDueBuffers();

    expect(prisma.wizardInboxBuffer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b1" }, data: expect.objectContaining({ status: "error" }) }),
    );
    // mensagem de desculpa enviada ao cliente
    expect(sendText).toHaveBeenCalledWith("wz", "tok", "5511999", expect.stringContaining("probleminha"));
  });
});
