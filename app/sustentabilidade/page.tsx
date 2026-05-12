export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { Leaf, Recycle, Zap, Globe, TreePine, Droplets, CheckCircle } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Sustentabilidade - M3Solutions",
  description: "Conheça as práticas e compromissos de sustentabilidade da M3Solutions para um futuro mais verde."
};

const initiativeIcons: Record<string, any> = { Recycle, Zap, TreePine, Globe, Leaf };

const defaultInitiatives = [
  { icon: "Recycle", title: "Descarte Responsável", description: "Realizamos o descarte correto de equipamentos eletrônicos através de empresas certificadas, evitando a contaminação do meio ambiente." },
  { icon: "Zap", title: "Eficiência Energética", description: "Implementamos soluções de TI que otimizam o consumo de energia, como virtualização de servidores e cloud computing." },
  { icon: "TreePine", title: "Escritório Verde", description: "Reduzimos o uso de papel, priorizamos documentos digitais e utilizamos materiais recicláveis em nosso escritório." },
  { icon: "Globe", title: "Trabalho Remoto", description: "Incentivamos o trabalho remoto, reduzindo deslocamentos e a pegada de carbono de nossos colaboradores." },
];

const defaultGoals = [
  "Reduzir em 30% o consumo de energia até 2027",
  "100% de descarte certificado de e-lixo",
  "Neutralizar emissões de carbono até 2030",
  "Eliminar uso de plástico descartável no escritório",
  "Promover certificações ambientais em parceiros"
];

export default async function SustentabilidadePage() {
  const pageData = await getInstitutionalPage("sustentabilidade");

  const heroTitle = pageData?.heroTitle || "Sustentabilidade";
  const heroSubtitle = pageData?.heroSubtitle || "Nosso compromisso com um futuro mais sustentável através da tecnologia responsável.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const initiatives = sections?.initiatives || defaultInitiatives;
  const goals = sections?.goals || defaultGoals;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-green-800 to-green-700">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-8 h-8 text-green-300" />
              <span className="text-green-300 font-medium">Compromisso Ambiental</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {heroTitle}
            </h1>
            <p className="text-xl text-green-100">
              {heroSubtitle}
            </p>
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
                <h2>TI Verde e Responsável</h2>
                <p>
                  Na M3Solutions, acreditamos que a tecnologia deve ser uma aliada do meio ambiente. 
                  Por isso, implementamos práticas sustentáveis em todas as nossas operações, 
                  desde a escolha de equipamentos até a gestão de resíduos eletrônicos.
                </p>
                <p>
                  Nosso compromisso vai além de reduzir nosso próprio impacto ambiental. 
                  Ajudamos nossos clientes a implementar soluções de TI mais eficientes e 
                  sustentáveis, contribuindo para a redução do consumo de energia e recursos naturais.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Initiatives */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossas Iniciativas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ações concretas que fazem a diferença para o meio ambiente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {initiatives.map((initiative: any, index: number) => {
              const Icon = initiativeIcons[initiative.icon] || Leaf;
              return (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{initiative.title}</h3>
                  <p className="text-gray-600">{initiative.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossas Metas</h2>
              <p className="text-gray-600">
                Compromissos que guiam nossas ações sustentáveis.
              </p>
            </div>

            <div className="bg-green-50 p-8 rounded-2xl">
              <ul className="space-y-4">
                {goals.map((goal: any, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-800 font-medium">{typeof goal === 'string' ? goal : goal.label || goal.text || ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-800">
        <div className="container mx-auto px-4 text-center">
          <Droplets className="w-16 h-16 text-green-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Juntos por um futuro melhor</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Quer saber como sua empresa pode ser mais sustentável com a tecnologia certa? 
            Fale conosco.
          </p>
        </div>
      </section>
    </>
  );
}
