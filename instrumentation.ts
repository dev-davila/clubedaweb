/**
 * Next.js instrumentation hook — roda uma vez no boot do processo (Node runtime).
 *
 * Inicia o worker que faz polling do buffer de mensagens do wizard/WhatsApp e
 * dispara o flush quando a janela de debounce vence. O buffer é persistido no
 * banco (fonte de verdade); este intervalo só faz polling de baixa latência,
 * complementado pelo cron de fallback em /api/cron/flush-wizard-whatsapp.
 */

const POLL_INTERVAL_MS = 5_000;

// Guards de módulo: evita iniciar mais de um intervalo e evita sobreposição de
// execuções (a geração via Stitch pode demorar mais que o intervalo).
let started = false;
let isFlushing = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (started) return;
  started = true;

  // Importes dinâmicos: o hook também é avaliado no runtime edge, onde estes
  // módulos (prisma) não existem.
  const { flushDueBuffers } = await import("@/lib/wizard/whatsapp-bridge");
  const { logger } = await import("@/lib/logger");

  logger.info("[wa-bridge] worker de flush iniciado (poll " + POLL_INTERVAL_MS + "ms)");

  setInterval(async () => {
    if (isFlushing) return;
    isFlushing = true;
    try {
      const { processed } = await flushDueBuffers();
      if (processed > 0) logger.info(`[wa-bridge] flush processou ${processed} buffer(s)`);
    } catch (err) {
      logger.error("[wa-bridge] erro no ciclo de flush", String(err));
    } finally {
      isFlushing = false;
    }
  }, POLL_INTERVAL_MS);
}
