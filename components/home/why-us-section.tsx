"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Award, Users, Clock, Zap, CheckCircle, TrendingUp, Shield, Star,
  Target, Cpu, ArrowUpRight
} from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import type { FeatureItem } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Award, Users, Clock, Zap, CheckCircle, TrendingUp, Shield, Star, Target, Cpu
};

export function WhyUsSection({ items }: { items: FeatureItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  if (!items?.length) return null;

  // Bento layout: first big, then mosaic
  const [hero, ...rest] = items;
  const HeroIcon = iconMap[hero?.icon] ?? Award;

  return (
    <section className="py-24 md:py-32 bg-muted/30 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4">
        <SectionTitle
          title="Por que Bitdefender?"
          subtitle="Líder em proteção corporativa há mais de uma década, com presença global e inteligência de ameaças em tempo real"
        />

        <div className="mt-14 grid lg:grid-cols-3 gap-5">
          {/* Hero card — wide */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 relative bg-gradient-to-br from-foreground to-foreground/80 text-white rounded-3xl p-10 md:p-12 overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10 pointer-events-none">
              <HeroIcon className="w-full h-full" strokeWidth={0.5} />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full mb-6">
                <Star size={12} className="text-brand-accent" />
                <span className="text-xs font-bold uppercase tracking-wider">Diferencial #1</span>
              </div>
              <h3 className="font-heading text-3xl md:text-4xl font-bold mb-4 leading-tight max-w-md">
                {hero.title}
              </h3>
              <p className="text-white/75 text-lg leading-relaxed max-w-lg">
                {hero.description}
              </p>
              <ArrowUpRight className="absolute top-0 right-0 w-8 h-8 text-white/50 group-hover:text-white group-hover:rotate-12 transition-all" />
            </div>
          </motion.div>

          {/* Standard cards */}
          {rest.slice(0, 5).map((feature, index) => {
            const Icon = iconMap[feature.icon] ?? Award;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.1 + index * 0.08 }}
                className={`relative bg-background rounded-3xl p-7 border border-border hover:border-primary/30 hover:shadow-xl transition-all group ${
                  index === 0 ? "lg:col-span-1" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:scale-110 flex items-center justify-center mb-5 transition-all">
                  <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" strokeWidth={1.8} />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-foreground/65 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
