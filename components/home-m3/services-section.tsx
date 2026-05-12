"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import Image from "next/image";
import { Lightbulb, Settings, Laptop, Monitor, FolderKanban, Headphones, ArrowRight, Cloud, Server, Shield, Zap } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { IMAGES } from "@/lib/constants";
import type { ServiceItem } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Lightbulb, Settings, Laptop, Monitor, FolderKanban, Headphones, Cloud, Server, Shield, Zap
};

export function ServicesSection({ items }: { items: ServiceItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section className="py-20 bg-gray-50" ref={ref}>
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Nossos Serviços"
          subtitle="Soluções completas de TI para atender todas as necessidades da sua empresa"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.map((service, index) => {
            const Icon = iconMap[service.icon ?? ""] ?? Lightbulb;
            const imageKey = service.image as keyof typeof IMAGES;
            const imageUrl = IMAGES[imageKey] ?? service.image ?? IMAGES.hero;

            return (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/solucoes/${service.slug}`}>
                  <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      <span className="inline-flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                        Saiba mais <ArrowRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
