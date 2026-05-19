import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "@/lib/themes/required-pages";
import type { WizardSessionRow } from "./repository";

export type SessionStitchPages = Partial<Record<RequiredPageType, string>>;

export function parseSessionStitchPages(row: WizardSessionRow | null): SessionStitchPages {
  if (!row) return {};
  const cached = row.stitchPagesCached as Record<string, string> | null;
  if (cached && typeof cached === "object") {
    const out: SessionStitchPages = {};
    for (const t of REQUIRED_PAGE_TYPES) {
      const v = cached[t];
      if (typeof v === "string" && v.trim()) out[t] = v.trim();
    }
    if (Object.keys(out).length > 0) return out;
  }
  const legacy = row.stitchHtmlCached?.trim();
  if (legacy) return { home: legacy };
  return {};
}

export function serializeSessionStitchPages(
  pages: Partial<Record<RequiredPageType, string>>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of REQUIRED_PAGE_TYPES) {
    const html = pages[t]?.trim();
    if (html) out[t] = html.slice(0, 180_000);
  }
  return out;
}

function normalizeQueryParam(
  raw: string | string[] | undefined | null,
): string | undefined {
  if (raw == null) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  const t = s?.trim();
  return t || undefined;
}

export function resolvePreviewPageType(
  raw: string | string[] | undefined | null,
): RequiredPageType | null {
  const k = normalizeQueryParam(raw)?.toLowerCase();
  if (!k) return "home";
  if ((REQUIRED_PAGE_TYPES as readonly string[]).includes(k)) {
    return k as RequiredPageType;
  }
  return null;
}
