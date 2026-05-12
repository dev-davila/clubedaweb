"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone, MessageCircle } from "lucide-react";

interface HeroSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    showStats?: boolean;
    statsClients?: string;
    statsUptime?: string;
    statsSupport?: string;
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    overlayOpacity?: string;
  };
}

export default function HeroSection({ content, styles }: HeroSectionProps) {
  const {
    title = "Transformamos a TI da sua empresa",
    subtitle = "Soluções completas em tecnologia para impulsionar seu negócio",
    backgroundImage = "https://cdn.m3solutions.net.br/hero-background.jpg",
    ctaText = "Fale Conosco",
    ctaLink = "/contato",
    secondaryCtaText,
    secondaryCtaLink,
    showStats = true,
    statsClients = "5597+",
    statsUptime = "99.9%",
    statsSupport = "24x7"
  } = content;

  return (
    <section
      className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: styles?.backgroundColor || "#1f2937"
      }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            opacity: styles?.overlayOpacity || 0.3
          }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/70" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: styles?.textColor || "#ffffff" }}
          >
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105"
            >
              {ctaText}
              <ArrowRight size={20} />
            </Link>
            {secondaryCtaText && secondaryCtaLink && (
              <Link
                href={secondaryCtaLink}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/30"
              >
                {secondaryCtaText}
              </Link>
            )}
          </div>

          {/* Stats */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">{statsClients}</p>
                <p className="text-gray-400">Clientes atendidos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">{statsUptime}</p>
                <p className="text-gray-400">Uptime garantido</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">{statsSupport}</p>
                <p className="text-gray-400">Suporte contínuo</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
