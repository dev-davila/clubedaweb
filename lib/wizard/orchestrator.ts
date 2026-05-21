import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateWizardPage } from "@/lib/stitch/generate-site";
import { assertPublishablePages, publishStitchPages } from "@/lib/stitch/published-pages";
import { injectClientLogo } from "@/lib/stitch/inject-logo";
import { replaceFakeContacts } from "@/lib/stitch/replace-contacts";
import { sanitizeStitchHtml } from "@/lib/stitch/sanitize-stitch-html";
import { standardizePageStyling } from "@/lib/stitch/share-page-styling";
import { standardizeSiteChrome } from "@/lib/stitch/standardize-chrome";
import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "@/lib/themes/required-pages";
import { ensureSiteCopy, generateSiteContent, isValidSiteCopy } from "./site-content-generator";
import { buildFallbackPageHtml } from "@/lib/stitch/fallback-page-html";
import { detectDarkMode, fallbackTokens } from "@/lib/stitch/theme-extractor";
import { detectUserColorMode } from "@/lib/wizard/design-themes";
import {
  appendMessage,
  findOrCreateSession,
  listMessages,
  newPreviewToken,
  resetSession,
  snapshotFromRow,
  updateSnapshot,
} from "./repository";
import { firstWizardPage } from "./page-flow";
import { buildPageApprovalBrief, previewUrlForPage, BOT_GREETING, CONFIRM_BRIEF_TEMPLATE } from "./prompts";
import { resolveRegenerationMode } from "./regeneration-mode";
import { serializeSessionStitchPages } from "./stitch-session-pages";
import {
  onPageReady,
  onPublished,
  onThemeGenerationFailed,
  transition,
} from "./state-machine";
import { runDiscoveryTurn, computeBriefProgress } from "./discovery-agent";
import type { ChatMessage, WizardSnapshot } from "./types";

const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000;

export interface AdvanceInput {
  userId?: string | null;
  sessionId?: string | null;
  message: string;
  channel?: "web" | "whatsapp";
  channelRef?: string | null;
  origin: string;
}

export interface AdvanceOutput {
  sessionId: string;
  reply: string;
  state: string;
  history: ChatMessage[];
  previewUrl?: string | null;
  currentPage?: string | null;
  published: boolean;
  /** 0-100% baseado em campos do brief preenchidos (usado pela UI). */
  briefProgress?: number;
}

export async function listHistory(sessionId: string): Promise<ChatMessage[]> {
  const rows = await listMessages(sessionId);
  return rows.map((r) => ({
    role: r.role as ChatMessage["role"],
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    metadata: (r.metadata as Record<string, unknown>) ?? undefined,
  }));
}

export async function ensureGreeting(sessionId: string): Promise<ChatMessage[]> {
  const existing = await listMessages(sessionId, 1);
  if (existing.length > 0) return listHistory(sessionId);
  await appendMessage(sessionId, "assistant", BOT_GREETING);
  return listHistory(sessionId);
}

async function mergeStitchPage(
  sessionId: string,
  pageType: RequiredPageType,
  html: string,
  existing: Record<string, string> | null,
): Promise<Record<string, string>> {
  const prev =
    existing && typeof existing === "object" ? { ...(existing as Record<string, string>) } : {};
  prev[pageType] = html;
  return prev;
}

async function runPageGeneration(
  sessionId: string,
  snapshot: WizardSnapshot,
  origin: string,
  pageType: RequiredPageType,
  opts: { regenerate?: boolean; feedback?: string; mode?: import("@/lib/stitch/stitch-pipeline").StitchPipelineMode },
): Promise<{ nextSnapshot: WizardSnapshot; reply: string; previewUrl: string }> {
  const row = await prisma.wizardSession.findUnique({ where: { id: sessionId } });
  let siteCopy = ensureSiteCopy(snapshot.answers, snapshot.siteCopy);
  if (!isValidSiteCopy(snapshot.siteCopy)) {
    siteCopy = ensureSiteCopy(snapshot.answers, await generateSiteContent(snapshot.answers));
  }

  const existingPages = (row?.stitchPagesCached as Record<string, string> | null) ?? {};
  const homeTokens = (row?.extractedTokens ?? snapshot.extractedTokens) as WizardSnapshot["extractedTokens"];
  const screenIds = { ...(snapshot.stitchScreenIds ?? {}) };
  const existingScreenId = screenIds[pageType] ?? row?.stitchScreenId ?? null;
  const mode =
    opts.mode ??
    (opts.regenerate
      ? resolveRegenerationMode(opts.feedback, existingScreenId)
      : "generate");

  let result;
  try {
    const homeHtmlSample = pageType === "home" ? null : (existingPages.home ?? null);
    // "template" é marca de fallback emergency anterior — não passa pro Stitch
    // (entidade não existe lá e quebra). null → Stitch cria projeto novo.
    const projectIdForStitch =
      row?.stitchProjectId && row.stitchProjectId !== "template" && !row.stitchProjectId.startsWith("fallback")
        ? row.stitchProjectId
        : null;
    result = await generateWizardPage(pageType, snapshot.answers, siteCopy, {
      existingProjectId: projectIdForStitch,
      existingScreenId: mode !== "generate" ? existingScreenId : null,
      designSystemId: snapshot.stitchDesignSystemId ?? null,
      mode,
      feedback: opts.feedback,
      homeTokens: pageType === "home" ? null : homeTokens,
      homeHtmlSample,
    });
  } catch (err) {
    logger.error("[wizard] generateWizardPage threw — emergency fallback", String(err));
    const company = snapshot.answers.companyName?.trim() || "Sua empresa";
    const tagline = snapshot.answers.industry?.trim() || "Soluções sob medida";
    const html = buildFallbackPageHtml(pageType, siteCopy, company, tagline, homeTokens);
    result = {
      pageType,
      html,
      htmlUrl: "",
      screenId: "fallback",
      provider: "fallback" as const,
      validationOk: true,
      projectId: row?.stitchProjectId ?? "fallback",
      tokens: homeTokens ?? fallbackTokens(`${company} ${tagline}`),
    };
  }

  const pagesMap = await mergeStitchPage(sessionId, pageType, result.html, existingPages);

  let previewToken = snapshot.previewToken ?? row?.previewToken;
  if (!previewToken) previewToken = newPreviewToken();
  const expires = new Date(Date.now() + PREVIEW_TTL_MS);

  screenIds[pageType] = result.screenId;

  const nextSnapshot: WizardSnapshot = {
    ...snapshot,
    siteCopy,
    currentPage: pageType,
    extractedTokens: result.tokens,
    previewToken,
    stitchScreenIds: screenIds,
    stitchDesignSystemId:
      result.designSystemId ?? snapshot.stitchDesignSystemId ?? null,
  };

  const persistExtra = {
    stitchProjectId: result.projectId,
    stitchScreenId: result.screenId,
    stitchHtmlUrl: result.htmlUrl || null,
    stitchHtmlCached: pagesMap.home?.slice(0, 200_000) ?? result.html.slice(0, 200_000),
    stitchPagesCached: serializeSessionStitchPages(pagesMap as Record<RequiredPageType, string>) as any,
    generatedContent: siteCopy as any,
    extractedTokens: result.tokens as any,
    previewToken,
    previewExpiresAt: expires,
  };

  try {
    await updateSnapshot(sessionId, nextSnapshot, persistExtra);
  } catch (err) {
    logger.error("[wizard] updateSnapshot failed — retrying without stitchPagesCached", String(err));
    await updateSnapshot(sessionId, nextSnapshot, {
      ...persistExtra,
      stitchPagesCached: undefined,
      stitchHtmlCached: result.html.slice(0, 200_000),
    });
  }

  const previewUrl = previewUrlForPage(origin, previewToken, pageType);
  const reply = buildPageApprovalBrief(pageType, snapshot.answers, previewUrl, {
    regenerated: opts.regenerate,
  });

  return { nextSnapshot, reply, previewUrl };
}

export async function advance(input: AdvanceInput): Promise<AdvanceOutput> {
  const session = await findOrCreateSession({
    userId: input.userId ?? null,
    channel: input.channel ?? "web",
    channelRef: input.channelRef ?? null,
    sessionId: input.sessionId ?? null,
  });

  await appendMessage(session.id, "user", input.message);
  await ensureGreeting(session.id);

  let snapshot = snapshotFromRow(session);
  const outcome = transition({ snapshot, message: input.message, origin: input.origin });

  let assistantReply = outcome.reply;
  let nextSnapshot: WizardSnapshot = outcome.next;
  let previewUrl: string | null = null;
  let publishedFlag = false;

  await updateSnapshot(session.id, nextSnapshot);

  const effect = outcome.sideEffect;

  if (effect.kind === "run_discovery") {
    // Chama o LLM (discovery-agent) com o histórico recente + nova mensagem.
    // O agent retorna o que extraiu pro brief e se já tem material pra fechar.
    try {
      // Histórico SEM a mensagem do user que acabou de chegar (ela vai como
      // `message` separado pro agent). E sem a mensagem final do assistant
      // (que estamos prestes a gerar).
      const fullHistory = await listHistory(session.id);
      // Remove a última user (que é a `input.message` recém-adicionada)
      // pra não duplicar — o agent consome `message` como turno atual.
      const historyTrimmed = fullHistory.slice(0, -1);

      const turn = await runDiscoveryTurn({
        message: input.message,
        history: historyTrimmed,
        answers: nextSnapshot.answers,
      });

      nextSnapshot = { ...nextSnapshot, answers: turn.answers };

      if (turn.isReady) {
        // Brief completo + cliente confirmou → transita pra confirm_brief.
        // A reply final aqui é a confirmação textual da IA + resumo do brief.
        nextSnapshot = {
          ...nextSnapshot,
          state: "confirm_brief",
        };
        // Combina a mensagem da IA + template de confirmação (mostra o brief
        // estruturado pra cliente revisar antes de gerar).
        assistantReply = `${turn.reply}\n\n---\n\n${CONFIRM_BRIEF_TEMPLATE(turn.answers)}`;
      } else {
        assistantReply = turn.reply;
      }
      await updateSnapshot(session.id, nextSnapshot);
    } catch (err) {
      logger.error("[wizard] run_discovery failed", String(err));
      assistantReply =
        "Tive um problema técnico ao processar sua resposta. Pode tentar de novo?";
    }
  } else if (effect.kind === "start_site_build") {
    const pageType = nextSnapshot.currentPage ?? firstWizardPage();
    try {
      const result = await runPageGeneration(session.id, nextSnapshot, input.origin, pageType, {});
      const post = onPageReady(result.nextSnapshot, result.reply);
      nextSnapshot = post.next;
      assistantReply = post.reply;
      previewUrl = result.previewUrl;
      await updateSnapshot(session.id, nextSnapshot);
    } catch (err) {
      logger.error("[wizard] start_site_build failed", String(err));
      const failed = onThemeGenerationFailed(nextSnapshot, "geração da página");
      nextSnapshot = failed.next;
      assistantReply = failed.reply;
      await updateSnapshot(session.id, nextSnapshot);
    }
  } else if (effect.kind === "generate_page") {
    try {
      const result = await runPageGeneration(session.id, nextSnapshot, input.origin, effect.pageType, {
        regenerate: effect.regenerate,
        feedback: effect.feedback,
        mode: effect.mode,
      });
      const post = onPageReady(result.nextSnapshot, result.reply);
      nextSnapshot = post.next;
      assistantReply = post.reply;
      previewUrl = result.previewUrl;
      await updateSnapshot(session.id, nextSnapshot);
    } catch (err) {
      logger.error("[wizard] generate_page failed", String(err));
      const failed = onThemeGenerationFailed(nextSnapshot, "geração da página");
      nextSnapshot = failed.next;
      assistantReply = failed.reply;
      await updateSnapshot(session.id, nextSnapshot);
    }
  } else if (effect.kind === "publish") {
    try {
      await applyPublished(session.id, nextSnapshot);
      const post = onPublished(nextSnapshot);
      nextSnapshot = post.next;
      assistantReply = post.reply;
      publishedFlag = true;
      await updateSnapshot(session.id, nextSnapshot, { publishedAt: new Date() });
    } catch (err) {
      logger.error("[wizard] publish failed", String(err));
      assistantReply = "Tive um problema pra publicar. Tenta de novo em alguns segundos.";
    }
  }

  await appendMessage(session.id, "assistant", assistantReply);

  const token = nextSnapshot.previewToken;
  const currentPage = nextSnapshot.currentPage;
  const resolvedPreview =
    previewUrl ??
    (token && currentPage ? previewUrlForPage(input.origin, token, currentPage) : null);

  return {
    sessionId: session.id,
    reply: assistantReply,
    state: nextSnapshot.state,
    history: await listHistory(session.id),
    previewUrl:
      nextSnapshot.state === "review_page" || nextSnapshot.state === "ready_to_publish"
        ? resolvedPreview
        : null,
    currentPage: currentPage ?? null,
    published: publishedFlag,
    briefProgress: computeBriefProgress(nextSnapshot.answers),
  };
}

export async function startSession(opts: {
  userId?: string | null;
  channel?: "web" | "whatsapp";
  origin: string;
}) {
  const session = await findOrCreateSession({
    userId: opts.userId ?? null,
    channel: opts.channel ?? "web",
  });
  await ensureGreeting(session.id);
  const snap = snapshotFromRow(session);
  const token = snap.previewToken;
  return {
    sessionId: session.id,
    state: snap.state,
    history: await listHistory(session.id),
    previewUrl:
      token && snap.currentPage
        ? previewUrlForPage(opts.origin, token, snap.currentPage)
        : token
          ? previewUrlForPage(opts.origin, token, "home")
          : null,
    currentPage: snap.currentPage ?? null,
    briefProgress: computeBriefProgress(snap.answers),
  };
}

export async function restartSession(sessionId: string) {
  await prisma.wizardMessage.deleteMany({ where: { sessionId } });
  await resetSession(sessionId);
  return ensureGreeting(sessionId);
}

/**
 * Escolhe a página cujo HTML tem o `colorMode` mais próximo do que o cliente
 * pediu. Se ele pediu dark, retorna a primeira página dark; se light, a
 * primeira light; sem preferência, retorna sempre "home" (mantém comportamento
 * anterior). Garante que a referência exista e tenha HTML.
 */
function pickReferencePage(
  pages: Record<RequiredPageType, string>,
  userMode: "dark" | "light" | null,
): RequiredPageType {
  const exists = (t: RequiredPageType) => !!pages[t]?.trim();
  if (!userMode) return exists("home") ? "home" : (REQUIRED_PAGE_TYPES.find(exists) ?? "home");
  // Stitch costuma deixar a home com hero light mesmo quando o resto do site
  // é dark. Quando o user pediu dark, prefere uma secundária antes da home;
  // quando pediu light, a home costuma ser a melhor referência.
  const order: RequiredPageType[] = userMode === "dark"
    ? ["about", "services", "contact", "blog", "home"]
    : ["home", "services", "about", "contact", "blog"];
  for (const t of order) {
    if (!exists(t)) continue;
    const isDark = detectDarkMode(pages[t]);
    if (userMode === "dark" && isDark) return t;
    if (userMode === "light" && !isDark) return t;
  }
  return exists("home") ? "home" : (REQUIRED_PAGE_TYPES.find(exists) ?? "home");
}

async function applyPublished(sessionId: string, snapshot: WizardSnapshot) {
  const row = await prisma.wizardSession.findUnique({ where: { id: sessionId } });
  // NOTA: a tabela brandTokens é consumida pelo template legado (M3/BD) — o
  // site Stitch tem CSS próprio dentro do iframe e não usa brandTokens. Não
  // escrevemos lá pra evitar contaminar o tema do template padrão.

  const pagesCached = row?.stitchPagesCached as Record<string, string> | null;
  if (pagesCached && typeof pagesCached === "object") {
    const typed = pagesCached as Record<RequiredPageType, string>;
    const check = assertPublishablePages(typed);
    if (!check.ok) {
      const parts = [
        check.missing.length ? `faltam: ${check.missing.join(", ")}` : "",
        check.tooShort.length ? `curtas: ${check.tooShort.join(", ")}` : "",
      ].filter(Boolean);
      throw new Error(`Publicação bloqueada — ${parts.join("; ")}. Aprove as 5 páginas antes.`);
    }

    let polished: Record<RequiredPageType, string> = { ...typed };
    for (const t of REQUIRED_PAGE_TYPES) {
      const html = polished[t];
      if (!html) continue;
      polished[t] = sanitizeStitchHtml(html);
    }

    // Padroniza tema (tailwind config + fontes + <style> + body class) entre
    // as 5 páginas do MESMO site, usando referência que case com o userMode.
    const userMode = detectUserColorMode(snapshot.answers.colors);
    const referenceKey = pickReferencePage(polished, userMode);
    polished = standardizePageStyling(polished, referenceKey) as Record<RequiredPageType, string>;

    // Header e footer iguais em todas as páginas (chrome único do site).
    try {
      polished = standardizeSiteChrome(polished, referenceKey);
    } catch (err) {
      // Sem header/footer detectável — segue sem padronizar
      logger.warn("[publish] standardizeSiteChrome falhou: " + String(err));
    }

    // Substitui contatos fake do Stitch pelos do briefing
    for (const t of REQUIRED_PAGE_TYPES) {
      if (polished[t]) polished[t] = replaceFakeContacts(polished[t], snapshot.answers);
    }

    // Logo do cliente — se houver siteConfig.logo_url cadastrado, injeta no
    // header. Stitch coloca um ícone material genérico que descaracteriza a
    // marca.
    const logoRow = await prisma.siteConfig.findUnique({ where: { key: "logo_url" } });
    const logoUrl = logoRow?.value?.trim() || null;
    if (logoUrl) {
      for (const t of REQUIRED_PAGE_TYPES) {
        if (polished[t]) polished[t] = injectClientLogo(polished[t], logoUrl, snapshot.answers);
      }
    }

    // Backup do publish anterior — permite rollback manual via SQL se algo
    // der errado. Salvamos em chaves _prev (uma geração de histórico só).
    try {
      const prevRows = await prisma.siteConfig.findMany({
        where: { key: { in: REQUIRED_PAGE_TYPES.map((t) => `stitch_html_${t}`) } },
      });
      for (const r of prevRows) {
        if (!r.value?.trim()) continue;
        await prisma.siteConfig.upsert({
          where: { key: `${r.key}_prev` },
          update: { value: r.value, category: "wizard" },
          create: { key: `${r.key}_prev`, value: r.value, category: "wizard", label: `${r.label ?? r.key} (anterior)` },
        });
      }
    } catch (err) {
      logger.warn("[publish] backup anterior falhou: " + String(err));
    }

    await publishStitchPages(polished);
  } else if (row?.stitchHtmlCached?.trim()) {
    await publishStitchPages({ home: row.stitchHtmlCached });
  }

  const a = snapshot.answers;
  const updates: Array<{ key: string; value: string; category?: string }> = [];
  if (a.companyName) updates.push({ key: "company_name", value: a.companyName, category: "branding" });
  if (a.industry) updates.push({ key: "tagline", value: a.industry, category: "branding" });
  if (a.contactPhone) updates.push({ key: "contact_phone", value: a.contactPhone, category: "contact" });
  if (a.contactEmail) updates.push({ key: "contact_email", value: a.contactEmail, category: "contact" });
  if (a.contactWhatsapp) updates.push({ key: "contact_whatsapp", value: a.contactWhatsapp, category: "contact" });
  if (a.contactAddress) updates.push({ key: "contact_address", value: a.contactAddress, category: "contact" });

  for (const u of updates) {
    await prisma.siteConfig.upsert({
      where: { key: u.key },
      update: { value: u.value, category: u.category ?? "branding" },
      create: { key: u.key, value: u.value, category: u.category ?? "branding" },
    });
  }
}
