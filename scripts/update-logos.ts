import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sophos = await prisma.partner.updateMany({
    where: { name: 'Sophos' },
    data: { logoUrl: 'https://cdn.m3solutions.net.br/partners/sophos.png' }
  });
  const bitdefender = await prisma.partner.updateMany({
    where: { name: 'Bitdefender' },
    data: { logoUrl: 'https://cdn.m3solutions.net.br/partners/bitdefender.png' }
  });
  console.log('Sophos updated:', sophos.count);
  console.log('Bitdefender updated:', bitdefender.count);
}
main().finally(() => prisma.$disconnect());
