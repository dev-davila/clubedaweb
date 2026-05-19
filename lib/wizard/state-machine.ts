import {
  CONFIRM_BRIEF_TEMPLATE,
  ERROR_GENERIC,
  GENERATING_PAGE_MESSAGE,
  PUBLISHED_MESSAGE,
  buildReadyToPublishMessage,
} from "./prompts";
import { discoveryGreeting } from "./discovery-agent";
import { resolveRegenerationMode } from "./regeneration-mode";
import { allPagesApproved, firstWizardPage, nextPageAfter } from "./page-flow";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import type {
  TransitionOutcome,
  WizardSnapshot,
} from "./types";

const AFFIRMATIVE = /\b(sim|s|claro|ok|okay|beleza|bora|vamos|pode|aprovado|aprovar|publicar)\b/i;
const NEGATIVE = /\b(n|nao|não|revisar|nope)\b/i;
const CANCEL_SESSION = /\b(cancelar|descartar)\b/i;
const APPROVE_PAGE = /\b(aprovar|aprovado|aprova|ok|sim|gostei|perfeito|seguir|próxim|proxim)\b/i;
const REGENERATE_PAGE = /\b(outra versão|outra versao|regerar|gerar outr|não gostei|nao gostei|mudar|ajustar|refazer)\b/i;
const VARIANT_PAGE = /\b(variante|variant|variação|variacao|opção b|opcao b|outro visual|outra opção|outra opcao)\b/i;
const PUBLISH_CMD = /\b(publicar|colocar no ar|publica)\b/i;

export function initialSnapshot(): WizardSnapshot {
  return {
    state: "idle",
    answers: {},
    approvedPages: [],
    currentPage: null,
  };
}

export interface TransitionInput {
  snapshot: WizardSnapshot;
  message: string;
  origin?: string;
}

export function transition({ snapshot, message, origin }: TransitionInput): TransitionOutcome {
  const trimmed = message.trim();

  switch (snapshot.state) {
    case "idle": {
      if (AFFIRMATIVE.test(trimmed) || /\bvamos\b/i.test(trimmed)) {
        // Transita pra discovery e devolve só a primeira pergunta hardcoded
        // (greeting). A partir da próxima mensagem, o LLM (discovery-agent)
        // assume a condução da conversa.
        return {
          next: { ...snapshot, state: "discovery", approvedPages: [] },
          reply: discoveryGreeting(),
          sideEffect: { kind: "none" },
        };
      }
      return {
        next: snapshot,
        reply: 'Quando quiser começar, manda **vamos** ou **sim**.',
        sideEffect: { kind: "none" },
      };
    }

    case "discovery": {
      // Discovery é conduzido pelo LLM (discovery-agent). A state-machine só
      // sinaliza pro orchestrator chamar o agent — a reply real e a possível
      // transição pra confirm_brief acontecem lá.
      return {
        next: snapshot,
        reply: "",
        sideEffect: { kind: "run_discovery" },
      };
    }

    case "confirm_brief": {
      if (AFFIRMATIVE.test(trimmed)) {
        const first = firstWizardPage();
        return {
          next: {
            ...snapshot,
            state: "generating_page",
            currentPage: first,
            approvedPages: snapshot.approvedPages ?? [],
            errorMessage: null,
            lastPageFeedback: null,
          },
          reply: GENERATING_PAGE_MESSAGE(first, snapshot.answers.industry),
          sideEffect: { kind: "start_site_build" },
        };
      }
      if (NEGATIVE.test(trimmed)) {
        return {
          next: { ...snapshot, state: "discovery" },
          reply: "Sem problema, vamos ajustar — me diz o que quer mudar.",
          sideEffect: { kind: "run_discovery" },
        };
      }
      return {
        next: snapshot,
        reply: "Responda **sim** para gerar a Home ou **revisar** para mudar o briefing.",
        sideEffect: { kind: "none" },
      };
    }

    case "generating_page": {
      return {
        next: snapshot,
        reply: `Ainda gerando **${snapshot.currentPage ?? "a página"}**… aguarde.`,
        sideEffect: { kind: "none" },
      };
    }

    case "review_page": {
      const current = snapshot.currentPage;
      if (!current) {
        return {
          next: { ...snapshot, state: "error", errorMessage: "missing page" },
          reply: ERROR_GENERIC,
          sideEffect: { kind: "none" },
        };
      }

      if (CANCEL_SESSION.test(trimmed)) {
        return {
          next: initialSnapshot(),
          reply: "Sessão encerrada. Manda **vamos** quando quiser recomeçar.",
          sideEffect: { kind: "none" },
        };
      }

      if (
        REGENERATE_PAGE.test(trimmed) ||
        VARIANT_PAGE.test(trimmed) ||
        (NEGATIVE.test(trimmed) && !APPROVE_PAGE.test(trimmed))
      ) {
        const wantsVariant = VARIANT_PAGE.test(trimmed);
        const screenId = snapshot.stitchScreenIds?.[current];
        return {
          next: {
            ...snapshot,
            state: "generating_page",
            lastPageFeedback: trimmed,
          },
          reply:
            GENERATING_PAGE_MESSAGE(current, snapshot.answers.industry) +
            (wantsVariant
              ? "\n\n_Gerando variante visual (mesmo conteúdo, novo estilo)…_"
              : trimmed.length > 3
                ? `\n\n_Anotado: ${trimmed.slice(0, 200)}_`
                : ""),
          sideEffect: {
            kind: "generate_page",
            pageType: current,
            regenerate: true,
            feedback: wantsVariant
              ? "Gere uma variante visual alternativa mantendo os mesmos textos e data-blocks."
              : trimmed,
            mode: wantsVariant
              ? "variant"
              : resolveRegenerationMode(trimmed, screenId),
          },
        };
      }

      if (APPROVE_PAGE.test(trimmed)) {
        const approved = [...(snapshot.approvedPages ?? [])];
        if (!approved.includes(current)) approved.push(current);

        const nextPage = nextPageAfter(current);
        if (nextPage) {
          return {
            next: {
              ...snapshot,
              state: "generating_page",
              currentPage: nextPage,
              approvedPages: approved,
              lastPageFeedback: null,
            },
            reply: GENERATING_PAGE_MESSAGE(nextPage, snapshot.answers.industry),
            sideEffect: { kind: "generate_page", pageType: nextPage },
          };
        }

        const token = snapshot.previewToken;
        const readyReply =
          token && origin
            ? buildReadyToPublishMessage(origin, token)
            : "Todas as páginas aprovadas! Responda **publicar** para colocar no ar.";

        return {
          next: {
            ...snapshot,
            state: "ready_to_publish",
            approvedPages: approved,
            currentPage: null,
          },
          reply: readyReply,
          sideEffect: { kind: "none" },
        };
      }

      return {
        next: snapshot,
        reply:
          "Nesta etapa: **aprovar** (próxima página), **outra versão** ou **variante** (visual alternativo), ajuste curto (ex.: \"escureça o hero\") ou **cancelar**.",
        sideEffect: { kind: "none" },
      };
    }

    case "ready_to_publish": {
      if (PUBLISH_CMD.test(trimmed)) {
        return {
          next: { ...snapshot, state: "publishing" },
          reply: "Publicando todas as páginas aprovadas…",
          sideEffect: { kind: "publish" },
        };
      }
      const adjustMatch = trimmed.match(/ajustar\s+(home|sobre|about|contato|contact|servi[cç]os|services|blog)/i);
      if (adjustMatch) {
        const page = mapAdjustKeyword(adjustMatch[1]);
        if (page) {
          return {
            next: {
              ...snapshot,
              state: "generating_page",
              currentPage: page,
              lastPageFeedback: trimmed,
            },
            reply: GENERATING_PAGE_MESSAGE(page, snapshot.answers.industry),
            sideEffect: {
              kind: "generate_page",
              pageType: page,
              regenerate: true,
              feedback: trimmed,
              mode: resolveRegenerationMode(trimmed, snapshot.stitchScreenIds?.[page]),
            },
          };
        }
      }
      return {
        next: snapshot,
        reply: "Responda **publicar** ou **ajustar** + página (ex.: ajustar home).",
        sideEffect: { kind: "none" },
      };
    }

    case "publishing": {
      return {
        next: snapshot,
        reply: "Publicando… um instante.",
        sideEffect: { kind: "none" },
      };
    }

    case "published": {
      return {
        next: snapshot,
        reply: 'Site no ar. Para refazer tudo, use **Reiniciar** ou manda **vamos** em nova sessão.',
        sideEffect: { kind: "none" },
      };
    }

    case "error": {
      if (AFFIRMATIVE.test(trimmed)) {
        const pageType = snapshot.currentPage ?? firstWizardPage();
        return {
          next: {
            ...snapshot,
            state: "generating_page",
            currentPage: pageType,
            errorMessage: null,
          },
          reply:
            GENERATING_PAGE_MESSAGE(pageType, snapshot.answers.industry) +
            "\n\n_Retomando a geração por IA._",
          sideEffect: { kind: "generate_page", pageType },
        };
      }
      return { next: snapshot, reply: ERROR_GENERIC, sideEffect: { kind: "none" } };
    }

    default:
      return { next: snapshot, reply: ERROR_GENERIC, sideEffect: { kind: "none" } };
  }
}

function mapAdjustKeyword(word: string): RequiredPageType | null {
  const w = word.toLowerCase();
  if (w === "home") return "home";
  if (w === "sobre" || w === "about") return "about";
  if (w === "contato" || w === "contact") return "contact";
  if (w.startsWith("serv") || w === "services") return "services";
  if (w === "blog") return "blog";
  return null;
}

export function onPageReady(
  snapshot: WizardSnapshot,
  reply: string,
): TransitionOutcome {
  return {
    next: { ...snapshot, state: "review_page" },
    reply,
    sideEffect: { kind: "none" },
  };
}

export function onThemeGenerationFailed(
  snapshot: WizardSnapshot,
  reason: string,
): TransitionOutcome {
  return {
    next: { ...snapshot, state: "error", errorMessage: reason },
    reply: `Não consegui gerar agora (${reason}). Manda **sim** para tentar de novo.`,
    sideEffect: { kind: "none" },
  };
}

export function onPublished(snapshot: WizardSnapshot): TransitionOutcome {
  return {
    next: { ...snapshot, state: "published" },
    reply: PUBLISHED_MESSAGE,
    sideEffect: { kind: "none" },
  };
}
