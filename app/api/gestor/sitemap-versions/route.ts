import { NextResponse } from 'next/server';
import { SITE_BASE_URL } from "@/lib/constants";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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
  
  return SITE_BASE_URL;
}

async function generateSitemapContent(): Promise<string> {
  const SITE_URL = getSiteUrl();
  
  // Páginas estáticas
  const staticPages = [
    { url: SITE_URL, priority: 1, changefreq: 'weekly' },
    { url: `${SITE_URL}/quem-somos`, priority: 0.8, changefreq: 'monthly' },
    { url: `${SITE_URL}/missao-visao-e-valores`, priority: 0.7, changefreq: 'monthly' },
    { url: `${SITE_URL}/nossos-parceiros`, priority: 0.7, changefreq: 'monthly' },
    { url: `${SITE_URL}/contato`, priority: 0.9, changefreq: 'monthly' },
    { url: `${SITE_URL}/portfolio`, priority: 0.8, changefreq: 'weekly' },
    { url: `${SITE_URL}/catalogo`, priority: 0.8, changefreq: 'weekly' },
    { url: `${SITE_URL}/solucoes`, priority: 0.9, changefreq: 'weekly' },
    { url: `${SITE_URL}/noticias`, priority: 0.8, changefreq: 'daily' },
    { url: `${SITE_URL}/trabalhe-conosco`, priority: 0.6, changefreq: 'monthly' },
    { url: `${SITE_URL}/lgpd`, priority: 0.3, changefreq: 'yearly' },
    { url: `${SITE_URL}/aviso-de-privacidade`, priority: 0.3, changefreq: 'yearly' },
    { url: `${SITE_URL}/aviso-de-cookies`, priority: 0.3, changefreq: 'yearly' },
    { url: `${SITE_URL}/etica`, priority: 0.4, changefreq: 'yearly' },
    { url: `${SITE_URL}/sustentabilidade`, priority: 0.4, changefreq: 'yearly' },
    { url: `${SITE_URL}/responsabilidade-social`, priority: 0.4, changefreq: 'yearly' },
    { url: `${SITE_URL}/canal-de-denuncias`, priority: 0.3, changefreq: 'yearly' },
    { url: `${SITE_URL}/politica-antissuborno-e-anticorrupcao`, priority: 0.3, changefreq: 'yearly' },
  ];

  // Posts publicados
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  // Soluções
  const solutionSlugs = [
    'suporte-tecnico', 'gestao-de-ti', 'noc-24x7', 'projetos-de-infraestrutura',
    'locacao-de-equipamentos', 'cloud-computing', 'seguranca-da-informacao',
    'servidores-e-datacenter', 'nuvem-privada', 'consultoria-em-ti',
  ];

  // Produtos
  const productSlugs = [
    'bitdefender-gravityzone-business-security',
    'bitdefender-gravityzone-business-security-premium',
    'bitdefender-gravityzone-business-security-enterprise',
  ];

  const now = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Páginas estáticas
  for (const page of staticPages) {
    xml += '  <url>\n';
    xml += `    <loc>${page.url}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // Soluções
  for (const slug of solutionSlugs) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/solucoes/${slug}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // Produtos
  for (const slug of productSlugs) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/${slug}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  }

  // Posts
  for (const post of posts) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/noticias/${post.slug}</loc>\n`;
    xml += `    <lastmod>${post.updatedAt.toISOString()}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

// POST - Gerar nova versão do sitemap
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const sitemapContent = await generateSitemapContent();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionKey = `sitemap_version_${timestamp}`;

    // Contar URLs no sitemap
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;

    // Salvar nova versão
    await prisma.siteConfig.create({
      data: {
        key: versionKey,
        value: sitemapContent,
        label: `Sitemap v${timestamp} (${urlCount} URLs)`,
        category: 'sitemap',
      }
    });

    // Definir como versão ativa
    await prisma.siteConfig.upsert({
      where: { key: 'sitemap_active_version' },
      update: { value: versionKey },
      create: {
        key: 'sitemap_active_version',
        value: versionKey,
        label: 'Versão ativa do sitemap',
        category: 'sitemap',
      }
    });

    return NextResponse.json({
      success: true,
      version: versionKey,
      urlCount,
      message: `Nova versão do sitemap gerada com ${urlCount} URLs`
    });
  } catch (error) {
    console.error('Error generating sitemap version:', error);
    return NextResponse.json({ error: 'Erro ao gerar sitemap' }, { status: 500 });
  }
}

// PUT - Restaurar versão do sitemap (rollback)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { versionKey } = await request.json();

    // Verificar se a versão existe
    const version = await prisma.siteConfig.findUnique({
      where: { key: versionKey }
    });

    if (!version) {
      return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 });
    }

    // Definir como versão ativa
    await prisma.siteConfig.upsert({
      where: { key: 'sitemap_active_version' },
      update: { value: versionKey },
      create: {
        key: 'sitemap_active_version',
        value: versionKey,
        label: 'Versão ativa do sitemap',
        category: 'sitemap',
      }
    });

    return NextResponse.json({
      success: true,
      version: versionKey,
      message: 'Versão restaurada com sucesso'
    });
  } catch (error) {
    console.error('Error restoring sitemap version:', error);
    return NextResponse.json({ error: 'Erro ao restaurar versão' }, { status: 500 });
  }
}

// DELETE - Excluir versão do sitemap
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const versionKey = searchParams.get('key');

    if (!versionKey) {
      return NextResponse.json({ error: 'Chave da versão não informada' }, { status: 400 });
    }

    // Verificar se é a versão ativa
    const activeVersion = await prisma.siteConfig.findUnique({
      where: { key: 'sitemap_active_version' }
    });

    if (activeVersion?.value === versionKey) {
      return NextResponse.json({ error: 'Não é possível excluir a versão ativa' }, { status: 400 });
    }

    // Excluir versão
    await prisma.siteConfig.delete({
      where: { key: versionKey }
    });

    return NextResponse.json({
      success: true,
      message: 'Versão excluída com sucesso'
    });
  } catch (error) {
    console.error('Error deleting sitemap version:', error);
    return NextResponse.json({ error: 'Erro ao excluir versão' }, { status: 500 });
  }
}
