"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import Image from "next/image";
import { Cloud, Server, Shield, Key, ArrowRight, Lock, Monitor } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { IMAGES } from "@/lib/constants";
import type { SolutionItem } from "@/lib/home-config";

const iconMap: Record<string, React.ComponentType<any>> = {
  Cloud, Server, Shield, Key, Lock, Monitor
};

export function SolutionsSection({ items }: { items: SolutionItem[] }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section className="py-20 bg-blue-900" ref={ref}>
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Soluções Avançadas"
          subtitle="Tecnologias de ponta para impulsionar a transformação digital da sua empresa"
          light
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items?.map((solution, index) => {
            const Icon = iconMap[solution.icon ?? ""] ?? Cloud;
            const imageKey = solution.image as keyof typeof IMAGES;
            const imageUrl = IMAGES[imageKey] ?? solution.image ?? IMAGES.cloud;

            return (
              <motion.div
                key={solution.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/solucoes/${solution.slug}`}>
                  <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                    <Image
                      src={imageUrl}
                      alt={solution.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {solution.title}
                      </h3>
                      <p className="text-gray-300 text-sm mb-4">
                        {solution.description}
                      </p>
                      <span className="inline-flex items-center text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Explorar <ArrowRight size={16} className="ml-2" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href="/solucoes"
            className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Ver todas as soluções
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
