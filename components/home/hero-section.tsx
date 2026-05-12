"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Play, Shield, Cloud, Headphones, Server, Monitor,
  Lock, Zap, Settings, ShieldCheck, Activity, Award
} from "lucide-react";
import type { HeroConfig } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Shield, Cloud, Headphones, Server, Monitor, Lock, Zap, Settings, ShieldCheck, Activity, Award
};

export function HeroSection({ config }: { config: HeroConfig }) {
  const titleParts = config.title.split("{highlight}");
  const FirstCardIcon = iconMap[config.featureCards?.[0]?.icon ?? "Shield"] ?? Shield;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70">
      {/* Mesh gradient layer */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-accent rounded-full blur-[140px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-white rounded-full blur-[160px] opacity-20" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-secondary rounded-full blur-[140px] opacity-40" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 pt-16 md:pt-24 pb-20 md:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            {config.badge && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] text-white mb-6">
                <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                {config.badge}
              </div>
            )}

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-7">
              {titleParts[0]}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-brand-accent via-brand-accent to-white bg-clip-text text-transparent">
                  {config.titleHighlight}
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-brand-accent/30 -skew-x-3 rounded" />
              </span>
              {titleParts[1] || ""}
            </h1>

            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-2xl">
              {config.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                href={config.ctaPrimaryLink}
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary px-7 py-4 rounded-2xl font-semibold hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20"
              >
                {config.ctaPrimaryText}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={config.ctaSecondaryLink}
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 text-white px-7 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all"
              >
                <Play size={16} />
                {config.ctaSecondaryText}
              </Link>
            </div>

            {/* Stats inline */}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
              {config.stats?.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <div className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-white/60 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — bento visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="relative grid grid-cols-2 grid-rows-3 gap-3 h-[520px]">
              {/* Hero card large */}
              <div className="col-span-2 row-span-2 relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden p-8 group hover:bg-white/15 transition-colors">
                <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-white">Live protection</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-primary/70 to-transparent pointer-events-none" />
                <div className="relative h-full flex flex-col justify-end">
                  <FirstCardIcon className="w-20 h-20 text-white mb-4" strokeWidth={1.4} />
                  <h3 className="font-heading text-2xl font-bold text-white mb-1">
                    {config.featureCards?.[0]?.title || "Antimalware #1"}
                  </h3>
                  <p className="text-sm text-white/75">
                    {config.featureCards?.[0]?.description || "Líder global em proteção corporativa"}
                  </p>
                </div>
              </div>

              {/* Smaller cards */}
              {config.featureCards?.slice(1, 3).map((card, i) => {
                const Icon = iconMap[card.icon] || Shield;
                return (
                  <div
                    key={i}
                    className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 hover:bg-white/15 transition-colors"
                  >
                    <Icon className="w-8 h-8 text-brand-accent mb-3" strokeWidth={1.6} />
                    <h4 className="font-heading text-sm font-bold text-white leading-tight mb-1">
                      {card.title}
                    </h4>
                    <p className="text-xs text-white/65 leading-snug">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom curve fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
