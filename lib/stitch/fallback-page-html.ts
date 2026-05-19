import { SITE_PAGE_ROUTES, type RequiredPageType } from "@/lib/themes/required-pages";
import type { ExtractedTokens } from "@/lib/wizard/types";
import type {
  BlogStylePageCopy,
  ContentStylePageCopy,
  HomeStylePageCopy,
  SitePageCopy,
} from "@/lib/wizard/site-content-types";

const MAX_HTML = 180_000;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildNav(company: string): string {
  return `<header data-block="header" class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="${SITE_PAGE_ROUTES.home}" class="font-bold text-gray-900">${esc(company)}</a>
    <nav class="hidden md:flex gap-6 text-sm text-gray-600">
      <a href="${SITE_PAGE_ROUTES.home}">Início</a>
      <a href="${SITE_PAGE_ROUTES.services}">Serviços</a>
      <a href="${SITE_PAGE_ROUTES.about}">Sobre</a>
      <a href="${SITE_PAGE_ROUTES.blog}">Blog</a>
      <a href="${SITE_PAGE_ROUTES.contact}">Contato</a>
    </nav>
    <a href="${SITE_PAGE_ROUTES.contact}" class="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white">Fale conosco</a>
  </div>
</header>`;
}

function buildFooter(company: string, tagline: string): string {
  return `<footer data-block="footer" class="bg-gray-900 text-gray-300 py-12">
  <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-sm">
    <div><p class="font-semibold text-white">${esc(company)}</p><p class="mt-2">${esc(tagline)}</p></div>
    <div><p class="font-semibold text-white mb-2">Links</p>
      <a class="block" href="${SITE_PAGE_ROUTES.services}">Serviços</a>
      <a class="block" href="${SITE_PAGE_ROUTES.about}">Sobre</a>
      <a class="block" href="${SITE_PAGE_ROUTES.blog}">Blog</a></div>
    <div><p class="font-semibold text-white mb-2">Contato</p><a href="${SITE_PAGE_ROUTES.contact}">Fale conosco</a></div>
  </div>
  <p class="text-center text-xs text-gray-500 mt-8">© ${new Date().getFullYear()} ${esc(company)}</p>
</footer>`;
}

function heroSection(
  hero: HomeStylePageCopy["hero"] | ContentStylePageCopy["hero"],
  anchorId = "top",
): string {
  const secondary =
    hero.secondaryCtaText && hero.secondaryCtaLink
      ? `<a href="${esc(hero.secondaryCtaLink)}" class="px-5 py-3 rounded-lg border border-gray-300 text-gray-800">${esc(hero.secondaryCtaText)}</a>`
      : "";
  return `<section data-block="hero" id="${anchorId}" class="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
  <div class="max-w-4xl mx-auto text-center">
    <span class="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase mb-4">${esc(hero.badge)}</span>
    <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">${esc(hero.title)}</h1>
    <p class="text-lg text-gray-600 mb-8">${esc(hero.subtitle)}</p>
    <div class="flex flex-wrap gap-4 justify-center">
      <a href="${esc(hero.ctaLink)}" class="px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold">${esc(hero.ctaText)}</a>
      ${secondary}
    </div>
  </div>
</section>`;
}

function featuresSection(features: HomeStylePageCopy["features"]): string {
  const cards = features.items
    .slice(0, 3)
    .map(
      (item) =>
        `<article data-block="feature-card" class="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
      <p class="text-2xl mb-3">◆</p>
      <h3 class="font-bold text-gray-900 mb-2">${esc(item.title)}</h3>
      <p class="text-sm text-gray-600">${esc(item.description)}</p>
    </article>`,
    )
    .join("\n");
  return `<section data-block="features-grid" id="servicos" class="py-16 px-6 bg-white">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-center text-gray-900 mb-2">${esc(features.title)}</h2>
    ${features.subtitle ? `<p class="text-center text-gray-600 mb-10">${esc(features.subtitle)}</p>` : "<div class=\"mb-10\"></div>"}
    <div class="grid md:grid-cols-3 gap-6">${cards}</div>
  </div>
</section>`;
}

function contentSection(content: ContentStylePageCopy["content"] | BlogStylePageCopy["content"]): string {
  const paras = content.paragraphs.map((p) => `<p class="mb-4 text-gray-600 leading-relaxed">${esc(p)}</p>`).join("");
  return `<section data-block="content" class="py-16 px-6">
  <div class="max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">${esc(content.title)}</h2>
    <div class="prose">${paras}</div>
  </div>
</section>`;
}

function ctaSection(cta: HomeStylePageCopy["cta"], id = "contato"): string {
  return `<section data-block="cta" id="${id}" class="py-16 px-6 bg-blue-600 text-white">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-3xl font-bold mb-4">${esc(cta.title)}</h2>
    <p class="mb-8 opacity-90">${esc(cta.text)}</p>
    <a href="${esc(cta.buttonLink)}" class="inline-block px-6 py-3 rounded-lg bg-white text-blue-700 font-semibold">${esc(cta.buttonText)}</a>
  </div>
</section>`;
}

function wrapDocument(body: string, title: string, tokens?: ExtractedTokens | null): string {
  const primary = tokens?.primaryColor ?? "#2563eb";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>:root { --primary: ${primary}; } .bg-blue-600 { background-color: var(--primary) !important; }</style>
</head>
<body class="font-sans antialiased text-gray-900 bg-white">
${body}
</body>
</html>`.slice(0, MAX_HTML);
}

export function buildFallbackPageHtml(
  pageType: RequiredPageType,
  copy: SitePageCopy,
  company: string,
  tagline: string,
  tokens?: ExtractedTokens | null,
): string {
  const nav = buildNav(company);
  const footer = buildFooter(company, tagline);
  let main = "";

  switch (pageType) {
    case "home": {
      const p = copy.home;
      main = heroSection(p.hero) + featuresSection(p.features) + ctaSection(p.cta);
      break;
    }
    case "about": {
      const p = copy.about;
      main = heroSection(p.hero) + contentSection(p.content) + ctaSection(p.cta);
      break;
    }
    case "contact": {
      const p = copy.contact;
      main = heroSection(p.hero) + contentSection(p.content) + ctaSection(p.cta, "form");
      break;
    }
    case "services": {
      const p = copy.services;
      main = heroSection(p.hero) + featuresSection(p.features) + ctaSection(p.cta);
      break;
    }
    case "blog": {
      const p = copy.blog;
      main = heroSection(p.hero) + contentSection(p.content);
      break;
    }
  }

  const titles: Record<RequiredPageType, string> = {
    home: company,
    about: `Quem somos | ${company}`,
    contact: `Contato | ${company}`,
    services: `Serviços | ${company}`,
    blog: `Blog | ${company}`,
  };

  return wrapDocument(`${nav}<main>${main}</main>${footer}`, titles[pageType], tokens);
}
