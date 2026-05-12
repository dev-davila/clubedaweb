export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, CheckCircle, Phone, Package, Star, FileText, Users } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { getProductBySlug, getCategoryBySlug, getAllProducts, softwareCategories } from "@/lib/software-catalog";
import { SITE_CONFIG } from "@/lib/constants";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: { categoria: string; slug: string } }): Promise<Metadata> {
  let name = "";
  let desc = "";
  try {
    const dbProd = await prisma.softwareProduct.findFirst({ where: { slug: params?.slug ?? "", active: true } });
    if (dbProd) { name = dbProd.name; desc = dbProd.shortDescription || ""; }
  } catch (e) { /* fallback */ }
  if (!name) {
    const p = getProductBySlug(params?.slug ?? "");
    if (p) { name = p.name; desc = p.shortDescription; }
  }
  if (!name) return { title: "Produto não encontrado" };
  return {
    title: `${name} | M3 Solutions`,
    description: desc,
  };
}

export default async function ProductPage({ params }: { params: { categoria: string; slug: string } }) {
  const prodSlug = params?.slug ?? "";
  const catSlug = params?.categoria ?? "";

  let product: any = null;
  let category: { slug: string; name: string } | null = null;
  let relatedProducts: { slug: string; name: string; shortDescription: string }[] = [];

  try {
    const dbProd = await prisma.softwareProduct.findFirst({
      where: { slug: prodSlug, active: true },
      include: { category: { select: { slug: true, name: true } } },
    });
    if (dbProd) {
      product = {
        slug: dbProd.slug,
        name: dbProd.name,
        shortDescription: dbProd.shortDescription,
        fullDescription: dbProd.fullDescription,
        vendor: dbProd.vendor,
        image: dbProd.image,
        features: dbProd.features as string[],
        benefits: dbProd.benefits as string[],
        editions: dbProd.editions as { name: string; description: string }[] | null,
        relatedProducts: dbProd.relatedProducts as string[] | null,
      };
      category = { slug: dbProd.category.slug, name: dbProd.category.name };

      // Fetch related products from same category
      const dbRelated = await prisma.softwareProduct.findMany({
        where: { categoryId: dbProd.categoryId, active: true, slug: { not: prodSlug } },
        take: 3,
        orderBy: { displayOrder: "asc" },
        select: { slug: true, name: true, shortDescription: true },
      });
      relatedProducts = dbRelated.map((r: any) => ({ slug: r.slug, name: r.name, shortDescription: r.shortDescription || "" }));
    }
  } catch (e) {
    console.error("Error fetching product:", e);
  }

  // Fallback to hardcoded
  if (!product) {
    const hcProduct = getProductBySlug(prodSlug);
    const hcCategory = getCategoryBySlug(catSlug);
    if (!hcProduct || !hcCategory) notFound();
    product = hcProduct;
    category = { slug: hcCategory.slug, name: hcCategory.name };
    relatedProducts = hcCategory.products
      .filter((p) => p.slug !== prodSlug)
      .slice(0, 3)
      .map((p) => ({ slug: p.slug, name: p.name, shortDescription: p.shortDescription }));
  }

  if (!product || !category) notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative py-16 min-h-[40vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image 
            src={product.image} 
            alt={product.name} 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-primary-foreground/85 text-sm mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/catalogo" className="hover:text-white">Catálogo</Link>
            <span>/</span>
            <Link href={`/catalogo/${category.slug}`} className="hover:text-white">{category.name}</Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </nav>
          
          <div className="max-w-3xl">
            <span className="inline-block bg-primary/30 text-primary-foreground/80 px-3 py-1 rounded-full text-sm mb-4">
              {product.vendor}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {product.name}
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-6">
              {product.shortDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/contato" 
                className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition"
              >
                Solicitar orçamento <ArrowRight size={18} />
              </Link>
              <a 
                href={SITE_CONFIG.whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition"
              >
                <Phone size={18} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-4 bg-white border-b">
        <div className="container mx-auto px-4">
          <Link 
            href={`/catalogo/${category.slug}`} 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition"
          >
            <ArrowLeft size={16} /> Voltar para {category.name}
          </Link>
        </div>
      </section>

      {/* Description */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre o {product.name}</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {product.fullDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                Recursos Principais
              </h2>
              <div className="space-y-3">
                {product.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-500" />
                Benefícios
              </h2>
              <div className="space-y-3">
                {product.benefits.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editions (if available) */}
      {product.editions && product.editions.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <SectionTitle 
              title="Edições Disponíveis" 
              subtitle="Escolha a opção que melhor atende sua empresa" 
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {product.editions.map((edition: any, index: number) => (
                <div key={index} className="bg-primary/5 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{edition.name}</h3>
                  <p className="text-gray-600 text-sm">{edition.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Buy With Us */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Por que comprar conosco?" 
            subtitle={`Vantagens de adquirir o ${product.name} com a M3 Solutions`}
          />
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: FileText, title: 'Licenciamento Oficial', desc: 'Parceiro autorizado do fabricante' },
              { icon: Users, title: 'Suporte Especializado', desc: 'Equipe certificada para ajudá-lo' },
              { icon: Package, title: 'Implementação', desc: 'Configuramos e integramos para você' },
              { icon: Star, title: 'Melhor Preço', desc: 'Condições especiais de parceiro' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <SectionTitle 
              title="Produtos Relacionados" 
              subtitle={`Outros produtos em ${category.name}`} 
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {relatedProducts.map((related) => (
                <Link 
                  key={related.slug}
                  href={`/catalogo/${category!.slug}/${related.slug}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition">
                    {related.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {related.shortDescription}
                  </p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1">
                    Ver detalhes <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Pronto para adquirir o {product.name}?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Entre em contato e receba uma proposta personalizada para sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contato" 
              className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition"
            >
              Solicitar orçamento <ArrowRight size={20} />
            </Link>
            <a 
              href={SITE_CONFIG.whatsappLink}
              target="_blank"
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition"
            >
              <Phone size={20} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
