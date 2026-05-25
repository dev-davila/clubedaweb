/**
 * Reescreve o ano do copyright no footer pro ano corrente.
 *
 * O Stitch hardcoda "© 2024" (ou o ano do training dele) no footer gerado.
 * Como nunca reescrevemos o HTML salvo, fica desatualizado. Esta função roda
 * no render e atualiza qualquer "© YYYY" / "&copy; YYYY" / "Copyright YYYY"
 * pro ano atual. Idempotente.
 *
 * Só toca em anos plausíveis (2000-2099) pra não mexer em números soltos.
 */

export function applyDynamicYear(html: string): string {
  const year = new Date().getFullYear().toString();

  return html.replace(
    /(©|&copy;|Copyright|&#169;)(\s*)(20\d{2})/gi,
    (_m, symbol: string, space: string) => `${symbol}${space}${year}`,
  );
}
