import { marked } from "marked";

// Configurar marked com opções seguras
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Converte Markdown para HTML usando a biblioteca 'marked'.
 * Suporta: headings, links, imagens, tabelas, listas, código, blockquotes, etc.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  try {
    const result = marked.parse(markdown);
    if (typeof result === "string") return result;
    return "";
  } catch {
    return markdown;
  }
}
