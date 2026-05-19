import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { packSessionData, unpackSessionData } from "./session-data";
import { isValidSiteCopy } from "./site-content-generator";
import type { SitePageCopy } from "./site-content-types";
import type { ExtractedTokens, WizardSnapshot, WizardState } from "./types";
import { WIZARD_STATES } from "./types";

const LEGACY_STATE_MAP: Record<string, WizardState> = {
  preview: "ready_to_publish",
  generating: "generating_page",
};

export function normalizeWizardState(state: string): WizardState {
  if ((WIZARD_STATES as readonly string[]).includes(state)) {
    return state as WizardState;
  }
  return LEGACY_STATE_MAP[state] ?? "idle";
}

/** Evita 500 quando o JWT referencia usuário apagado (ex.: após migrate reset). */
export async function resolveWizardUserId(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return row?.id ?? null;
}

export interface WizardSessionRow {
  id: string;
  userId: string | null;
  channel: string;
  channelRef: string | null;
  state: string;
  data: any;
  brief: string | null;
  stitchProjectId: string | null;
  stitchScreenId: string | null;
  stitchHtmlUrl: string | null;
  stitchHtmlCached: string | null;
  stitchPagesCached: any;
  extractedTokens: any;
  generatedContent: any;
  previewToken: string | null;
  previewExpiresAt: Date | null;
  publishedAt: Date | null;
  errorMessage: string | null;
}

export function snapshotFromRow(row: WizardSessionRow): WizardSnapshot {
  const packed = unpackSessionData(row.data);
  return {
    state: normalizeWizardState(row.state),
    answers: packed.answers,
    brief: row.brief,
    extractedTokens: (row.extractedTokens ?? null) as ExtractedTokens | null,
    previewToken: row.previewToken,
    errorMessage: row.errorMessage,
    currentPage: packed.currentPage ?? null,
    approvedPages: packed.approvedPages ?? [],
    lastPageFeedback: packed.lastPageFeedback ?? null,
    siteCopy: isValidSiteCopy(row.generatedContent) ? row.generatedContent : null,
    stitchScreenIds: packed.stitchScreenIds ?? {},
    stitchDesignSystemId: packed.stitchDesignSystemId ?? null,
  };
}

export async function findOrCreateSession(opts: {
  userId?: string | null;
  channel?: "web" | "whatsapp";
  channelRef?: string | null;
  sessionId?: string | null;
}) {
  const userId = await resolveWizardUserId(opts.userId);

  if (opts.sessionId) {
    const row = await prisma.wizardSession.findUnique({ where: { id: opts.sessionId } });
    if (row) return row;
  }
  // For web: reuse the most recent active session of this user if it exists and is not in a terminal state.
  if (userId && opts.channel === "web") {
    const recent = await prisma.wizardSession.findFirst({
      where: {
        userId,
        channel: "web",
        state: { notIn: ["published"] },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (recent) return recent;
  }
  return prisma.wizardSession.create({
    data: {
      userId,
      channel: opts.channel ?? "web",
      channelRef: opts.channelRef ?? null,
      state: "idle",
      data: packSessionData({ state: "idle", answers: {} }) as any,
    },
  });
}

export async function appendMessage(sessionId: string, role: "user" | "assistant" | "system", content: string, metadata?: Record<string, unknown>) {
  return prisma.wizardMessage.create({
    data: {
      sessionId,
      role,
      content,
      metadata: (metadata ?? undefined) as any,
    },
  });
}

export async function listMessages(sessionId: string, limit = 50) {
  return prisma.wizardMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function updateSnapshot(sessionId: string, snapshot: WizardSnapshot, extra?: Partial<WizardSessionRow>) {
  return prisma.wizardSession.update({
    where: { id: sessionId },
    data: {
      state: snapshot.state,
      data: packSessionData(snapshot) as any,
      brief: snapshot.brief ?? null,
      extractedTokens: (snapshot.extractedTokens ?? null) as any,
      errorMessage: snapshot.errorMessage ?? null,
      ...(extra ?? {}),
    },
  });
}

export function newPreviewToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function findByPreviewToken(token: string) {
  return prisma.wizardSession.findUnique({ where: { previewToken: token } });
}

export async function resetSession(sessionId: string) {
  return prisma.wizardSession.update({
    where: { id: sessionId },
    data: {
      state: "idle",
      data: {},
      brief: null,
      stitchProjectId: null,
      stitchScreenId: null,
      stitchHtmlUrl: null,
      stitchHtmlCached: null,
      stitchPagesCached: undefined,
      extractedTokens: null as any,
      previewToken: null,
      previewExpiresAt: null,
      errorMessage: null,
    },
  });
}
