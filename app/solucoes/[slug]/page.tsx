export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, Phone } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { IMAGES, SITE_CONFIG } from "@/lib/constants";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { prisma } from "@/lib/db";
import { solutionsData } from "@/lib/solutions-data";

async function getSolution(slug: string) {
  try {
    const dbSolution = await prisma.solution.findFirst({
      where: { slug, active: true },
    });
    if (dbSolution) {
      return {
        title: dbSolution.title,
        subtitle: dbSolution.subtitle,
        image: dbSolution.image,
        description: dbSolution.description,
        longDescription: dbSolution.longDescription,
        benefits: dbSolution.benefits as string[] | null,
        features: dbSolution.features as any[] | null,
        highlights: dbSolution.highlights as string[] | null,
        extraSections: dbSolution.extraSections as any[] | null,
        partnerLogos: dbSolution.partnerLogos as string[] | null,
        dataCenterPartners: dbSolution.dataCenterPartners as any[] | null,
      };
    }
  } catch (e) {
    console.error("Error fetching solution from DB:", e);
  }
  // Fallback to hardcoded data
  return solutionsData[slug] || null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const solution = await getSolution(params?.slug ?? "");
  if (!solution) return { title: "Solução não encontrada" };
  return {
    title: solution.title,
    description: solution.description?.substring(0, 160)
  };
}

export default async function SolutionPage({ params }: { params: { slug: string } }) {
  const solution = await getSolution(params?.slug ?? "");
  if (!solution) notFound();

  const imageKey = solution.image as keyof typeof IMAGES;
  const imageUrl = IMAGES[imageKey] ?? IMAGES.hero;

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 min-h-[50vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image src={imageUrl} alt={solution.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-primary-foreground/85 text-sm mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/solucoes" className="hover:text-white">Soluções</Link>
              <span>/</span>
              <span className="text-white">{solution.title}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{solution.title}</h1>
            <p className="text-xl text-primary-foreground/80">{solution.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed text-center mb-8">{solution.description}</p>
            {solution.longDescription && (
              <p className="text-lg text-gray-600 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: sanitizeHtml(solution.longDescription) }} />
            )}
            {/* Highlights */}
            {solution.highlights && solution.highlights.length > 0 && (
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {solution.highlights.map((highlight: string, idx: number) => (
                  <div key={idx} className="inline-flex items-center gap-2 bg-primary/5 text-primary px-5 py-3 rounded-full text-sm font-medium border border-primary/30">
                    <CheckCircle className="w-4 h-4" />
                    {highlight}
                  </div>
                ))}
              </div>
            )}
            {/* Partner Logos */}
            {solution.partnerLogos && solution.partnerLogos.length > 0 && (
              <div className="mt-12 pt-10 border-t border-gray-200">
                <div className="text-center mb-8">
                  <p className="text-lg font-semibold text-gray-800 mb-2">Parceiros Certificados</p>
                  <p className="text-sm text-gray-500">Trabalhamos com os melhores fornecedores do mercado</p>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  {solution.partnerLogos.map((logo: string, idx: number) => {
                    const logoUrls: Record<string, string> = {
                      sophos: "https://cdn.m3solutions.net.br/partners/sophos.png",
                      sonicwall: "https://cdn.m3solutions.net.br/partners/sonicwall.png",
                      fortinet: "https://cdn.m3solutions.net.br/partners/fortinet.png",
                      blockbit: "https://cdn.m3solutions.net.br/partners/blockbit.png",
                      safetica: "https://cdn.m3solutions.net.br/partners/safetica.svg",
                      bitdefender: "https://cdn.m3solutions.net.br/partners/bitdefender.png",
                      kaspersky: "https://cdn.m3solutions.net.br/partners/kaspersky.png",
                      eset: "https://cdn.m3solutions.net.br/partners/eset.png",
                      panda: "https://cdn.m3solutions.net.br/partners/panda.png",
                      acronis: "https://cdn.m3solutions.net.br/partners/acronis.png"
                    };
                    const logoLinks: Record<string, string> = {
                      bitdefender: "/bitdefender-gravityzone-business-security-enterprise",
                      safetica: "/solucoes/safetica",
                      // Sophos link: endpoint protection page for antivirus, firewall page for firewall
                      sophos: params?.slug === "antivirus" ? "/solucoes/sophos" : "/solucoes/sophos-utm",
                      sonicwall: "/solucoes/sonicwall",
                      fortinet: "/solucoes/fortinet",
                      blockbit: "/solucoes/blockbit",
                      kaspersky: "/solucoes/kaspersky",
                      eset: "/solucoes/eset",
                      acronis: "/solucoes/acronis"
                    };
                    const logoContent = (
                      <div className={`flex items-center justify-center bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 h-24 w-40 ${logoLinks[logo] ? 'cursor-pointer' : ''}`}>
                        <img 
                          src={logoUrls[logo] || `/images/partners/${logo}.png`} 
                          alt={logo.charAt(0).toUpperCase() + logo.slice(1)} 
                          className="max-h-14 w-auto object-contain"
                        />
                      </div>
                    );
                    return logoLinks[logo] ? (
                      <Link key={idx} href={logoLinks[logo]}>
                        {logoContent}
                      </Link>
                    ) : (
                      <div key={idx}>{logoContent}</div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle title="Benefícios" subtitle="Vantagens de contar com nossa solução" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {solution.benefits?.map((benefit: string) => (
              <div key={benefit} className="flex items-start gap-3 bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionTitle title="Recursos" subtitle="O que está incluído na solução" />
          <div className={`grid gap-6 max-w-6xl mx-auto ${
            solution.features?.length === 3 ? 'md:grid-cols-3' :
            solution.features?.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
            'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {solution.features?.map((feature: any) => (
              feature.link ? (
                <Link 
                  key={feature.title} 
                  href={feature.link}
                  className="p-6 bg-gradient-to-br from-primary/5 to-white rounded-2xl border border-primary/20 hover:border-primary/40 hover:shadow-lg transition group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition flex items-center gap-2">
                    {feature.title}
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </Link>
              ) : (
                <div key={feature.title} className="p-6 bg-gradient-to-br from-primary/5 to-white rounded-2xl border border-primary/20 hover:border-primary/30 transition">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Data Center Partners Section (for nuvem-privada) */}
      {solution.dataCenterPartners && (
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">NOSSOS DATA CENTERS</h2>
              <div className="border-t border-gray-200 my-8"></div>
              <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Data Center Logos - Triangular Layout with Clockwise Arrows */}
                <div className="flex flex-col items-center">
                  <div className="relative w-[380px] h-[320px]">
                    {/* Equinix - Top center */}
                    <Link 
                      href="/solucoes/equinix-datacenter"
                      className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center group"
                    >
                      <img 
                        src={solution.dataCenterPartners?.[0]?.logo || "https://cdn.m3solutions.net.br/partners/equinix-original.png"}
                        alt="Equinix Data Center" 
                        className="w-[140px] h-auto group-hover:scale-110 transition-transform"
                      />
                    </Link>
                    
                    {/* Ascenty - Bottom left */}
                    <Link 
                      href="/solucoes/ascenty-datacenter"
                      className="absolute bottom-8 left-0 flex flex-col items-center group"
                    >
                      <img 
                        src={solution.dataCenterPartners?.[1]?.logo || "https://cdn.m3solutions.net.br/partners/ascenty-original.png"}
                        alt="Ascenty Data Center" 
                        className="w-[140px] h-auto group-hover:scale-110 transition-transform"
                      />
                    </Link>
                    
                    {/* Elea - Bottom right */}
                    <Link 
                      href="/solucoes/elea-datacenter"
                      className="absolute bottom-8 right-0 flex flex-col items-center group"
                    >
                      <img 
                        src={solution.dataCenterPartners?.[2]?.logo || "https://cdn.m3solutions.net.br/partners/elea-original.png"}
                        alt="Elea Data Center" 
                        className="w-[140px] h-auto group-hover:scale-110 transition-transform"
                      />
                    </Link>
                    
                    {/* Curved Arrow - Top Right (Equinix → Elea) - Clockwise */}
                    <svg 
                      className="absolute top-[70px] right-[30px] w-[100px] h-[120px]"
                      viewBox="0 0 100 120"
                      fill="none"
                    >
                      <path 
                        d="M20 15 C70 20, 100 70, 80 110" 
                        stroke="#9CA3AF" 
                        strokeWidth="3" 
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Curved Arrow - Bottom (Elea → Ascenty) - Clockwise */}
                    <svg 
                      className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[200px] h-[60px]"
                      viewBox="0 0 200 60"
                      fill="none"
                    >
                      <path 
                        d="M180 20 C140 50, 60 50, 20 20" 
                        stroke="#9CA3AF" 
                        strokeWidth="3" 
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Curved Arrow - Left (Ascenty → Equinix) - Clockwise */}
                    <svg 
                      className="absolute top-[70px] left-[30px] w-[100px] h-[120px]"
                      viewBox="0 0 100 120"
                      fill="none"
                    >
                      <path 
                        d="M20 110 C0 70, 30 20, 80 15" 
                        stroke="#9CA3AF" 
                        strokeWidth="3" 
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  
                  {/* Caption below logos */}
                  <p className="text-gray-500 text-sm text-center mt-8 max-w-xs">
                    Clique em cada data center para conhecer suas certificações e diferenciais técnicos
                  </p>
                </div>
                
                {/* Description */}
                <div className="pt-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Na M3Solutions sua empresa conta com uma infraestrutura de data centers robusta e confiável.
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Oferecemos tecnologia de ponta, alta disponibilidade e segurança avançada para proteger e potencializar seus dados. Com ambientes certificados e estrutura escalável, garantimos performance, estabilidade e tranquilidade para o seu negócio crescer com confiança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Extra Sections - for detailed content like sustainability, differentials */}
      {solution.extraSections && solution.extraSections.map((section: any, idx: number) => {
        // Skip datacenter-partners type as it's rendered above
        if (section.type === 'datacenter-partners') return null;
        
        return (
          <section key={idx} className={`py-16 ${idx % 2 === 0 ? 'bg-gradient-to-b from-gray-50 to-white' : ''}`}>
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">{section.description}</p>
                </div>
                <div className={`grid gap-4 ${
                  section.layout === 'single-row' ? 'md:grid-cols-2 lg:grid-cols-4' :
                  section.layout === 'grid-4' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {section.items?.map((item: string, itemIdx: number) => (
                    <div key={itemIdx} className="flex items-start gap-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Quer saber mais sobre {solution.title}?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">Entre em contato com nossos especialistas e descubra como podemos ajudar.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contato" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition">
              Solicitar proposta <ArrowRight size={20} />
            </Link>
            <a href={SITE_CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition">
              <Phone size={20} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
