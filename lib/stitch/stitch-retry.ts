import { logger } from "@/lib/logger";

const RETRYABLE_CODES = new Set(["RATE_LIMITED", "NETWORK_ERROR", "UNKNOWN_ERROR"]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stitchErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "UNKNOWN_ERROR";
}

export async function withStitchRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const code = stitchErrorCode(err);
      if (!RETRYABLE_CODES.has(code) || i >= maxRetries) throw err;
      const delay = i === 0 ? 2_000 : 5_000;
      logger.warn(`[stitch] ${label} retry ${i + 1} after ${code}`, { delay });
      await sleep(delay);
    }
  }
  throw last;
}
