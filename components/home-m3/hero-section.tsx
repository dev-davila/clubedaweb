"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Shield, Cloud, Headphones, Server, Monitor, Lock, Zap, Settings } from "lucide-react";
import type { HeroConfig } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Shield, Cloud, Headphones, Server, Monitor, Lock, Zap, Settings
};

export function HeroSection({ config }: { config: HeroConfig }) {
  // Build title with highlight
  const titleParts = config.title.split("{highlight}");

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={config.backgroundImage}
          alt="Data center moderno"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/80 to-blue-900/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              {config.badge}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {titleParts[0]}<span className="text-blue-400">{config.titleHighlight}</span>{titleParts[1] || ""}
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {config.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href={config.ctaPrimaryLink}
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl"
              >
                {config.ctaPrimaryText}
                <ArrowRight size={20} />
              </Link>
              <Link
                href={config.ctaSecondaryLink}
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition backdrop-blur-sm border border-white/20"
              >
                <Play size={20} />
                {config.ctaSecondaryText}
              </Link>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-6">
              {config.stats?.map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {config.featureCards?.map((card, i) => {
              const Icon = iconMap[card.icon] || Shield;
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 ${i === 1 ? "mt-8" : ""}`}
                >
                  <Icon className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm">{card.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
