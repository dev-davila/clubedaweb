"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Cloud,
  Server,
  Headphones,
  Monitor,
  Database,
  ArrowRight
} from "lucide-react";

interface ServiceItem {
  icon?: string;
  title: string;
  description: string;
  link?: string;
}

interface ServicesSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    services?: ServiceItem[];
    showMoreLink?: boolean;
    moreText?: string;
    moreLink?: string;
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    cardColor?: string;
  };
}

const ICON_MAP: Record<string, any> = {
  shield: Shield,
  cloud: Cloud,
  server: Server,
  headphones: Headphones,
  monitor: Monitor,
  database: Database
};

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    icon: "shield",
    title: "Segurança da Informação",
    description: "Proteção completa contra ameaças digitais e conformidade com LGPD",
    link: "/solucoes/seguranca"
  },
  {
    icon: "cloud",
    title: "Cloud Computing",
    description: "Migração e gestão de ambientes em nuvem pública e privada",
    link: "/solucoes/cloud-computing"
  },
  {
    icon: "server",
    title: "Infraestrutura de TI",
    description: "Projetos de infraestrutura escalável e de alta disponibilidade",
    link: "/solucoes/infraestrutura"
  },
  {
    icon: "headphones",
    title: "Suporte Técnico",
    description: "Atendimento especializado 24x7 com SLA garantido",
    link: "/solucoes/suporte"
  },
  {
    icon: "monitor",
    title: "NOC 24x7",
    description: "Monitoramento proativo de toda a sua infraestrutura",
    link: "/solucoes/noc"
  },
  {
    icon: "database",
    title: "Backup e Disaster Recovery",
    description: "Proteção e recuperação de dados críticos",
    link: "/solucoes/backup"
  }
];

export default function ServicesSection({ content, styles }: ServicesSectionProps) {
  const {
    title = "Nossas Soluções",
    subtitle = "Oferecemos um portfólio completo de serviços para transformar a TI da sua empresa",
    services = DEFAULT_SERVICES,
    showMoreLink = true,
    moreText = "Ver todas as soluções",
    moreLink = "/solucoes"
  } = content;

  return (
    <section
      className="py-20"
      style={{ backgroundColor: styles?.backgroundColor || "#ffffff" }}
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
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">{subtitle}</p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = ICON_MAP[service.icon || "server"] || Server;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={service.link || "#"}
                  className="block p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: styles?.cardColor || "#ffffff" }}
                >
                  <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                    <Icon className="text-purple-600 group-hover:text-white transition-colors" size={28} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                </Link>
              </motion.div>
            );
          })}
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
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition"
            >
              {moreText}
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
