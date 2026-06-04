/**
 * Next.js instrumentation hook.
 *
 * Padrão oficial: o código que usa APIs de Node (Prisma, e a cadeia do wizard
 * que puxa @google/stitch-sdk → node:path) fica num módulo separado importado
 * DENTRO do guard `NEXT_RUNTIME === 'nodejs'`. Isso faz o Next/webpack excluir
 * essa subárvore do bundle do runtime edge (onde node:path não existe).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/wizard/whatsapp-worker");
  }
}
