import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import * as Lucide from "lucide-react";

function Icon({ name, className }: { name?: string; className?: string }) {
  const Comp = name && (Lucide as any)[name] ? (Lucide as any)[name] : Shield;
  return <Comp className={className} />;
}

export function BitdefenderHero({ data }: { data: Record<string, any> }) {
  const {
    badge = "BITDEFENDER",
    title = "",
    subtitle = "",
    ctaText = "Solicitar orçamento",
    ctaLink = "/contato",
    secondaryCtaText = "Ver comparativo",
    secondaryCtaLink = "#comparison",
    icon = "Shield",
    bullets = [] as string[],
    _editIdx,
  } = data;
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,255,255,.3) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,.4) 0, transparent 50%)"
      }} />
      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 border border-white/20">
              <Icon name={icon} className="w-4 h-4" />
              <span data-edit={ep("badge")}>{badge}</span>
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] mb-5" data-edit={ep("title")}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed" data-edit={ep("subtitle")}>
                {subtitle}
              </p>
            )}
            {Array.isArray(bullets) && bullets.length > 0 && (
              <ul className="space-y-2 mb-8">
                {bullets.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-white/85">
                    <span className="mt-1 w-2 h-2 rounded-full bg-white shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              {ctaText && (
                <Link
                  href={ctaLink}
                  className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition shadow-lg"
                >
                  <span data-edit={ep("ctaText")}>{ctaText}</span>
                  <ArrowRight size={18} />
                </Link>
              )}
              {secondaryCtaText && (
                <Link
                  href={secondaryCtaLink}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  <span data-edit={ep("secondaryCtaText")}>{secondaryCtaText}</span>
                </Link>
              )}
            </div>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="relative w-72 h-72 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Icon name={icon} className="w-32 h-32 text-white/90" strokeWidth={1.2} />
              <div className="absolute -top-4 -right-4 bg-white text-red-700 px-4 py-2 rounded-xl shadow-lg text-sm font-bold">
                #1 Antimalware
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
