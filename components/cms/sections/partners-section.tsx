"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Partner {
  name: string;
  logo: string;
  url?: string;
}

interface PartnersSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    partners?: Partner[];
    showMoreLink?: boolean;
    moreText?: string;
    moreLink?: string;
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export default function PartnersSection({ content, styles }: PartnersSectionProps) {
  const {
    title = "Nossos Parceiros",
    subtitle = "Trabalhamos com as melhores empresas de tecnologia do mercado",
    partners = [],
    showMoreLink = true,
    moreText = "Ver todos os parceiros",
    moreLink = "/nossos-parceiros"
  } = content;

  return (
    <section
      className="py-16"
      style={{ backgroundColor: styles?.backgroundColor || "#f9fafb" }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: styles?.textColor || "#111827" }}
          >
            {title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all"
            >
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={partner.name}
                >
                  <div className="relative h-12 w-32">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </a>
              ) : (
                <div className="relative h-12 w-32">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* More Link */}
        {showMoreLink && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link
              href={moreLink}
              className="text-purple-600 font-semibold hover:text-purple-700 transition"
            >
              {moreText} →
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
