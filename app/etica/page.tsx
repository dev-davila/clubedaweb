export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Scale, Users, Shield, Heart, FileText, CheckCircle } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "C\u00f3digo de \u00c9tica - M3Solutions",
  description: "Conhe\u00e7a o C\u00f3digo de \u00c9tica da M3Solutions e nossos valores e princ\u00edpios de conduta."
};

const principleIcons: Record<string, any> = { Shield, Users, Heart, Scale };

const defaultPrinciples = [
  { icon: "Shield", title: "Integridade", description: "Agimos com honestidade e transpar\u00eancia em todas as nossas rela\u00e7\u00f5es, cumprindo nossos compromissos e respeitando as leis." },
  { icon: "Users", title: "Respeito", description: "Tratamos todos com dignidade e respeito, valorizando a diversidade e promovendo um ambiente inclusivo." },
  { icon: "Heart", title: "Responsabilidade", description: "Assumimos a responsabilidade por nossas a\u00e7\u00f5es e decis\u00f5es." },
  { icon: "Scale", title: "Justi\u00e7a", description: "Promovemos a equidade e a imparcialidade em todas as nossas decis\u00f5es e processos." },
];

const defaultCommitments = [
  { title: "Com nossos clientes", items: ["Oferecer solu\u00e7\u00f5es de qualidade e valor", "Proteger dados e informa\u00e7\u00f5es confidenciais", "Manter comunica\u00e7\u00e3o transparente e honesta", "Cumprir prazos e acordos estabelecidos"] },
  { title: "Com nossos colaboradores", items: ["Garantir um ambiente seguro e respeitoso", "Oferecer oportunidades de desenvolvimento", "Reconhecer e valorizar o desempenho", "Promover a diversidade e inclus\u00e3o"] },
  { title: "Com a sociedade", items: ["Atuar em conformidade com as leis", "Promover pr\u00e1ticas sustent\u00e1veis", "Contribuir para o desenvolvimento da comunidade", "Manter postura \u00e9tica no mercado"] },
];

export default async function EticaPage() {
  const pageData = await getInstitutionalPage("etica");

  const heroTitle = pageData?.heroTitle || "C\u00f3digo de \u00c9tica";
  const heroSubtitle = pageData?.heroSubtitle || "Os princ\u00edpios e valores que guiam nossas a\u00e7\u00f5es e decis\u00f5es.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const principles = sections?.principles || defaultPrinciples;
  const commitments = sections?.commitments || defaultCommitments;

  return (
    <>
      <section className="relative py-20 bg-gradient-to-br from-primary to-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-8 h-8 text-primary/70" />
              <span className="text-primary/70 font-medium">Nossos Valores</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{heroTitle}</h1>
            <p className="text-xl text-primary-foreground/80">{heroSubtitle}</p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {content ? (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
            ) : (
              <div className="prose max-w-none">
                <h2>Nosso Compromisso \u00c9tico</h2>
                <p>O C\u00f3digo de \u00c9tica da M3Solutions estabelece os princ\u00edpios e valores que orientam a conduta de todos.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Princ\u00edpios</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {principles.map((p: any, i: number) => {
              const Icon = principleIcons[p.icon] || Shield;
              return (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-gray-600 text-sm">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Compromissos</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {commitments.map((c: any, i: number) => (
                <div key={i} className="bg-primary/5 p-6 rounded-2xl">
                  <h3 className="font-bold text-gray-900 mb-4">{c.title}</h3>
                  <ul className="space-y-3">
                    {c.items.map((item: string, j: number) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <FileText className="w-16 h-16 text-primary/70 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Presenciou uma viola\u00e7\u00e3o?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">Utilize nosso Canal de Den\u00fancias para reportar situa\u00e7\u00f5es que violem este C\u00f3digo de \u00c9tica.</p>
          <Link href="/canal-de-denuncias" className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-bold hover:bg-primary/5 transition">Acessar Canal de Den\u00fancias</Link>
        </div>
      </section>
    </>
  );
}
