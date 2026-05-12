import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Contar artigos por status
  const articlesByStatus = await prisma.collectedArticle.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('Artigos por status:', JSON.stringify(articlesByStatus, null, 2));

  // Contar crônicas por status
  const chroniclesByStatus = await prisma.chronicle.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('Crônicas por status:', JSON.stringify(chroniclesByStatus, null, 2));

  // Artigos selecionados sem crônica
  const selectedWithoutChronicle = await prisma.collectedArticle.findMany({
    where: {
      status: 'selected',
      chronicle: null
    },
    select: { id: true, title: true }
  });
  console.log('\nMatérias SELECIONADAS sem crônica:', selectedWithoutChronicle.length);
  selectedWithoutChronicle.forEach(a => console.log('  -', a.title.substring(0, 60)));
}

main().catch(console.error).finally(() => prisma.$disconnect());
