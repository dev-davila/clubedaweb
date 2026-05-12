"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { useSiteConfig } from "@/lib/use-site-config";

export function CtaSection() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const siteConfig = useSiteConfig();

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar a TI da sua empresa?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Fale com nossos especialistas e descubra como podemos ajudar seu negócio a crescer com tecnologia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              Solicitar orçamento
              <ArrowRight size={20} />
            </Link>
            <a
              href={siteConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition shadow-lg"
            >
              <Phone size={20} />
              WhatsApp
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-100">
            <a
              href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`}
              className="flex items-center gap-2 hover:text-white transition"
            >
              <Phone size={20} />
              {siteConfig.phone}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2 hover:text-white transition"
            >
              <Mail size={20} />
              {siteConfig.email}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
