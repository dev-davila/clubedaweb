import type { RequiredPageType } from "@/lib/themes/required-pages";

export function previewUrlForPage(origin: string, token: string, page: RequiredPageType): string {
  const base = `${origin.replace(/\/$/, "")}/preview/${token}`;
  return page === "home" ? base : `${base}?page=${page}`;
}
