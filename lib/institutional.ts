import { prisma } from "@/lib/db";

export interface InstitutionalPageData {
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  content: string | null;
  sections: any;
  active: boolean;
}

export async function getInstitutionalPage(slug: string): Promise<InstitutionalPageData | null> {
  try {
    const page = await prisma.institutionalPage.findUnique({
      where: { slug },
    });
    if (!page || !page.active) return null;
    return {
      slug: page.slug,
      title: page.title,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      heroTitle: page.heroTitle,
      heroSubtitle: page.heroSubtitle,
      content: page.content,
      sections: page.sections,
      active: page.active,
    };
  } catch (e) {
    console.error(`Error fetching institutional page ${slug}:`, e);
    return null;
  }
}
