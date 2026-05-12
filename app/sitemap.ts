import { SITE_BASE_URL } from "@/lib/constants";
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function getSiteUrl(): string {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  
  if (host && !host.includes('preview.abacusai.app')) {
    return `${protocol}://${host}`;
  }
  
  // Fallback para o domínio de produção
  return SITE_BASE_URL;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = getSiteUrl();

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/quem-somos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/missao-visao-e-valores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/nossos-parceiros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/catalogo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/solucoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/trabalhe-conosco`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/lgpd`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/aviso-de-privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/aviso-de-cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/etica`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/sustentabilidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/responsabilidade-social`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/canal-de-denuncias`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/politica-antissuborno-e-anticorrupcao`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Buscar posts publicados
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    blogPosts = posts.map((post) => ({
      url: `${SITE_URL}/noticias/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Páginas de soluções — dinâmico do banco
  let solutionPages: MetadataRoute.Sitemap = [];
  try {
    const solutions = await prisma.solution.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    });

    solutionPages = solutions.map((sol) => ({
      url: `${SITE_URL}/solucoes/${sol.slug}`,
      lastModified: sol.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching solutions for sitemap:', error);
  }

  // Catálogo de software — categorias e produtos dinâmicos
  let catalogPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.softwareCategory.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    });

    const categoryPages = categories.map((cat) => ({
      url: `${SITE_URL}/catalogo/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    const products = await prisma.softwareProduct.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const productPages = products.map((prod) => ({
      url: `${SITE_URL}/catalogo/${prod.category.slug}/${prod.slug}`,
      lastModified: prod.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    catalogPages = [...categoryPages, ...productPages];
  } catch (error) {
    console.error('Error fetching catalog for sitemap:', error);
  }

  // Páginas de produtos Bitdefender (landing pages estáticas)
  const productLandingPages: MetadataRoute.Sitemap = [
    'bitdefender-gravityzone-business-security',
    'bitdefender-gravityzone-business-security-premium',
    'bitdefender-gravityzone-business-security-enterprise',
  ].map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...solutionPages, ...catalogPages, ...productLandingPages, ...blogPosts];
}