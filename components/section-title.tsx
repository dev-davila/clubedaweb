"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}

export function SectionTitle({ title, subtitle, centered = true, light = false }: SectionTitleProps) {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={`mb-12 ${centered ? "text-center" : ""}`}
    >
      <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
        light ? "text-white" : "text-gray-900"
      }`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg max-w-2xl ${
          centered ? "mx-auto" : ""
        } ${
          light ? "text-gray-300" : "text-gray-600"
        }`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
