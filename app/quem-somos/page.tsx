export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Target, Eye, Heart, CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { IMAGES, SITE_CONFIG } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

async function getSiteConfig() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { category: 'contact' }
    });
    const result: Record<string, string> = {};
    configs.forEach(c => {
      result[c.key] = c.value;
    });
    return result;
  } catch {
    return {};
  }
}

export const metadata: Metadata = {
  title: "Quem Somos",
  description: "Conheça a M3Solutions: mais de 12 anos oferecendo soluções em TI para empresas de todos os portes."
};

const defaultValues = [
  { icon: "Target", title: "Missão", description: "Oferecer soluções em tecnologia da informação que impulsionem o crescimento e a eficiência dos nossos clientes, com excelência e inovação." },
  { icon: "Eye", title: "Visão", description: "Ser referência no mercado de TI, reconhecida pela qualidade dos serviços, compromisso com resultados e parcerias duradouras." },
  { icon: "Heart", title: "Valores", description: "Excelência, Inovação, Comprometimento, Ética, Transparência e Foco no Cliente." },
];

const valueIcons: Record<string, any> = { Target, Eye, Heart };

const defaultStats = [
  { value: "12+", label: "Anos de experiência" },
  { value: "5597+", label: "Clientes atendidos" },
  { value: "99.9%", label: "Uptime" },
];

export default async function QuemSomosPage() {
  const dbConfig = await getSiteConfig();
  const pageData = await getInstitutionalPage("quem-somos");

  const whatsappNumber = dbConfig.contact_whatsapp || SITE_CONFIG.whatsapp;
  const whatsappLink = dbConfig.contact_whatsapp 
    ? `https://wa.me/55${dbConfig.contact_whatsapp.replace(/\D/g, '')}` 
    : SITE_CONFIG.whatsappLink;

  const heroTitle = pageData?.heroTitle || "Quem Somos";
  const heroSubtitle = pageData?.heroSubtitle || "Há mais de 12 anos transformando a TI de empresas em todo o Brasil.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const stats = sections?.stats || defaultStats;
  const values = sections?.values || defaultValues;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {heroTitle}
            </h1>
            <p className="text-xl text-primary-foreground/80">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nossa História
              </h2>
              {content ? (
                <div className="prose max-w-none text-gray-600 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
              ) : (
                <div className="space-y-4 text-gray-600 leading-relaxed text-justify">
                  <p>
                    A M3Solutions nasceu em São Paulo com a missão de democratizar o acesso à tecnologia de qualidade para empresas de todos os portes. Desde o início, nossa paixão por tecnologia e compromisso com resultados nos guiam.
                  </p>
                  <p>
                    Ao longo dos anos, evoluímos de uma pequena consultoria para uma empresa completa de soluções em TI, oferecendo desde suporte técnico até projetos complexos de multicloud e segurança.
                  </p>
                  <p>
                    Hoje, atendemos centenas de empresas com uma equipe de profissionais altamente qualificados e certificados nas principais tecnologias do mercado.
                  </p>
                </div>
              )}
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={IMAGES.equipe}
                alt="Equipe M3Solutions"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat: any) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Missão, Visão e Valores"
            subtitle="Os pilares que guiam nossa atuação e relacionamento com clientes"
          />
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((item: any) => {
              const Icon = valueIcons[item.icon] || Target;
              return (
                <div
                  key={item.title}
                  className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-justify">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Nossos Diferenciais"
            subtitle="O que nos torna a escolha certa para sua empresa"
          />
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Equipe certificada nas principais tecnologias",
              "Atendimento personalizado e humanizado",
              "NOC 24x7 com monitoramento proativo",
              "Parcerias com líderes globais de tecnologia",
              "SLAs com garantia de disponibilidade",
              "Soluções escaláveis para todos os portes"
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Vamos conversar sobre seu projeto?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto text-justify">
            Entre em contato e descubra como podemos ajudar sua empresa a crescer com tecnologia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition"
            >
              <MessageCircle size={20} />
              Fale conosco
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
