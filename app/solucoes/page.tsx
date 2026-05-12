export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lightbulb, Settings, Laptop, Monitor, FolderKanban, Headphones, Cloud, Server, Shield, Key, Database, HardDrive, Lock, Users, FileKey, Cpu, Globe, Building2 } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { IMAGES } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Soluções em TI",
  description: "Conheça todas as soluções em TI da M3Solutions: consultoria, gestão, NOC 24x7, multicloud, segurança, backup, licenciamento e mais."
};

const allIconsMap: { [key: string]: React.ComponentType<any> } = {
  Lightbulb, Settings, Laptop, Monitor, FolderKanban, Headphones, Cloud, Server, Shield, Key, Database, HardDrive, Lock, Users, FileKey, Cpu, Globe, Building2
};

function PartnerLogos({ logos, colorClass = "bg-white" }: { logos: { name: string; logo: string }[]; colorClass?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
      {logos.map((partner) => (
        <div key={partner.name} className={`${colorClass} rounded-lg p-3 h-12 flex items-center justify-center`}>
          <Image 
            src={partner.logo} 
            alt={partner.name} 
            width={80} 
            height={32} 
            className="h-6 w-auto object-contain opacity-80 hover:opacity-100 transition" 
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

function SolutionCard({ item, variant = "card" }: { item: any; variant?: "card" | "hero" | "partner" | "cloud" | "security" }) {
  const Icon = allIconsMap[item.icon ?? ""] ?? Cloud;
  const imageKey = item.image as keyof typeof IMAGES;
  
  if (variant === "cloud" || variant === "security") {
    return (
      <Link href={`/solucoes/${item.slug}`}>
        <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden h-full border border-gray-200 hover:border-primary/40 p-6">
          <div className="flex flex-col items-center text-center">
            {item.logo && (
              <div className="h-16 w-32 mb-4 flex items-center justify-center">
                <Image src={item.logo} alt={item.title} width={128} height={64} className="max-h-14 max-w-[120px] w-auto object-contain" unoptimized />
              </div>
            )}
            <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary transition">{item.title}</h3>
            <p className="text-gray-500 text-sm">{item.description}</p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "partner") {
    return (
      <Link href={`/solucoes/${item.slug}`}>
        <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden h-full border border-gray-200 hover:border-primary/40 p-5">
          <div className="flex flex-col items-center text-center">
            {item.logo && (
              <div className="h-14 w-28 mb-4 flex items-center justify-center">
                <Image src={item.logo} alt={item.title} width={112} height={56} className="max-h-12 max-w-[100px] w-auto object-contain" unoptimized />
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 w-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary transition">{item.title}</h3>
              <p className="text-gray-500 text-xs line-clamp-2">{item.description}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <Link href={`/solucoes/${item.slug}`}>
      <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden h-full border border-gray-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition">
            <Icon className="w-6 h-6 text-slate-600 group-hover:text-white transition" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition">{item.title || item.name}</h3>
            <p className="text-gray-600 text-sm">{item.description}</p>
          </div>
          <ArrowRight size={18} className="text-gray-400 group-hover:text-primary transition flex-shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  );
}

// Grid columns helper
function getGridClass(cols: number) {
  switch (cols) {
    case 2: return "grid md:grid-cols-2 gap-4";
    case 4: return "grid md:grid-cols-2 lg:grid-cols-4 gap-4";
    case 6: return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3";
    default: return "grid md:grid-cols-2 lg:grid-cols-3 gap-4";
  }
}

export default async function SolucoesPage() {
  // Fetch solutions and categories from DB
  let allSolutions: any[] = [];
  let allCategories: any[] = [];
  try {
    allSolutions = await prisma.solution.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
    });
    allCategories = await prisma.solutionCategory.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    });
  } catch (e) {
    console.error("Error fetching solutions/categories:", e);
  }

  // Separate parent and child categories
  const parentCategories = allCategories.filter((c: any) => !c.parentSlug);
  const childCategories = allCategories.filter((c: any) => c.parentSlug);

  // Group solutions by category (only main listing items: displayOrder < 100)
  const getSolutions = (slug: string) => allSolutions.filter(s => s.category === slug && s.displayOrder < 100);

  return (
    <>
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-br from-primary via-primary to-primary">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nossas Soluções</h1>
            <p className="text-xl text-primary-foreground/80">
              Soluções completas em TI para atender todas as necessidades da sua empresa, do suporte técnico à transformação digital multicloud.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic category sections */}
      {parentCategories.map((cat: any) => {
        const items = getSolutions(cat.slug);
        const children = childCategories.filter((c: any) => c.parentSlug === cat.slug);
        const childItems = children.flatMap((c: any) => getSolutions(c.slug));

        // Skip empty categories (no items and no child items)
        if (items.length === 0 && childItems.length === 0) return null;

        const bgClass = cat.bgVariant === "slate" ? "bg-slate-50" : "bg-white";
        const partnerLogos = cat.partnerLogos as { name: string; logo: string }[] | null;

        return (
          <section key={cat.slug} className={`py-16 ${bgClass}`}>
            <div className="container mx-auto px-4">
              <SectionTitle title={cat.label} subtitle={cat.subtitle || undefined} />

              {/* Partner logos above grid */}
              {partnerLogos && partnerLogos.length > 0 && (
                <PartnerLogos logos={partnerLogos} colorClass={cat.bgVariant === "slate" ? "bg-white" : "bg-slate-50"} />
              )}

              {/* Main items */}
              {items.length > 0 && (
                <div className={`${getGridClass(cat.gridCols)} ${children.length > 0 ? 'mb-10' : ''}`}>
                  {items.map((item: any) => (
                    <SolutionCard key={item.slug} item={item} variant={item.cardVariant || cat.defaultCardVariant || "card"} />
                  ))}
                </div>
              )}

              {/* Child category sub-sections */}
              {children.map((child: any) => {
                const cItems = getSolutions(child.slug);
                if (cItems.length === 0) return null;
                const childPartnerLogos = child.partnerLogos as { name: string; logo: string }[] | null;
                return (
                  <div key={child.slug}>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 mt-10 text-center">{child.label}</h3>
                    {childPartnerLogos && childPartnerLogos.length > 0 && (
                      <PartnerLogos logos={childPartnerLogos} colorClass={cat.bgVariant === "slate" ? "bg-white" : "bg-slate-50"} />
                    )}
                    <div className={getGridClass(child.gridCols)}>
                      {cItems.map((item: any) => (
                        <SolutionCard key={item.slug} item={item} variant={item.cardVariant || child.defaultCardVariant || "card"} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Não encontrou o que procura?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Fale com nossos especialistas e descubra a solução ideal para sua empresa.
          </p>
          <Link href="/contato" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition">
            Fale conosco <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
