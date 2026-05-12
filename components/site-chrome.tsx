import type { SiteContactConfig } from "@/lib/use-site-config";
import { getActiveLayout } from "@/lib/active-layout";

import { Header as M3Header } from "@/components/m3-original/header";
import { Footer as M3Footer } from "@/components/m3-original/footer";

import { Header as BdHeader } from "@/components/bd-redesign/header";
import { Footer as BdFooter } from "@/components/bd-redesign/footer";

export async function SiteHeader({ initialSiteConfig }: { initialSiteConfig: SiteContactConfig }) {
  const layout = await getActiveLayout();
  if (layout === "m3") return <M3Header initialSiteConfig={initialSiteConfig} />;
  return <BdHeader initialSiteConfig={initialSiteConfig} />;
}

export async function SiteFooter({ initialSiteConfig }: { initialSiteConfig: SiteContactConfig }) {
  const layout = await getActiveLayout();
  if (layout === "m3") return <M3Footer initialSiteConfig={initialSiteConfig} />;
  return <BdFooter initialSiteConfig={initialSiteConfig} />;
}

export async function getActiveChromeLayout() {
  return getActiveLayout();
}
