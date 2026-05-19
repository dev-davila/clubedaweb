import type { RequiredPageType } from "@/lib/themes/required-pages";
import type { SitePageCopy } from "./site-content-types";
import type { WizardAnswers, WizardSnapshot } from "./types";

/** Payload persistido em `WizardSession.data`. */
export interface SessionDataPayload {
  answers: WizardAnswers;
  currentPage?: RequiredPageType | null;
  approvedPages?: RequiredPageType[];
  lastPageFeedback?: string | null;
  stitchScreenIds?: Partial<Record<RequiredPageType, string>>;
  stitchDesignSystemId?: string | null;
}

export function packSessionData(snapshot: WizardSnapshot): SessionDataPayload {
  return {
    answers: snapshot.answers,
    currentPage: snapshot.currentPage ?? null,
    approvedPages: snapshot.approvedPages ?? [],
    lastPageFeedback: snapshot.lastPageFeedback ?? null,
    stitchScreenIds: snapshot.stitchScreenIds ?? {},
    stitchDesignSystemId: snapshot.stitchDesignSystemId ?? null,
  };
}

export function unpackSessionData(raw: unknown): SessionDataPayload {
  if (!raw || typeof raw !== "object") {
    return { answers: {} };
  }
  const o = raw as Record<string, unknown>;
  if (o.answers && typeof o.answers === "object") {
    return {
      answers: o.answers as WizardAnswers,
      currentPage: (o.currentPage as RequiredPageType | null) ?? null,
      approvedPages: (o.approvedPages as RequiredPageType[]) ?? [],
      lastPageFeedback: (o.lastPageFeedback as string | null) ?? null,
      stitchScreenIds: (o.stitchScreenIds as SessionDataPayload["stitchScreenIds"]) ?? {},
      stitchDesignSystemId: (o.stitchDesignSystemId as string | null) ?? null,
    };
  }
  return { answers: raw as WizardAnswers };
}
