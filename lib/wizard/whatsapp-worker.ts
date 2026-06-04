/**
 * Worker do buffer wizard/WhatsApp — SÓ é importado pelo instrumentation hook
 * quando NEXT_RUNTIME === 'nodejs' (ver instrumentation.ts). Por isso pode
 * importar livremente a cadeia Node (Prisma, orchestrator → stitch-sdk) sem
 * quebrar o bundle do runtime edge.
 *
 * Faz polling do banco a cada POLL_INTERVAL_MS e dispara o flush das janelas de
 * debounce vencidas. Complementado pelo cron de fallback
 * (/api/cron/flush-wizard-whatsapp) para o caso de reinício no meio de uma janela.
 */
import { flushDueBuffers } from "./whatsapp-bridge";
import { logger } from "@/lib/logger";

const POLL_INTERVAL_MS = 5_000;

// Guards de módulo: o módulo é avaliado uma vez por processo. `isFlushing` evita
// sobreposição de execuções (a geração via Stitch pode demorar mais que o poll).
let isFlushing = false;

logger.info(`[wa-bridge] worker de flush iniciado (poll ${POLL_INTERVAL_MS}ms)`);

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
