import type { StitchPipelineMode } from "@/lib/stitch/stitch-pipeline";
import type { RequiredPageType } from "@/lib/themes/required-pages";
import type { SitePageCopy } from "./site-content-types";

export const WIZARD_STATES = [
  "idle",
  "discovery", // estado único — conduzido por LLM (discovery-agent)
  "confirm_brief",
  "generating_page",
  "review_page",
  "ready_to_publish",
  "publishing",
  "published",
  "error",
] as const;

export type WizardState = (typeof WIZARD_STATES)[number];

export const DISCOVERY_STATES: WizardState[] = ["discovery"];

export interface WizardAnswers {
  // === Campos básicos (compatibilidade com fluxo antigo) ===
  companyName?: string;
  industry?: string;
  /** Mensagem principal da home — o que o visitante deve entender. */
  homePitch?: string;
  /** Ação desejada na home (orçamento, agendar, WhatsApp…). */
  mainCta?: string;
  /** Texto institucional para Sobre. */
  aboutText?: string;
  /** Site atual do cliente (referência de conteúdo/visual). */
  existingWebsite?: string;
  /** Produtos/serviços em texto livre (ideal: 3 itens). Use differentiators[] para grids estruturados. */
  offerings?: string;
  audience?: string;
  /** Bloco completo de contato (backup). */
  contactInfo?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  contactAddress?: string;
  contactHours?: string;
  tone?: string;
  colors?: string;
  /** Benchmarks — sites que admira ou concorrentes. */
  references?: string[];

  // === Campos ricos (port do stitch-advocacia) — usados para direcionamento
  // literal no prompt do Stitch quando presentes ===
  /** Dor principal do cliente que a empresa resolve (usado na headline da home). */
  mainPain?: string;
  /** Diferenciais concretos (3+ itens) — usados como feature-cards literais. */
  differentiators?: string[];
  /** Prova social. {skip:true} se o cliente declarou que não tem; senão items[] com cases/números. */
  proofPoints?: { skip?: boolean; items?: string[] };
  /** Nome do produto/serviço principal (página services). */
  productName?: string;
  /** Descrição substantiva do produto principal. */
  productDescription?: string;
  /** Objetivo de conversão do site (ex: agendar avaliação, pedir orçamento). */
  siteGoal?: string;
  /** Etapas reais do processo (2-4 passos) — usadas em "Como funciona". */
  howItWorks?: string[];
  /** Modelo de preço (texto livre — "a partir de R$X", "3 planos", etc.) */
  pricingModel?: string;
  /** FAQ real (3+ perguntas+respostas). */
  faq?: Array<{ q: string; a: string }>;
  /** Ano de fundação. */
  foundedYear?: string;
  /** Cidade/UF (separado do address para footer). */
  cityState?: string;
  /** Temas de blog. {skip:true} se não tem conteúdo; senão items[] com 3+ títulos. */
  blogTopics?: { skip?: boolean; items?: string[] };
}

export interface ExtractedTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  textLightColor: string;
  backgroundColor: string;
  surfaceColor: string;
  fontPrimary: string;
  fontHeading: string;
  borderRadius: string;
  styleType: string;
}

export type WizardSideEffect =
  | { kind: "none" }
  | { kind: "run_discovery" }
  | { kind: "start_site_build" }
  | {
      kind: "generate_page";
      pageType: RequiredPageType;
      regenerate?: boolean;
      feedback?: string;
      mode?: StitchPipelineMode;
    }
  | { kind: "publish" };

export interface WizardSnapshot {
  state: WizardState;
  answers: WizardAnswers;
  brief?: string | null;
  extractedTokens?: ExtractedTokens | null;
  previewToken?: string | null;
  errorMessage?: string | null;
  /** Página em geração ou aguardando aprovação. */
  currentPage?: RequiredPageType | null;
  /** Páginas já aprovadas pelo cliente. */
  approvedPages?: RequiredPageType[];
  /** Copy gerada uma vez para todas as páginas. */
  siteCopy?: SitePageCopy | null;
  /** Feedback da última reprovação (para regerar). */
  lastPageFeedback?: string | null;
  /** screenId Stitch por página (para edit/variants). */
  stitchScreenIds?: Partial<Record<RequiredPageType, string>>;
  stitchDesignSystemId?: string | null;
}

export interface TransitionOutcome {
  next: WizardSnapshot;
  reply: string;
  sideEffect: WizardSideEffect;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}
