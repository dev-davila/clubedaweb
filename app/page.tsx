import { getHomeConfig } from "@/lib/home-config";
import { getActiveLayout } from "@/lib/active-layout";

// Bitdefender redesign (default of current build)
import { HeroSection as BdHero } from "@/components/home-bd/hero-section";
import { LogosMarquee } from "@/components/home-bd/logos-marquee";
import { ServicesSection as BdServices } from "@/components/home-bd/services-section";
import { SolutionsSection as BdSolutions } from "@/components/home-bd/solutions-section";
import { WhyUsSection as BdWhyUs } from "@/components/home-bd/why-us-section";
import { TestimonialsSection as BdTestimonials } from "@/components/home-bd/testimonials-section";
import { FaqSection as BdFaq } from "@/components/home-bd/faq-section";
import { PartnersSection as BdPartners } from "@/components/home-bd/partners-section";
import { NewsSection as BdNews } from "@/components/home-bd/news-section";
import { CtaSection as BdCta } from "@/components/home-bd/cta-section";

// M3 original layout
import { HeroSection as M3Hero } from "@/components/home-m3/hero-section";
import { ServicesSection as M3Services } from "@/components/home-m3/services-section";
import { SolutionsSection as M3Solutions } from "@/components/home-m3/solutions-section";
import { WhyUsSection as M3WhyUs } from "@/components/home-m3/why-us-section";
import { TestimonialsSection as M3Testimonials } from "@/components/home-m3/testimonials-section";
import { PartnersSection as M3Partners } from "@/components/home-m3/partners-section";
import { NewsSection as M3News } from "@/components/home-m3/news-section";
import { CtaSection as M3Cta } from "@/components/home-m3/cta-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const homeConfig = await getHomeConfig();
  const layout = await getActiveLayout();

  if (layout === "m3") {
    return (
      <>
        <M3Hero config={homeConfig.hero} />
        <M3Services items={homeConfig.services} />
        <M3Solutions items={homeConfig.solutions} />
        <M3WhyUs items={homeConfig.features} />
        <M3Testimonials items={homeConfig.testimonials} />
        <M3Partners />
        <M3News />
        <M3Cta />
      </>
    );
  }

  // Bitdefender / default redesign
  return (
    <>
      <BdHero config={homeConfig.hero} />
      <LogosMarquee />
      <BdServices items={homeConfig.services} />
      <BdSolutions items={homeConfig.solutions} />
      <BdWhyUs items={homeConfig.features} />
      <BdTestimonials items={homeConfig.testimonials} />
      <BdFaq />
      <BdPartners />
      <BdNews />
      <BdCta />
    </>
  );
}
