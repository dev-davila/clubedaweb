"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Calendar,
  Star,
  HeadphonesIcon,
  Users,
  Award,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  Building
} from "lucide-react";

interface StatItem {
  icon?: string;
  label: string;
  value: string;
}

interface StatsSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: StatItem[];
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

const ICON_MAP: Record<string, any> = {
  globe: Globe,
  calendar: Calendar,
  star: Star,
  support: HeadphonesIcon,
  headphones: HeadphonesIcon,
  users: Users,
  award: Award,
  trending: TrendingUp,
  shield: Shield,
  zap: Zap,
  clock: Clock,
  check: CheckCircle,
  building: Building,
};

export default function StatsSection({ content, styles }: StatsSectionProps) {
  const {
    title,
    subtitle,
    items = []
  } = content;

  const accentColor = styles?.accentColor || "#7c3aed";

  return (
    <section
      className="py-16"
      style={{ backgroundColor: styles?.backgroundColor || "#f9fafb" }}
    >
      <div className="container mx-auto px-4">
        {title && (
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
            {subtitle && (
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">{subtitle}</p>
            )}
          </motion.div>
        )}

        <div className={`grid gap-8 ${
          items.length <= 2 ? "md:grid-cols-2" :
          items.length === 3 ? "md:grid-cols-3" :
          "md:grid-cols-2 lg:grid-cols-4"
        }`}>
          {items.map((item, index) => {
            const Icon = ICON_MAP[item.icon || "star"] || Star;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-xl shadow-sm"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Icon size={28} style={{ color: accentColor }} />
                </div>
                <p
                  className="text-3xl md:text-4xl font-bold mb-2"
                  style={{ color: accentColor }}
                >
                  {item.value}
                </p>
                <p className="text-gray-600 font-medium">{item.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
