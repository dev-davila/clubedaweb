export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Package, Shield, HardDrive, Server, Users, Network, Database, Building, Code, Palette, PenTool, Monitor, Search } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { getCategoryBySlug, softwareCategories } from "@/lib/software-catalog";
import { prisma } from "@/lib/db";

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

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  let name = "";
  let description = "";
  try {
    const dbCat = await prisma.softwareCategory.findFirst({ where: { slug: params?.categoria ?? "", active: true } });
    if (dbCat) { name = dbCat.name; description = dbCat.description || ""; }
  } catch (e) { /* fallback */ }
  if (!name) {
    const cat = getCategoryBySlug(params?.categoria ?? "");
    if (cat) { name = cat.name; description = cat.description; }
  }
  if (!name) return { title: "Categoria não encontrada" };
  return {
    title: `${name} | Catálogo de Software | M3 Solutions`,
    description,
  };
}

export default async function CategoriaPage({ params }: { params: { categoria: string } }) {
  const slug = params?.categoria ?? "";

  // Fetch from DB
  let category: { slug: string; name: string; description: string; icon: string } | null = null;
  let products: { slug: string; name: string; shortDescription: string; vendor: string }[] = [];
  let allCategories: { slug: string; name: string; icon: string; productCount: number }[] = [];

  try {
    const dbCat = await prisma.softwareCategory.findFirst({
      where: { slug, active: true },
      include: {
        products: {
          where: { active: true },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          select: { slug: true, name: true, shortDescription: true, vendor: true },
        },
      },
    });
    if (dbCat) {
      category = { slug: dbCat.slug, name: dbCat.name, description: dbCat.description || "", icon: dbCat.icon || "Package" };
      products = dbCat.products.map((p: any) => ({ slug: p.slug, name: p.name, shortDescription: p.shortDescription || "", vendor: p.vendor || "" }));
    }
    const dbAllCats = await prisma.softwareCategory.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { active: true } } } } },
    });
    allCategories = dbAllCats.map((c: any) => ({ slug: c.slug, name: c.name, icon: c.icon, productCount: c._count.products }));
  } catch (e) {
    console.error("Error fetching category:", e);
  }

  // Fallback to hardcoded
  if (!category) {
    const hc = getCategoryBySlug(slug);
    if (!hc) notFound();
    category = { slug: hc.slug, name: hc.name, description: hc.description, icon: hc.icon };
    products = hc.products.map((p) => ({ slug: p.slug, name: p.name, shortDescription: p.shortDescription, vendor: p.vendor }));
  }
  if (allCategories.length === 0) {
    allCategories = softwareCategories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, productCount: c.products.length }));
  }

  if (!category) notFound();

  const IconComponent = categoryIcons[category.icon] || Package;

  // Group products by vendor
  const productsByVendor: { [key: string]: typeof products } = {};
  products.forEach((product) => {
    if (!productsByVendor[product.vendor]) {
      productsByVendor[product.vendor] = [];
    }
    productsByVendor[product.vendor].push(product);
  });

  return (
    <>
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-br from-primary via-primary to-primary">
        <div className="absolute inset-0 bg-[url('/images/hero-background.jpg')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-primary-foreground/85 text-sm mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/catalogo" className="hover:text-white">Catálogo</Link>
            <span>/</span>
            <span className="text-white">{category.name}</span>
          </nav>
          
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{category.name}</h1>
              <p className="text-xl text-primary-foreground/80 mb-2">{category.description}</p>
              <p className="text-primary-foreground/85">{products.length} produtos disponíveis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-4 bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/catalogo" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft size={16} /> Voltar ao catálogo
            </Link>
            <div className="flex gap-2 overflow-x-auto">
              {allCategories.slice(0, 5).map((cat) => (
                <Link 
                  key={cat.slug}
                  href={`/catalogo/${cat.slug}`}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    cat.slug === category!.slug 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products by Vendor */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {Object.entries(productsByVendor).map(([vendor, vendorProducts]) => (
            <div key={vendor} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b">
                {vendor}
                <span className="text-sm font-normal text-gray-500 ml-3">{vendorProducts.length} produtos</span>
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendorProducts.map((product) => (
                  <Link 
                    key={product.slug}
                    href={`/catalogo/${category!.slug}/${product.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.shortDescription}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.vendor}
                        </span>
                        <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Outras Categorias" 
            subtitle="Explore mais opções de software" 
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {allCategories.filter(c => c.slug !== category!.slug).map((cat) => {
              const CatIcon = categoryIcons[cat.icon] || Package;
              return (
                <Link 
                  key={cat.slug}
                  href={`/catalogo/${cat.slug}`}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-center group"
                >
                  <CatIcon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition" />
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat.productCount} produtos</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Precisa de ajuda para escolher?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Nossa equipe de especialistas pode ajudar você a encontrar a solução ideal para sua empresa.
          </p>
          <Link 
            href="/contato" 
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition"
          >
            Falar com especialista <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
