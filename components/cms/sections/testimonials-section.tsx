"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

interface Testimonial {
  name: string;
  text: string;
  company?: string;
  role?: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialsSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: Testimonial[];
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

export default function TestimonialsSection({ content, styles }: TestimonialsSectionProps) {
  const {
    title = "O que nossos clientes dizem",
    subtitle,
    items = []
  } = content;

  const accentColor = styles?.accentColor || "#7c3aed";

  return (
    <section
      className="py-20"
      style={{ backgroundColor: styles?.backgroundColor || "#ffffff" }}
    >
      <div className="container mx-auto px-4">
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

        <div className={`grid gap-8 ${
          items.length <= 2 ? "md:grid-cols-2" :
          "md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {items.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-6 md:p-8 relative"
            >
              <Quote
                size={32}
                className="absolute top-4 right-4 opacity-10"
                style={{ color: accentColor }}
              />

              {/* Rating Stars */}
              {testimonial.rating && testimonial.rating > 0 && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < testimonial.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              )}

              <p className="text-gray-700 leading-relaxed mb-6 italic">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                {testimonial.avatar && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                {!testimonial.avatar && (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-sm text-gray-500">
                      {testimonial.role}{testimonial.role && testimonial.company ? " - " : ""}{testimonial.company}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
