/**
 * Sanitiza HTML para prevenir ataques XSS.
 * Usa regex-based sanitization que funciona tanto em server quanto client components.
 */

// Tags HTML permitidas
const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "blockquote", "pre", "code",
  "ul", "ol", "li",
  "a", "strong", "b", "em", "i", "u", "s", "strike", "del",
  "span", "div", "section", "article",
  "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "sub", "sup", "small", "mark",
  "iframe",
]);

// Atributos permitidos por tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  "*": new Set(["class", "id", "style", "title"]),
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  iframe: new Set(["src", "width", "height", "frameborder", "allowfullscreen", "allow"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  table: new Set(["cellpadding", "cellspacing", "border", "align", "valign", "bgcolor"]),
};

const EMAIL_EXTRA_TAGS = new Set(["table", "thead", "tbody", "tfoot", "tr", "th", "td"]);

function isAllowedAttr(tag: string, attr: string): boolean {
  const globalAttrs = ALLOWED_ATTRS["*"];
  const tagAttrs = ALLOWED_ATTRS[tag];
  return (globalAttrs?.has(attr) || false) || (tagAttrs?.has(attr) || false);
}

function sanitize(dirty: string, allowedTags: Set<string>): string {
  if (!dirty) return "";

  let html = dirty;

  // Remove script tags and their content
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "");

  // Remove javascript: protocol in attributes
  html = html.replace(/(href|src|action)\s*=\s*["']\s*javascript\s*:[^"']*["']/gi, "");

  // Remove data: protocol in src (except for images)
  html = html.replace(/src\s*=\s*["']\s*data\s*:(?!image\/)[^"']*["']/gi, "");

  // Remove vbscript: protocol
  html = html.replace(/(href|src|action)\s*=\s*["']\s*vbscript\s*:[^"']*["']/gi, "");

  // Remove <object>, <embed>, <applet>, <form>, <input>, <button>, <textarea>, <select> tags
  const dangerousTags = ["object", "embed", "applet", "form", "input", "button", "textarea", "select", "meta", "link", "base", "style"];
  for (const tag of dangerousTags) {
    const openClose = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    html = html.replace(openClose, "");
    const selfClosing = new RegExp(`<${tag}\\b[^>]*/?>`, "gi");
    html = html.replace(selfClosing, "");
  }

  // Remove unknown/disallowed tags but keep their content
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
    const tag = tagName.toLowerCase();
    if (!allowedTags.has(tag)) return "";

    // For allowed tags, filter attributes
    if (match.startsWith("</")) return match; // closing tags are fine

    return match.replace(/\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(["'][^"']*["']|[^\s>]+)/g, (attrMatch: string, attrName: string) => {
      if (isAllowedAttr(tag, attrName.toLowerCase())) return attrMatch;
      return "";
    });
  });

  return html;
}

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, ALLOWED_TAGS);
}

export function sanitizeEmailHtml(dirty: string): string {
  const emailTags = new Set([...ALLOWED_TAGS, ...EMAIL_EXTRA_TAGS]);
  return sanitize(dirty, emailTags);
}
