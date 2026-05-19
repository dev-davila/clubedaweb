const DEFAULT_MAX = 800;

function useHomeSample(): boolean {
  const v = process.env.STITCH_USE_HOME_SAMPLE;
  if (v === "0" || v === "false") return false;
  return true;
}

/** Extrai trecho leve do HTML da home (head + classes de botão) para continuidade visual. */
export function extractHtmlStyleSample(html: string, maxChars = DEFAULT_MAX): string {
  if (!html?.trim() || !useHomeSample()) return "";

  const parts: string[] = [];

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    let head = headMatch[1];
    head = head.replace(/<script[\s\S]*?<\/script>/gi, "");
    head = head.replace(/\s+/g, " ").trim();
    if (head.length > 400) head = `${head.slice(0, 400)}…`;
    parts.push(`<head>${head}</head>`);
  }

  const btnMatch = html.match(
    /<a[^>]*class="[^"]*(?:btn|button|bg-(?:amber|orange|emerald|blue|indigo|stone)[^"]*)"[^>]*>[\s\S]*?<\/a>/i,
  );
  if (btnMatch) parts.push(`<!-- CTA sample --> ${btnMatch[0].slice(0, 200)}`);

  const headerMatch = html.match(/<header[^>]*data-block="header"[^>]*>[\s\S]{0,350}?<\/header>/i);
  if (headerMatch) parts.push(headerMatch[0]);

  const joined = parts.join("\n").trim();
  if (!joined) {
    return html.replace(/\s+/g, " ").slice(0, maxChars);
  }
  return joined.slice(0, maxChars);
}

export function homeSampleMaxChars(): number {
  const n = Number(process.env.STITCH_HOME_SAMPLE_MAX ?? DEFAULT_MAX);
  return Number.isFinite(n) && n > 100 ? n : DEFAULT_MAX;
}
