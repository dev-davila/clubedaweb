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
    <section
      className="py-24 md:py-32 relative overflow-hidden bg-background"
      ref={ref}
    >
      {/* Decorative quote */}
      <Quote
        className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 text-primary/[0.04] pointer-events-none"
        strokeWidth={1}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <SectionTitle
          title="O que dizem quem usa Bitdefender"
          subtitle="Depoimentos de empresas que escolheram proteção de classe mundial"
        />

        <div className="grid md:grid-cols-3 gap-5 mt-14">
          {items?.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: index * 0.12 }}
              className={`relative rounded-3xl p-8 border transition-all hover:-translate-y-1 ${
                index === 1
                  ? "bg-gradient-to-br from-primary to-primary/85 text-white border-primary/40 shadow-2xl shadow-primary/30 md:scale-105"
                  : "bg-background border-border hover:shadow-xl"
              }`}
            >
              <Quote
                size={32}
                className={index === 1 ? "text-white/60 mb-4" : "text-primary/30 mb-4"}
              />

              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: testimonial.rating || 5 })?.map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={index === 1 ? "fill-white text-white" : "fill-yellow-400 text-yellow-400"}
                  />
                ))}
              </div>

              <p
                className={`leading-relaxed mb-8 ${
                  index === 1 ? "text-white/95" : "text-foreground/80"
                }`}
              >
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-lg ${
                    index === 1
                      ? "bg-white/15 text-white backdrop-blur"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {testimonial.name?.charAt(0)}
                </div>
                <div>
                  <div className={`font-semibold ${index === 1 ? "text-white" : "text-foreground"}`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-xs ${index === 1 ? "text-white/70" : "text-foreground/55"}`}>
                    {testimonial.role} · {testimonial.company}
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
