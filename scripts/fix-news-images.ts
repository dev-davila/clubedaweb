import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Buscar todos os posts com imagens malformadas
  const posts = await prisma.blogPost.findMany({
    where: { 
      featuredImage: { 
        contains: 'media2.dev.to' 
      }
    },
    select: { id: true, title: true, featuredImage: true }
  });
  
  console.log(`Encontrados ${posts.length} posts com imagens malformadas\n`);
  
  for (const post of posts) {
    // Extrair o nome do arquivo do final da URL malformada
    const match = post.featuredImage?.match(/\/images\/([^\/]+)$/);
    if (match) {
      const fileName = match[1];
      const newUrl = `/images/${fileName}`;
      
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { featuredImage: newUrl }
      });
      
      console.log(`✅ ${post.title?.substring(0, 40)}...`);
      console.log(`   ${post.featuredImage}`);
      console.log(`   → ${newUrl}\n`);
    }
  }
  
  console.log('Correção concluída!');
}
main().finally(() => prisma.$disconnect());
