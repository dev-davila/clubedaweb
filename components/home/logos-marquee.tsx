"use client";

const logos = [
  "AV-TEST",
  "AV-COMPARATIVES",
  "Gartner",
  "Forrester",
  "MITRE ATT&CK",
  "ISO 27001",
  "SOC 2",
  "LGPD Ready",
  "PCI DSS",
  "NIST",
];

export function LogosMarquee() {
  // duplicate so the marquee loops seamlessly
  const items = [...logos, ...logos];
  return (
    <section className="py-14 border-y border-border/60 bg-muted/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <p className="text-center text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">
          Reconhecido e certificado por
        </p>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-muted/40 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/40 to-transparent z-10 pointer-events-none" />
        <div className="flex items-center gap-12 marquee-track">
          {items.map((label, i) => (
            <span
              key={i}
              className="font-heading text-2xl md:text-3xl font-black tracking-tight text-foreground/30 hover:text-foreground/80 transition-colors whitespace-nowrap shrink-0"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          width: max-content;
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </section>
  );
}
