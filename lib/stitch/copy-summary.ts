import type { RequiredPageType } from "@/lib/themes/required-pages";
import type {
  BlogStylePageCopy,
  ContentStylePageCopy,
  HomeStylePageCopy,
  SitePageCopy,
} from "@/lib/wizard/site-content-types";

const COPY_SUMMARY_MAX = 800;

function trimLine(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function summarizeHome(copy: HomeStylePageCopy): string[] {
  const lines = [
    `Hero: badge="${trimLine(copy.hero.badge, 28)}" | h1="${trimLine(copy.hero.title, 80)}" | subtitle="${trimLine(copy.hero.subtitle, 120)}"`,
    `CTA: ${copy.hero.ctaText} → ${copy.hero.ctaLink}`,
  ];
  copy.features.items.slice(0, 3).forEach((item, i) => {
    lines.push(`Card ${i + 1}: ${trimLine(item.title, 36)} — ${trimLine(item.description, 100)}`);
  });
  lines.push(`CTA final: ${trimLine(copy.cta.title, 60)} | botão ${copy.cta.buttonText}`);
  return lines;
}

function summarizeContentStyle(copy: ContentStylePageCopy): string[] {
  return [
    `Hero: ${trimLine(copy.hero.title, 80)}`,
    `Content: ${trimLine(copy.content.title, 60)} — ${trimLine(copy.content.paragraphs[0] ?? "", 140)}`,
    `CTA: ${copy.cta.buttonText}`,
  ];
}

function summarizeBlog(copy: BlogStylePageCopy): string[] {
  return [
    `Hero: ${trimLine(copy.hero.title, 80)}`,
    `Intro: ${trimLine(copy.content.paragraphs[0] ?? copy.content.title, 160)}`,
  ];
}

/** Textos resumidos por bloco (sem JSON completo). */
export function copySummaryForPrompt(
  pageType: RequiredPageType,
  copy?: SitePageCopy,
): string {
  if (!copy) return "";
  const page = copy[pageType];
  if (!page) return "";

  let lines: string[] = [];
  if (pageType === "home" || pageType === "services") {
    lines = summarizeHome(page as HomeStylePageCopy);
  } else if (pageType === "blog") {
    lines = summarizeBlog(page as BlogStylePageCopy);
  } else {
    lines = summarizeContentStyle(page as ContentStylePageCopy);
  }

  const body = lines.join("\n");
  const capped = body.length > COPY_SUMMARY_MAX ? body.slice(0, COPY_SUMMARY_MAX) : body;

  return [`## Textos (use nos blocos correspondentes)`, capped].join("\n");
}
