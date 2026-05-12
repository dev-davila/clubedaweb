export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Ban, Shield, AlertTriangle, FileText, CheckCircle, XCircle } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Pol\u00edtica Antissuborno e Anticorrup\u00e7\u00e3o - M3Solutions",
  description: "Conhe\u00e7a a Pol\u00edtica Antissuborno e Anticorrup\u00e7\u00e3o da M3Solutions."
};

const defaultProhibitions = [
  "Oferecer, prometer, dar ou aceitar suborno em qualquer forma",
  "Fazer pagamentos de facilita\u00e7\u00e3o a agentes p\u00fablicos",
  "Oferecer presentes ou hospitalidades indevidos",
  "Fazer doa\u00e7\u00f5es pol\u00edticas em nome da empresa sem aprova\u00e7\u00e3o",
  "Contratar fornecedores com base em rela\u00e7\u00f5es pessoais indevidas",
  "Falsificar registros cont\u00e1beis ou financeiros"
];

const defaultAllowed = [
  "Brindes promocionais de baixo valor (at\u00e9 R$ 100)",
  "Refei\u00e7\u00f5es de trabalho dentro de padr\u00f5es razo\u00e1veis",
  "Participa\u00e7\u00e3o em eventos corporativos transparentes",
  "Doa\u00e7\u00f5es a institui\u00e7\u00f5es de caridade aprovadas",
  "Patroc\u00ednios com contratos formais e transpar\u00eancia"
];

export default async function PoliticaAntissubornoPage() {
  const pageData = await getInstitutionalPage("politica-antissuborno-e-anticorrupcao");

  const heroTitle = pageData?.heroTitle || "Pol\u00edtica Antissuborno e Anticorrup\u00e7\u00e3o";
  const heroSubtitle = pageData?.heroSubtitle || "Nosso compromisso intransigente com a integridade e combate \u00e0 corrup\u00e7\u00e3o.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const prohibitions = sections?.prohibitions || defaultProhibitions;
  const allowed = sections?.allowed || defaultAllowed;

  return (
    <>
      <section className="relative py-20 bg-gradient-to-br from-red-900 to-red-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-8 h-8 text-red-300" />
              <span className="text-red-300 font-medium">Toler\u00e2ncia Zero</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{heroTitle}</h1>
            <p className="text-xl text-red-100">{heroSubtitle}</p>
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
                <h2>Nosso Compromisso</h2>
                <p>A M3Solutions possui toler\u00e2ncia zero para qualquer forma de corrup\u00e7\u00e3o, suborno ou pr\u00e1ticas anticompetitivas.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Proibido</h2>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                  <ul className="space-y-3">
                    {prohibitions.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Permitido</h2>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                  <ul className="space-y-3">
                    {allowed.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-red-900">
        <div className="container mx-auto px-4 text-center">
          <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Suspeita de viola\u00e7\u00e3o?</h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">Denuncie imediatamente atrav\u00e9s do nosso Canal de Den\u00fancias.</p>
          <Link href="/canal-de-denuncias" className="inline-flex items-center gap-2 bg-white text-red-900 px-8 py-4 rounded-xl font-bold hover:bg-red-50 transition">Fazer Den\u00fancia</Link>
        </div>
      </section>
    </>
  );
}
