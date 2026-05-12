export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Target, Eye, Star, Heart, Shield, Lightbulb, Users, Zap } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Missão, Visão e Valores - M3Solutions",
  description: "Conheça a missão, visão e valores que guiam a M3Solutions em sua jornada de excelência em TI."
};

const valueIcons: Record<string, any> = { Shield, Lightbulb, Users, Heart, Zap, Star };

const defaultValues = [
  { icon: "Shield", title: "Integridade", description: "Agimos com ética e transparência em todas as relações." },
  { icon: "Lightbulb", title: "Inovação", description: "Buscamos constantemente novas soluções e tecnologias." },
  { icon: "Users", title: "Colaboração", description: "Trabalhamos juntos para alcançar resultados extraordinários." },
  { icon: "Heart", title: "Paixão", description: "Amamos o que fazemos e isso reflete em nosso trabalho." },
  { icon: "Zap", title: "Agilidade", description: "Respondemos rapidamente às necessidades de nossos clientes." },
  { icon: "Star", title: "Excelência", description: "Buscamos a qualidade máxima em tudo o que fazemos." },
];

const defaultMission = "Oferecer soluções de tecnologia da informação que impulsionem o crescimento dos nossos clientes, com excelência, segurança e inovação, contribuindo para a transformação digital das empresas brasileiras.";
const defaultMissionQuote = "Transformar a TI em um diferencial competitivo para nossos clientes, permitindo que foquem no que fazem de melhor: seus negócios.";
const defaultVision = "Ser referência nacional em serviços de TI, reconhecida pela qualidade, confiança e pelo relacionamento de longo prazo com nossos clientes, colaboradores e parceiros.";
const defaultVisionQuote = "Ser reconhecida como a principal parceira de TI para empresas que buscam excelência, segurança e inovação tecnológica no Brasil.";

export default async function MissaoVisaoValoresPage() {
  const pageData = await getInstitutionalPage("missao-visao-e-valores");

  const heroTitle = pageData?.heroTitle || "Missão, Visão e Valores";
  const heroSubtitle = pageData?.heroSubtitle || "Os pilares que sustentam nossa cultura e guiam nossas decisões.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const mission = sections?.mission || defaultMission;
  const missionQuote = sections?.missionQuote || defaultMissionQuote;
  const vision = sections?.vision || defaultVision;
  const visionQuote = sections?.visionQuote || defaultVisionQuote;
  const values = sections?.values || defaultValues;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-primary to-primary">
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

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Missão</h2>
                </div>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {mission}
                </p>
              </div>
              <div className="bg-primary/5 p-8 rounded-3xl">
                <p className="text-lg text-foreground italic">
                  &ldquo;{missionQuote}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-green-50 p-8 rounded-3xl">
                <p className="text-lg text-green-900 italic">
                  &ldquo;{visionQuote}&rdquo;
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Visão</h2>
                </div>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {vision}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Valores</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Os princípios que orientam nossas ações e definem quem somos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {values.map((value: any, index: number) => {
              const Icon = valueIcons[value.icon] || Star;
              return (
                <div key={index} className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content from DB */}
      {content && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Conheça mais sobre nós</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Descubra nossa história, equipe e como podemos ajudar sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quem-somos"
              className="inline-flex items-center justify-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-bold hover:bg-primary/5 transition"
            >
              Quem Somos
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition"
            >
              Fale Conosco
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
