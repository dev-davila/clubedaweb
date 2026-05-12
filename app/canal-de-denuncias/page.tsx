export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Shield, Phone, Mail, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { getInstitutionalPage } from "@/lib/institutional";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const metadata: Metadata = {
  title: "Canal de Den\u00fancias - M3Solutions",
  description: "Canal seguro e confidencial para relatar condutas anti\u00e9ticas, irregularidades ou viola\u00e7\u00f5es de pol\u00edticas da M3Solutions."
};

const guaranteeIcons: Record<string, any> = { Lock, Shield, CheckCircle };
const guaranteeColors: Record<string, string> = { blue: "bg-primary/5", green: "bg-green-50", purple: "bg-purple-50" };
const guaranteeIconColors: Record<string, string> = { blue: "text-primary", green: "text-green-600", purple: "text-purple-600" };

export default async function CanalDenunciasPage() {
  const pageData = await getInstitutionalPage("canal-de-denuncias");

  const heroTitle = pageData?.heroTitle || "Canal de Den\u00fancias";
  const heroSubtitle = pageData?.heroSubtitle || "Um canal seguro e confidencial para relatar condutas anti\u00e9ticas, irregularidades ou viola\u00e7\u00f5es de pol\u00edticas.";
  const content = pageData?.content || null;
  const sections = pageData?.sections as any;
  const guarantees = sections?.guarantees || [
    { title: "Confidencialidade", description: "Sua identidade ser\u00e1 protegida.", icon: "Lock", color: "blue" },
    { title: "N\u00e3o Retalia\u00e7\u00e3o", description: "Garantimos prote\u00e7\u00e3o contra retalia\u00e7\u00e3o.", icon: "Shield", color: "green" },
    { title: "Investiga\u00e7\u00e3o Imparcial", description: "Todas as den\u00fancias s\u00e3o investigadas.", icon: "CheckCircle", color: "purple" }
  ];
  const contacts = sections?.contacts || [
    { type: "email", label: "E-mail", value: "etica@m3solutions.com.br", description: "Envie sua den\u00fancia detalhada por e-mail." },
    { type: "phone", label: "Telefone", value: "(11) 3522-8393", description: "Ligue para nosso canal de \u00e9tica." }
  ];

  return (
    <>
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-primary/70" />
              <span className="text-primary/70 font-medium">Confidencial e Seguro</span>
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
                <h2>Sobre o Canal de Den\u00fancias</h2>
                <p>O Canal de Den\u00fancias da M3Solutions \u00e9 uma ferramenta essencial para manter nossos padr\u00f5es \u00e9ticos.</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 my-8">
              {guarantees.map((g: any, i: number) => {
                const Icon = guaranteeIcons[g.icon] || Shield;
                return (
                  <div key={i} className={`${guaranteeColors[g.color] || "bg-primary/5"} p-6 rounded-2xl`}>
                    <Icon className={`w-10 h-10 ${guaranteeIconColors[g.color] || "text-primary"} mb-4`} />
                    <h3 className="font-bold text-gray-900 mb-2">{g.title}</h3>
                    <p className="text-gray-600 text-sm">{g.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              {contacts.map((c: any, i: number) => (
                <div key={i} className="border border-gray-200 p-6 rounded-2xl hover:border-primary/40 transition">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 ${c.type === "email" ? "bg-primary/10" : "bg-green-100"} rounded-xl flex items-center justify-center`}>
                      {c.type === "email" ? <Mail className="w-6 h-6 text-primary" /> : <Phone className="w-6 h-6 text-green-600" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{c.label}</div>
                      <a href={c.type === "email" ? `mailto:${c.value}` : `tel:${c.value.replace(/\D/g, "")}`} className="text-primary hover:underline">{c.value}</a>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{c.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl my-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Importante</h3>
                  <p className="text-gray-700 text-sm">Ao fazer uma den\u00fancia, procure fornecer o m\u00e1ximo de informa\u00e7\u00f5es poss\u00edvel: datas, locais, pessoas envolvidas e evid\u00eancias, se houver.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <Link href="/etica" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary transition">C\u00f3digo de \u00c9tica</Link>
              <Link href="/politica-antissuborno-e-anticorrupcao" className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition">Pol\u00edtica Antissuborno</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
