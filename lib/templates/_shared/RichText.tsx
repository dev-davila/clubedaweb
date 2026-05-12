import { sanitizeHtml } from "@/lib/sanitize-html";

export function RichText({ html, className }: { html?: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
