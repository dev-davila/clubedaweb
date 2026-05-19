import { headers } from "next/headers";

/** Origem real do request (respeita porta 3001, proxy, etc.). */
export function previewOriginFromHeaders(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

/** Origem para links de preview em scripts CLI (dev costuma ser :3001). */
export function defaultDevOrigin(): string {
  const fromEnv = process.env.PREVIEW_ORIGIN ?? process.env.NEXTAUTH_URL;
  if (fromEnv?.trim()) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3001";
}
