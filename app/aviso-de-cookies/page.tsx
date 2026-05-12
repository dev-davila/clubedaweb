export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Cookie, Settings, BarChart, Shield, CheckCircle } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Aviso de Cookies - M3Solutions",
  description: "Saiba como a M3Solutions utiliza cookies em seu site e como gerenciar suas prefer\u00eancias."
};

const defaultCookieTypes = [
  { icon: "Shield", title: "Cookies Essenciais", description: "Necess\u00e1rios para o funcionamento b\u00e1sico do site.", examples: ["Autentica\u00e7\u00e3o de usu\u00e1rios", "Seguran\u00e7a do site", "Prefer\u00eancias de sess\u00e3o"] },
  { icon: "BarChart", title: "Cookies de An\u00e1lise", description: "Nos ajudam a entender como os visitantes interagem com o site.", examples: ["Google Analytics", "Tempo de perman\u00eancia", "P\u00e1ginas visitadas"] },
  { icon: "Settings", title: "Cookies de Funcionalidade", description: "Permitem que o site lembre de suas escolhas.", examples: ["Idioma preferido", "Regi\u00e3o", "Prefer\u00eancias de exibi\u00e7\u00e3o"] },
];

const iconMap: Record<string, any> = { Shield, BarChart, Settings };

export default async function AvisoCookiesPage() {
  const pageData = await getInstitutionalPage("aviso-de-cookies");

  const heroTitle = pageData?.heroTitle || "Aviso de Cookies";
  const heroSubtitle = pageData?.heroSubtitle || "Entenda como utilizamos cookies para melhorar sua experi\u00eancia em nosso site.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const cookieTypes = sections?.cookieTypes || defaultCookieTypes;

  return (
    <>
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-8 h-8 text-primary/70" />
              <span className="text-primary/70 font-medium">Privacidade</span>
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
                <h2>O que s\u00e3o Cookies?</h2>
                <p>Cookies s\u00e3o pequenos arquivos de texto armazenados em seu dispositivo.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tipos de Cookies</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {cookieTypes.map((type: any, index: number) => {
              const IconComp = iconMap[type.icon] || Shield;
              return (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <IconComp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                  {type.examples && (
                    <ul className="space-y-2">
                      {type.examples.map((ex: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" /> {ex}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
            <Link href="/aviso-de-privacidade" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary transition">Aviso de Privacidade</Link>
            <Link href="/lgpd" className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition">LGPD</Link>
          </div>
        </div>
      </section>
    </>
  );
}
