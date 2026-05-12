"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import {
  Lightbulb, Settings, Laptop, Monitor, FolderKanban, Headphones,
  ArrowRight, Cloud, Server, Shield, Zap, ShieldCheck, Lock, Sparkles
} from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import type { ServiceItem } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Lightbulb, Settings, Laptop, Monitor, FolderKanban, Headphones, Cloud,
  Server, Shield, Zap, ShieldCheck, Lock, Sparkles
};

export function ServicesSection({ items }: { items: ServiceItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden" ref={ref}>
      {/* Decorative blob */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        <SectionTitle
          title="Edições Bitdefender GravityZone"
          subtitle="Escolha a edição certa pro tamanho e maturidade da sua operação"
        />

        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {items?.map((service, index) => {
            const Icon = iconMap[service.icon ?? ""] ?? Shield;
            const highlight = index === 1; // middle = featured

            return (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: index * 0.12 }}
                className={highlight ? "md:-mt-4 md:mb-4 relative" : "relative"}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-brand-accent text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                      <Sparkles size={12} />
                      Mais escolhida
                    </span>
                  </div>
                )}

                <Link href={service.slug.startsWith("../") ? service.slug.slice(2) : `/solucoes/${service.slug}`}>
                  <div
                    className={`group relative h-full rounded-3xl overflow-hidden border transition-all duration-300 ${
                      highlight
                        ? "bg-gradient-to-br from-primary to-primary/80 border-primary/40 text-white shadow-2xl shadow-primary/30 hover:scale-[1.02]"
                        : "bg-background border-border hover:border-primary/40 hover:shadow-xl"
                    }`}
                  >
                    {/* Decorative corner */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full ${highlight ? "bg-white/10" : "bg-primary/5"} pointer-events-none`} />

                    <div className="relative p-8 md:p-10">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                          highlight ? "bg-white/15 backdrop-blur" : "bg-primary/10"
                        }`}
                      >
                        <Icon className={`w-7 h-7 ${highlight ? "text-white" : "text-primary"}`} strokeWidth={1.8} />
                      </div>

                      <h3 className={`font-heading text-2xl font-bold mb-3 leading-tight ${highlight ? "text-white" : "text-foreground"}`}>
                        {service.title}
                      </h3>
                      <p className={`mb-8 leading-relaxed ${highlight ? "text-white/85" : "text-foreground/70"}`}>
                        {service.description}
                      </p>

                      <span
                        className={`inline-flex items-center gap-2 text-sm font-semibold ${
                          highlight ? "text-white" : "text-primary"
                        } group-hover:gap-3 transition-all`}
                      >
                        Saiba mais
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
