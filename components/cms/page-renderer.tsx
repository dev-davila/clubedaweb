"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Dynamic imports for sections
const HeroSection = dynamic(() => import("./sections/hero-section"), { ssr: true });
const ServicesSection = dynamic(() => import("./sections/services-section"), { ssr: true });
const CtaSection = dynamic(() => import("./sections/cta-section"), { ssr: true });
const PartnersSection = dynamic(() => import("./sections/partners-section"), { ssr: true });
const TextSection = dynamic(() => import("./sections/text-section"), { ssr: true });
const FeaturesSection = dynamic(() => import("./sections/features-section"), { ssr: true });
const ContactSection = dynamic(() => import("./sections/contact-section"), { ssr: true });
const StatsSection = dynamic(() => import("./sections/stats-section"), { ssr: true });
const TestimonialsSection = dynamic(() => import("./sections/testimonials-section"), { ssr: true });
const FaqSection = dynamic(() => import("./sections/faq-section"), { ssr: true });

// Map section keys to components
const SECTION_COMPONENTS: Record<string, any> = {
  hero: HeroSection,
  services: ServicesSection,
  solutions: ServicesSection, // Alias
  cta: CtaSection,
  partners: PartnersSection,
  text: TextSection,
  content: TextSection, // Alias
  features: FeaturesSection,
  whyus: FeaturesSection, // Alias
  contact: ContactSection,
  stats: StatsSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
};

interface PageSection {
  id: string;
  sectionKey: string;
  order: number;
  visible: boolean;
  content: Record<string, any>;
  styles: Record<string, any> | null;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: Record<string, any>;
  sections: PageSection[];
  template: {
    type: string;
    sections?: {
      items: Array<{
        key: string;
        label: string;
      }>;
    };
  } | null;
}

interface PageRendererProps {
  page: PageData;
  preview?: boolean;
}

function SectionLoading() {
  return (
    <div className="py-20 flex items-center justify-center">
      <Loader2 className="animate-spin text-purple-600" size={32} />
    </div>
  );
}

export default function PageRenderer({ page, preview = false }: PageRendererProps) {
  // Get visible sections sorted by order
  const visibleSections = page.sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

  // If no sections, render page content directly
  if (visibleSections.length === 0 && page.content) {
    return (
      <div className="min-h-screen">
        {preview && (
          <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm">
            Modo Preview - Esta página não está publicada
          </div>
        )}
        <TextSection
          content={{
            title: page.title,
            body: page.content.body || "",
            alignment: page.content.alignment || "left"
          }}
          styles={{}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {preview && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm">
          Modo Preview - Esta página não está publicada
        </div>
      )}

      {visibleSections.map((section) => {
        // Determine which component to render
        const sectionType = section.sectionKey.toLowerCase();
        const Component = SECTION_COMPONENTS[sectionType];

        if (!Component) {
          // Fallback to generic text section for unknown types
          return (
            <TextSection
              key={section.id}
              content={{
                title: section.content.title,
                body: section.content.body || JSON.stringify(section.content, null, 2)
              }}
              styles={section.styles || {}}
            />
          );
        }

        // Merge page global content with section content
        const mergedContent = {
          ...page.content,
          ...section.content
        };

        return (
          <Suspense key={section.id} fallback={<SectionLoading />}>
            <Component
              content={mergedContent}
              styles={section.styles || {}}
            />
          </Suspense>
        );
      })}
    </div>
  );
}
