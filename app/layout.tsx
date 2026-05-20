import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { WhatsAppButton } from "@/components/whatsapp-button";
import CookieConsent from "@/components/cookie-consent";
import { GoogleAnalytics } from "@/components/google-analytics";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ThemeInjector } from "@/components/theme-injector";
import { getSiteConfigServer } from "@/lib/site-config-server";
import { getActiveLayout } from "@/lib/active-layout";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getSEOMetaTags() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        key: { in: ["seo_bing_meta_tag", "seo_google_meta_tag"] }
      }
    });
    const result: { bingMetaTag?: string; googleMetaTag?: string } = {};
    for (const config of configs) {
      if (config.key === "seo_bing_meta_tag" && config.value) {
        result.bingMetaTag = config.value;
      }
      if (config.key === "seo_google_meta_tag" && config.value) {
        result.googleMetaTag = config.value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seoTags = await getSEOMetaTags();
  const site = await getSiteConfigServer();
  const company = site.companyName || "M3Solutions";
  const tagline = site.tagline || "Soluções completas para sua empresa.";

  const otherMeta: Record<string, string> = {};
  if (seoTags.bingMetaTag) {
    otherMeta["msvalidate.01"] = seoTags.bingMetaTag;
  }
  if (seoTags.googleMetaTag) {
    otherMeta["google-site-verification"] = seoTags.googleMetaTag;
  }

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    title: {
      default: `${company} - ${tagline}`,
      template: `%s | ${company}`
    },
    description: tagline,
    authors: [{ name: company }],
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: "/",
      siteName: company,
      title: company,
      description: tagline,
      images: ["/og-image.png"]
    },
    twitter: {
      card: "summary_large_image",
      title: company,
      description: tagline,
      images: ["/og-image.png"]
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg"
    },
    other: otherMeta
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteConfig = await getSiteConfigServer();
  const layout = await getActiveLayout();
  // BD redesign uses floating navbar so main needs top padding; M3 has standard header
  const mainPad = layout === "bd" ? "pt-20" : "";
  // /gestor (admin) e /preview têm seus próprios chrome — não renderiza o
  // header/footer do site público nessas rotas.
  const pathname = headers().get("x-pathname") ?? "";
  const isChromedRoute = pathname.startsWith("/gestor") || pathname.startsWith("/preview");
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
        <style dangerouslySetInnerHTML={{ __html: `[data-hydration-error] { display: none !important; }` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <ThemeInjector />
      </head>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <AnalyticsTracker />
        <Providers>
          {isChromedRoute ? (
            children
          ) : (
            <div className="flex flex-col min-h-screen">
              <SiteHeader initialSiteConfig={siteConfig} />
              <main className={`flex-1 ${mainPad}`}>{children}</main>
              <SiteFooter initialSiteConfig={siteConfig} />
            </div>
          )}
          {!isChromedRoute && <WhatsAppButton />}
          {!isChromedRoute && <CookieConsent />}
        </Providers>
      </body>
    </html>
  );
}
