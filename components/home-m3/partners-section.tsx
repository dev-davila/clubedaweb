import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { prisma } from "@/lib/db";

export async function PartnersSection() {
  const partners = await prisma.partner.findMany({
    where: { active: true, showOnHome: true },
    orderBy: { order: 'asc' },
    take: 12
  });

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Nossos Parceiros"
          subtitle="Trabalhamos com as melhores empresas de tecnologia do mundo"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {partners?.map((partner) => (
            <div
              key={partner.id}
              className="relative h-16 w-32 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
            >
              {partner.logoUrl && (
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/nossos-parceiros"
            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition"
          >
            Ver todos os parceiros
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
