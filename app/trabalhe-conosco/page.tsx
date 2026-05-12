export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { Users, Briefcase, GraduationCap, Heart, Rocket, Mail, MapPin } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Trabalhe Conosco - M3Solutions",
  description: "Junte-se à equipe M3Solutions. Confira nossas vagas e oportunidades de carreira em tecnologia."
};

const benefitIcons: Record<string, any> = { Heart, GraduationCap, Rocket, Users };

const defaultBenefits = [
  { icon: "Heart", title: "Plano de Saúde", description: "Cobertura médica completa para você e dependentes" },
  { icon: "GraduationCap", title: "Desenvolvimento", description: "Treinamentos, certificações e cursos pagos pela empresa" },
  { icon: "Rocket", title: "Crescimento", description: "Plano de carreira estruturado e promoções internas" },
  { icon: "Users", title: "Ambiente Colaborativo", description: "Equipe unida e cultura de respeito" },
];

const defaultPositions = [
  { title: "Analista de Suporte N2", department: "Suporte", location: "São Paulo - SP", type: "CLT" },
  { title: "Engenheiro de Cloud", department: "Infraestrutura", location: "Remoto", type: "CLT" },
  { title: "Consultor de Segurança", department: "Segurança", location: "São Paulo - SP", type: "CLT" },
  { title: "Analista de NOC", department: "NOC", location: "São Paulo - SP", type: "CLT" },
];

export default async function TrabalheConoscoPage() {
  const pageData = await getInstitutionalPage("trabalhe-conosco");

  const heroTitle = pageData?.heroTitle || "Trabalhe Conosco";
  const heroSubtitle = pageData?.heroSubtitle || "Faça parte de uma equipe apaixonada por tecnologia. Construa sua carreira na M3Solutions.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const benefits = sections?.benefits || defaultBenefits;
  const positions = sections?.positions || defaultPositions;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-primary to-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-8 h-8 text-primary/70" />
              <span className="text-primary/70 font-medium">Carreiras</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {heroTitle}
            </h1>
            <p className="text-xl text-primary-foreground/80">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que trabalhar na M3Solutions?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Oferecemos um ambiente de trabalho estimulante, com oportunidades de crescimento 
              e benefícios que valorizam nossos colaboradores.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit: any, index: number) => {
              const Icon = benefitIcons[benefit.icon] || Heart;
              return (
                <div key={index} className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
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

      {/* Open Positions */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Vagas Abertas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Confira nossas oportunidades atuais e candidate-se.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {positions.map((position: any, index: number) => (
              <div key={index} className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-primary/40 transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:rh@m3solutions.com.br?subject=Candidatura: ${position.title}`}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2 rounded-lg font-medium hover:bg-primary transition text-sm"
                  >
                    Candidatar-se
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Não encontrou a vaga ideal? Envie seu currículo para nosso banco de talentos:
            </p>
            <a
              href="mailto:rh@m3solutions.com.br?subject=Banco de Talentos"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Mail className="w-5 h-5" />
              rh@m3solutions.com.br
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para o próximo passo?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Envie seu currículo e venha fazer parte do time M3Solutions.
          </p>
          <a
            href="mailto:rh@m3solutions.com.br"
            className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-bold hover:bg-primary/5 transition"
          >
            <Mail className="w-5 h-5" />
            Enviar Currículo
          </a>
        </div>
      </section>
    </>
  );
}
