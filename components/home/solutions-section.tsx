"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import {
  Cloud, Server, Shield, Key, ArrowRight, Lock, Monitor,
  ShieldCheck, Activity, Network, Search
} from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import type { SolutionItem } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Cloud, Server, Shield, Key, Lock, Monitor, ShieldCheck, Activity, Network, Search
};

export function SolutionsSection({ items }: { items: SolutionItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-foreground via-foreground to-foreground/80 relative overflow-hidden" ref={ref}>
      {/* Mesh */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-brand-accent rounded-full blur-[160px] opacity-60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <SectionTitle
          title="Camadas de proteção Bitdefender"
          subtitle="Tecnologias premiadas que combinam Machine Learning, EDR/XDR e inteligência de ameaças global"
          light
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          {items?.map((solution, index) => {
            const Icon = iconMap[solution.icon ?? ""] ?? Cloud;
            return (
              <motion.div
                key={solution.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                <Link
                  href={
                    solution.slug.startsWith("../")
                      ? solution.slug.slice(2)
                      : `/solucoes/${solution.slug}`
                  }
                >
                  <div className="group relative h-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-3xl p-7 overflow-hidden hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300">
                    {/* Glow on hover */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />

                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                      </div>
                      <h3 className="font-heading text-xl font-bold text-white mb-2 leading-tight">
                        {solution.title}
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed mb-6">
                        {solution.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent group-hover:gap-2.5 transition-all">
                        Explorar
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-14"
        >
          <Link
            href="/p/bitdefender-business-security"
            className="inline-flex items-center gap-2 bg-white text-foreground px-7 py-3.5 rounded-2xl font-semibold hover:bg-white/95 hover:scale-[1.02] transition-all shadow-xl"
          >
            Ver todas as edições
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
