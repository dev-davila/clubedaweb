export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Cloud, Shield, Server } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { IMAGES } from "@/lib/constants";
import { getInstitutionalPage } from "@/lib/institutional";

export const metadata: Metadata = {
  title: "Portfólio",
  description: "Conheça os cases de sucesso da M3Solutions e veja como ajudamos empresas a transformar sua TI."
};

const caseIcons: Record<string, any> = { Cloud, Server, Shield, Building2 };
const caseImages: Record<string, string> = {
  "Multicloud": IMAGES.cloud,
  "NOC": IMAGES.noc,
  "Segurança": IMAGES.seguranca,
  "Gestão": IMAGES.gestao,
  "Projetos": IMAGES.servidores,
  "Consultoria": IMAGES.consultoria,
};

const defaultCases = [
  { title: "Migração Multicloud para Indústria", client: "Indústria Metalúrgica ABC", category: "Multicloud", icon: "Cloud", description: "Migração de toda a infraestrutura on-premise para ambiente multicloud (AWS + Azure), resultando em 40% de redução de custos.", results: ["40% redução de custos", "99.99% de uptime", "DR automatizado"] },
  { title: "NOC 24x7 para Fintech", client: "Fintech Solutions LTDA", category: "NOC", icon: "Server", description: "Implementação de monitoramento 24x7 para ambiente crítico de transações financeiras.", results: ["Zero downtime", "MTTR < 15min", "100% SLA atingido"] },
  { title: "Segurança e LGPD", client: "Rede de Clínicas Médicas", category: "Segurança", icon: "Shield", description: "Projeto completo de adequação à LGPD e implementação de soluções de segurança.", results: ["100% compliance LGPD", "Zero incidentes", "DLP implementado"] },
  { title: "Gestão de TI Terceirizada", client: "Escritório de Advocacia", category: "Gestão", icon: "Building2", description: "Terceirização completa da TI com redução de custos e melhoria de serviços.", results: ["35% economia", "NPS > 90", "Help Desk 24h"] },
  { title: "Data Center para Logística", client: "Transportadora Express", category: "Projetos", icon: "Server", description: "Projeto e implementação de data center modular para suportar operação logística nacional.", results: ["Tier III", "PUE 1.4", "Escalável"] },
  { title: "Transformação Digital", client: "Varejo Fashion", category: "Consultoria", icon: "Cloud", description: "Consultoria e implementação de estratégia de transformação digital para rede de lojas.", results: ["E-commerce integrado", "+50% vendas online", "Omnichannel"] },
];

export default async function PortfolioPage() {
  const pageData = await getInstitutionalPage("portfolio");

  const heroTitle = pageData?.heroTitle || "Portfólio";
  const heroSubtitle = pageData?.heroSubtitle || "Conheça alguns dos projetos que realizamos e os resultados que entregamos para nossos clientes.";
  const sections = pageData?.sections as any;
  const cases = sections?.cases || defaultCases;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{heroTitle}</h1>
            <p className="text-xl text-primary-foreground/80">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Cases de Sucesso"
            subtitle="Projetos reais que transformaram a TI de nossos clientes"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cases.map((caseItem: any) => {
              const Icon = caseIcons[caseItem.icon] || Cloud;
              const image = caseImages[caseItem.category] || IMAGES.cloud;
              return (
                <div
                  key={caseItem.title}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={image}
                      alt={caseItem.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                        {caseItem.category}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {caseItem.title}
                    </h3>
                    <p className="text-primary text-sm font-medium mb-3">
                      {caseItem.client}
                    </p>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {caseItem.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(caseItem.results || []).map((result: string) => (
                        <span
                          key={result}
                          className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded"
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100+</div>
              <div className="text-primary-foreground/80">Projetos entregues</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-primary-foreground/80">Clientes atendidos</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">98%</div>
              <div className="text-primary-foreground/80">Satisfação</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">15+</div>
              <div className="text-primary-foreground/80">Anos no mercado</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Quer ver seu projeto aqui?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Entre em contato e vamos conversar sobre como podemos ajudar sua empresa.
          </p>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary transition"
          >
            Fale conosco
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
