"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone, MessageCircle, Mail } from "lucide-react";

interface CtaSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    showPhone?: boolean;
    phone?: string;
    showWhatsapp?: boolean;
    whatsapp?: string;
    showEmail?: boolean;
    email?: string;
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
  };
}

export default function CtaSection({ content, styles }: CtaSectionProps) {
  const {
    title = "Pronto para transformar sua TI?",
    subtitle = "Entre em contato e descubra como podemos ajudar sua empresa",
    ctaText = "Fale com um especialista",
    ctaLink = "/contato",
    showPhone = true,
    phone = "(11) 3644-7037",
    showWhatsapp = true,
    whatsapp = "5511964497037",
    showEmail = true,
    email = "contato@m3solutions.com.br"
  } = content;

  return (
    <section
      className="py-20"
      style={{
        background: styles?.backgroundColor || "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
      }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: styles?.textColor || "#ffffff" }}
          >
            {title}
          </h2>
          <p className="text-xl text-white/80 mb-8">{subtitle}</p>

          {/* Contact Options */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {showPhone && (
              <a
                href={`tel:${phone.replace(/\D/g, "")}`}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition text-white"
              >
                <Phone size={20} />
                {phone}
              </a>
            )}
            {showWhatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition text-white"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
            )}
            {showEmail && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition text-white"
              >
                <Mail size={20} />
                {email}
              </a>
            )}
          </div>

          {/* Main CTA */}
          <Link
            href={ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            style={{
              backgroundColor: styles?.buttonColor || "#ffffff"
            }}
          >
            {ctaText}
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
