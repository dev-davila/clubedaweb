"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Award, Users, Clock, Zap, CheckCircle, TrendingUp, Shield, Star, Target, Cpu } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import type { FeatureItem } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Award, Users, Clock, Zap, CheckCircle, TrendingUp, Shield, Star, Target, Cpu
};

export function WhyUsSection({ items }: { items: FeatureItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Por que escolher a M3Solutions?"
          subtitle="Diferenciais que fazem a diferença para o sucesso do seu negócio"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.map((feature, index) => {
            const Icon = iconMap[feature.icon] ?? Award;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-8 rounded-2xl bg-gray-50 hover:bg-blue-600 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center mb-6 transition">
                  <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-white mb-3 transition">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-blue-100 transition">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
