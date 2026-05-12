"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight, Phone, Mail, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/lib/use-site-config";

export function CtaSection() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const siteConfig = useSiteConfig();

  return (
    <section className="py-24 md:py-32 relative overflow-hidden" ref={ref}>
      {/* Full-bleed dark background with mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/85" />
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[160px] opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand-accent rounded-full blur-[140px] opacity-40" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px"
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center text-white"
        >
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-7">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
            Pronto pra começar?
          </span>

          <h2 className="font-heading text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
            Proteção de classe mundial
            <span className="block bg-gradient-to-r from-primary via-brand-accent to-white bg-clip-text text-transparent">
              em minutos
            </span>
          </h2>

          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-12 leading-relaxed">
            Fale com um especialista e descubra a edição Bitdefender ideal para o seu negócio.
            Implementação rápida, sem servidor local, suporte em português.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link
              href="/contato"
              className="group inline-flex items-center justify-center gap-2 bg-white text-foreground px-8 py-4 rounded-2xl font-semibold hover:bg-white/95 hover:scale-[1.02] transition-all shadow-2xl shadow-black/30"
            >
              Solicitar orçamento
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href={siteConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>

          {/* Contact strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-10 border-t border-white/10 max-w-2xl mx-auto">
            <a
              href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`}
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
            >
              <Phone size={16} />
              {siteConfig.phone}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
            >
              <Mail size={16} />
              {siteConfig.email}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
