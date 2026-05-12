import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nossos Parceiros",
  description: "Conheça os parceiros tecnológicos da M3Solutions: AWS, Azure, IBM, Microsoft, e muito mais."
};

export default async function ParceirosPage() {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: { order: "asc" }
  });

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Nossos Parceiros</h1>
            <p className="text-xl text-primary-foreground/80">
              Trabalhamos com as melhores empresas de tecnologia do mundo para oferecer soluções de qualidade.
            </p>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Parceiros Tecnológicos"
            subtitle="Parcerias estratégicas que garantem as melhores soluções para nossos clientes"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners?.map((partner) => (
              <div
                key={partner.id}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group"
              >
                <div className="relative h-20 w-full mb-6 flex items-center justify-start">
                  {partner.logoUrl ? (
                    <div className="relative h-16 w-48">
                      <Image
                        src={partner.logoUrl}
                        alt={partner.name}
                        fill
                        className="object-contain object-left"
                        sizes="192px"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-48 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400 font-semibold text-xl">{partner.name?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {partner.name}
                </h3>
                {partner.description && (
                  <p className="text-gray-600 mb-4">{partner.description}</p>
                )}
                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary font-medium hover:text-primary transition"
                  >
                    Visitar site <ExternalLink size={16} className="ml-2" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Benefícios das Parcerias"
            subtitle="O que as parcerias estratégicas significam para nossos clientes"
          />

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profissionais Certificados</h3>
              <p className="text-gray-600">Equipe certificada pelos principais fabricantes</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Melhores Preços</h3>
              <p className="text-gray-600">Acesso a condições especiais de parceiros</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Prioritário</h3>
              <p className="text-gray-600">Canal direto com fabricantes para resolução de problemas</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Quer saber mais sobre nossas soluções?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Entre em contato e descubra como podemos ajudar sua empresa com as melhores tecnologias do mercado.
          </p>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition"
          >
            Fale conosco
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
