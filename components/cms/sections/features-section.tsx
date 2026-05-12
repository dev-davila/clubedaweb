"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Star,
  Zap,
  Shield,
  Clock,
  Users,
  Award,
  TrendingUp
} from "lucide-react";

interface Feature {
  icon?: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    features?: Feature[];
    layout?: "grid" | "list";
    columns?: number;
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    iconColor?: string;
  };
}

const ICON_MAP: Record<string, any> = {
  check: CheckCircle,
  star: Star,
  zap: Zap,
  shield: Shield,
  clock: Clock,
  users: Users,
  award: Award,
  trending: TrendingUp
};

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: "shield",
    title: "Segurança Garantida",
    description: "Proteção completa para seus dados e sistemas"
  },
  {
    icon: "clock",
    title: "Suporte 24x7",
    description: "Atendimento contínuo todos os dias do ano"
  },
  {
    icon: "users",
    title: "Equipe Especializada",
    description: "Profissionais certificados e experientes"
  },
  {
    icon: "trending",
    title: "Alta Disponibilidade",
    description: "99.9% de uptime garantido em contrato"
  }
];

export default function FeaturesSection({ content, styles }: FeaturesSectionProps) {
  const {
    title = "Por que escolher a M3Solutions?",
    subtitle = "Conheça nossos diferenciais",
    features = DEFAULT_FEATURES,
    layout = "grid",
    columns = 4
  } = content;

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4"
  };

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

        {/* Features */}
        {layout === "grid" ? (
          <div className={`grid gap-8 ${gridCols[columns as keyof typeof gridCols] || gridCols[4]}`}>
            {features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon || "check"] || CheckCircle;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${styles?.iconColor || "#7c3aed"}20` }}
                  >
                    <Icon
                      size={32}
                      style={{ color: styles?.iconColor || "#7c3aed" }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon || "check"] || CheckCircle;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${styles?.iconColor || "#7c3aed"}20` }}
                  >
                    <Icon
                      size={24}
                      style={{ color: styles?.iconColor || "#7c3aed" }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
