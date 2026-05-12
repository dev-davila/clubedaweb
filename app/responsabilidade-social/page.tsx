export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { Heart, Users, GraduationCap, Handshake, Gift, Star } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Responsabilidade Social - M3Solutions",
  description: "Conheça as ações de responsabilidade social da M3Solutions e nosso compromisso com a comunidade."
};

const programIcons: Record<string, any> = { GraduationCap, Users, Gift, Handshake, Heart };

const defaultPrograms = [
  { icon: "GraduationCap", title: "Educação Digital", description: "Oferecemos cursos gratuitos de informática básica para jovens de comunidades carentes, preparando-os para o mercado de trabalho." },
  { icon: "Users", title: "Inclusão Digital", description: "Doamos equipamentos de TI reformados para escolas públicas e ONGs, ampliando o acesso à tecnologia." },
  { icon: "Gift", title: "Campanhas Solidárias", description: "Realizamos campanhas de arrecadação de alimentos, agasalhos e materiais escolares ao longo do ano." },
  { icon: "Handshake", title: "Voluntariado Corporativo", description: "Incentivamos nossos colaboradores a dedicar horas de trabalho para ações voluntárias na comunidade." },
];

const defaultImpacts = [
  { value: "500+", label: "Jovens capacitados" },
  { value: "200+", label: "Equipamentos doados" },
  { value: "15", label: "ONGs parceiras" },
  { value: "1000+", label: "Horas de voluntariado" },
];

export default async function ResponsabilidadeSocialPage() {
  const pageData = await getInstitutionalPage("responsabilidade-social");

  const heroTitle = pageData?.heroTitle || "Responsabilidade Social";
  const heroSubtitle = pageData?.heroSubtitle || "Transformando vidas através da tecnologia e do compromisso com a comunidade.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const programs = sections?.programs || defaultPrograms;
  const impacts = sections?.impacts || defaultImpacts;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-purple-900 to-purple-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-purple-300" />
              <span className="text-purple-300 font-medium">Compromisso Social</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {heroTitle}
            </h1>
            <p className="text-xl text-purple-100">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {impacts.map((impact: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                  {impact.value}
                </div>
                <div className="text-gray-600">{impact.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {content ? (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
            ) : (
              <div className="prose max-w-none">
                <h2>Nosso Compromisso</h2>
                <p>
                  A M3Solutions acredita que empresas têm um papel fundamental na construção 
                  de uma sociedade mais justa e igualitária. Por isso, desenvolvemos programas 
                  de responsabilidade social que utilizam a tecnologia como ferramenta de 
                  transformação social.
                </p>
                <p>
                  Nosso foco está na educação digital e na inclusão tecnológica, pois 
                  acreditamos que o acesso à tecnologia é essencial para o desenvolvimento 
                  pessoal e profissional das pessoas.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Programas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Iniciativas que geram impacto positivo na comunidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {programs.map((program: any, index: number) => {
              const Icon = programIcons[program.icon] || Heart;
              return (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
                  <p className="text-gray-600">{program.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-purple-800">
        <div className="container mx-auto px-4 text-center">
          <Star className="w-16 h-16 text-purple-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Quer ser parceiro?</h2>
          <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
            Se você representa uma ONG ou instituição e quer conhecer nossos programas 
            de responsabilidade social, entre em contato conosco.
          </p>
        </div>
      </section>
    </>
  );
}
