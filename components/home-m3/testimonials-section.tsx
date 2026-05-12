"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Star, Quote } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import type { TestimonialItem } from "@/lib/home-config";

export function TestimonialsSection({ items }: { items: TestimonialItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  if (!items || items.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50" ref={ref}>
      <div className="container mx-auto px-4">
        <SectionTitle
          title="O que nossos clientes dizem"
          subtitle="Depoimentos de empresas que confiam na M3Solutions"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow"
            >
              <Quote className="w-10 h-10 text-blue-200 mb-4" />
              <p className="text-gray-600 mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating || 5 })?.map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {testimonial.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role} - {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
