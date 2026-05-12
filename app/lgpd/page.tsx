export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Shield, FileText, User, Lock, Mail, ArrowRight } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "LGPD - Prote\u00e7\u00e3o de Dados",
  description: "Saiba como a M3Solutions trata seus dados pessoais em conformidade com a LGPD."
};

export default async function LGPDPage() {
  const pageData = await getInstitutionalPage("lgpd");

  const heroTitle = pageData?.heroTitle || "LGPD - Lei Geral de Prote\u00e7\u00e3o de Dados";
  const heroSubtitle = pageData?.heroSubtitle || "Nosso compromisso com a prote\u00e7\u00e3o dos seus dados pessoais.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const dpoEmail = sections?.dpoEmail || "privacidade@m3solutions.com.br";

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{heroTitle}</h1>
            <p className="text-xl text-primary-foreground/80">{heroSubtitle}</p>
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
                <h2>O que \u00e9 a LGPD?</h2>
                <p>A Lei Geral de Prote\u00e7\u00e3o de Dados (Lei n\u00ba 13.709/2018) \u00e9 a legisla\u00e7\u00e3o brasileira que regulamenta o tratamento de dados pessoais.</p>
                <h2>Como tratamos seus dados</h2>
                <p>A M3Solutions est\u00e1 comprometida com a prote\u00e7\u00e3o dos dados pessoais de seus clientes, parceiros e visitantes.</p>
              </div>
            )}

            <div className="mt-8 p-6 bg-primary/5 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Encarregado de Dados (DPO)</div>
                  <a href={`mailto:${dpoEmail}`} className="text-primary hover:underline">{dpoEmail}</a>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/aviso-de-privacidade" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary transition">
                <FileText size={20} /> Pol\u00edtica de Privacidade
              </Link>
              <Link href="/contato" className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition">
                Fale Conosco <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
