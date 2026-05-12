import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection({ data }: { data: Record<string, any> }) {
  const {
    title = "",
    subtitle = "",
    badge = "",
    ctaText = "",
    ctaLink = "#",
    secondaryCtaText = "",
    secondaryCtaLink = "",
    backgroundImage = "",
    _editIdx,
  } = data;
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-primary/80 overflow-hidden">
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="relative max-w-6xl mx-auto px-4 text-center">
        {badge && (
          <span className="inline-block bg-white/15 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4" data-edit={ep("badge")}>
            {badge}
          </span>
        )}
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4 leading-tight" data-edit={ep("title")}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8" data-edit={ep("subtitle")}>
            {subtitle}
          </p>
        )}
        {(ctaText || secondaryCtaText) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {ctaText && (
              <Link
                href={ctaLink}
                className="inline-flex items-center justify-center gap-2 bg-brand-accent text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition shadow-lg"
              >
                <span data-edit={ep("ctaText")}>{ctaText}</span>
                <ArrowRight size={20} />
              </Link>
            )}
            {secondaryCtaText && (
              <Link
                href={secondaryCtaLink || "#"}
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20"
              >
                <span data-edit={ep("secondaryCtaText")}>{secondaryCtaText}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
