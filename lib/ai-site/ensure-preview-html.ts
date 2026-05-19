const TAILWIND_CDN = "https://cdn.tailwindcss.com";

/** Cores extras que a IA costuma inventar — registradas no CDN via config inline. */
const TAILWIND_BOOTSTRAP = `<script>
window.tailwind = window.tailwind || {};
tailwind.config = {
  theme: {
    extend: {
      colors: {
        beige: { 50: '#faf8f5', 100: '#f5f0e8', 200: '#ebe3d5' },
        brown: { 600: '#92400e', 700: '#78350f', 800: '#5c3d2e', 900: '#442c1f' }
      }
    }
  }
};
</script>
<script src="${TAILWIND_CDN}"></script>`;

import { sanitizeStitchHtml } from "@/lib/stitch/sanitize-stitch-html";

/**
 * Garante documento HTML válido com Tailwind CDN carregando no iframe.
 */
export function ensurePreviewHtml(html: string): string {
  let doc = sanitizeStitchHtml(html.trim());
  if (!doc) return doc;

  if (!/<!DOCTYPE/i.test(doc)) {
    doc = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>\n<body>${doc}</body>\n</html>`;
  }

  if (!/<head[\s>]/i.test(doc)) {
    doc = doc.replace(/<html([^>]*)>/i, `<html$1><head><meta charset="utf-8"/></head>`);
  }

  if (!/tailwindcss\.com/i.test(doc)) {
    doc = doc.replace(/<head([^>]*)>/i, `<head$1>\n${TAILWIND_BOOTSTRAP}`);
  }
  // Não substituir CDN quando já existe tailwind.config (Stitch) — sanitize já reordenou

  if (!/<meta[^>]+viewport/i.test(doc)) {
    doc = doc.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="viewport" content="width=device-width, initial-scale=1"/>`);
  }

  return doc;
}
