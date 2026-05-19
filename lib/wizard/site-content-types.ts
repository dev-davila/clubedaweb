import type { RequiredPageType } from "@/lib/themes/required-pages";

export interface PageHeroCopy {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export interface PageContentCopy {
  title: string;
  paragraphs: string[];
}

export interface PageFeatureItemCopy {
  icon: string;
  title: string;
  description: string;
}

export interface PageFeaturesCopy {
  title: string;
  subtitle?: string;
  items: PageFeatureItemCopy[];
}

export interface PageCtaCopy {
  title: string;
  text: string;
  buttonText: string;
  buttonLink: string;
}

export interface HomeStylePageCopy {
  hero: PageHeroCopy;
  features: PageFeaturesCopy;
  cta: PageCtaCopy;
}

export interface ContentStylePageCopy {
  hero: PageHeroCopy;
  content: PageContentCopy;
  cta: PageCtaCopy;
}

export interface BlogStylePageCopy {
  hero: PageHeroCopy;
  content: PageContentCopy;
}

export type SitePageCopy = {
  home: HomeStylePageCopy;
  about: ContentStylePageCopy;
  contact: ContentStylePageCopy;
  services: HomeStylePageCopy;
  blog: BlogStylePageCopy;
};

export type SitePageCopyEntry = SitePageCopy[RequiredPageType];
