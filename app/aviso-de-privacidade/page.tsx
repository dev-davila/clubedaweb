export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Aviso de Privacidade",
  description: "Pol\u00edtica de privacidade da M3Solutions - Saiba como coletamos e utilizamos seus dados."
};

export default async function PrivacidadePage() {
  const pageData = await getInstitutionalPage("aviso-de-privacidade");

  const heroTitle = pageData?.heroTitle || "Aviso de Privacidade";
  const heroSubtitle = pageData?.heroSubtitle || "\u00daltima atualiza\u00e7\u00e3o: Janeiro de 2024";
  const content = pageData?.content || null;

  return (
    <>
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
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
                <h2>1. Introdu\u00e7\u00e3o</h2>
                <p>A M3Solutions est\u00e1 comprometida em proteger sua privacidade.</p>
              </div>
            )}

            <div className="max-w-4xl mx-auto mt-12">
              <Link href="/lgpd" className="text-primary font-medium hover:underline">\u2190 Ver informa\u00e7\u00f5es sobre LGPD</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
