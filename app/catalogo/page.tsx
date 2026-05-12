export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Shield, HardDrive, Server, Users, Network, Database, Building, Code, Palette, PenTool, Monitor } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { softwareCategories, getAllProducts } from "@/lib/software-catalog";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Catálogo de Software | M3 Solutions",
  description: "Catálogo completo de software empresarial: Microsoft, Adobe, Autodesk, Segurança, Backup, Virtualização e muito mais.",
};

const categoryIcons: { [key: string]: any } = {
  Microsoft: Monitor,
  Palette: Palette,
  PenTool: PenTool,
  Shield: Shield,
  HardDrive: HardDrive,
  Server: Server,
  Users: Users,
  Network: Network,
  Database: Database,
  Building: Building,
  Code: Code,
};

export default async function CatalogoPage() {
  // Fetch categories with product counts from DB
  let categories: { slug: string; name: string; description: string; icon: string; productCount: number }[] = [];
  let totalProducts = 0;

  try {
    const dbCategories = await prisma.softwareCategory.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
    });
    if (dbCategories.length > 0) {
      categories = dbCategories.map((c: any) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        productCount: c._count.products,
      }));
      totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);
    }
  } catch (e) {
    console.error("Error fetching software categories:", e);
  }

  // Fallback to hardcoded data
  if (categories.length === 0) {
    categories = softwareCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      productCount: c.products.length,
    }));
    totalProducts = getAllProducts().length;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary to-primary">
        <div className="absolute inset-0 bg-[url('/images/hero-background.jpg')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-primary-foreground/85 text-sm mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-white">Catálogo de Software</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Catálogo de Software</h1>
            <p className="text-xl text-primary-foreground/80 mb-4">
              Mais de {totalProducts} produtos das principais marcas mundiais
            </p>
            <p className="text-primary-foreground/85">
              Encontre as melhores soluções de software para sua empresa. Oferecemos licenciamento, implementação e suporte especializado.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{categories.length}</p>
              <p className="text-gray-600">Categorias</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{totalProducts}+</p>
              <p className="text-gray-600">Produtos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">50+</p>
              <p className="text-gray-600">Fabricantes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">20+</p>
              <p className="text-gray-600">Anos de Experiência</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Categorias de Software" 
            subtitle="Navegue por categoria e encontre a solução ideal para sua empresa" 
          />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.icon] || Package;
              return (
                <Link 
                  key={category.slug} 
                  href={`/catalogo/${category.slug}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                      <IconComponent className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-medium">
                        {category.productCount} produtos
                      </span>
                      <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Principais Fabricantes" 
            subtitle="Somos parceiros autorizados das melhores marcas" 
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Microsoft', color: 'bg-primary' },
              { name: 'Adobe', color: 'bg-red-600' },
              { name: 'Autodesk', color: 'bg-green-600' },
              { name: 'Kaspersky', color: 'bg-green-500' },
              { name: 'Veeam', color: 'bg-green-700' },
              { name: 'VMware', color: 'bg-primary' },
              { name: 'Sophos', color: 'bg-primary' },
              { name: 'ESET', color: 'bg-primary/60' },
              { name: 'Acronis', color: 'bg-primary' },
              { name: 'SAP', color: 'bg-primary' },
              { name: 'Oracle', color: 'bg-red-700' },
              { name: 'Salesforce', color: 'bg-primary' },
            ].map((vendor) => (
              <div key={vendor.name} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-center h-20 hover:shadow-md transition">
                <span className={`text-sm font-bold text-gray-700`}>{vendor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Por que comprar conosco?" 
            subtitle="Vantagens de adquirir software com a M3 Solutions" 
          />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { title: 'Preços Competitivos', description: 'Melhores condições do mercado como parceiro autorizado' },
              { title: 'Suporte Especializado', description: 'Equipe certificada para implementação e suporte' },
              { title: 'Licenciamento Correto', description: 'Assessoria para escolher a licença ideal' },
              { title: 'Integração Completa', description: 'Implementamos e integramos com seu ambiente' },
            ].map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Não encontrou o que procura?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Entre em contato conosco. Trabalhamos com uma ampla variedade de fabricantes e podemos conseguir qualquer software que sua empresa precise.
          </p>
          <Link 
            href="/contato" 
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition"
          >
            Solicitar orçamento <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
