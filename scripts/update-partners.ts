import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Atualizar Equinix
  const equinix = await prisma.partner.updateMany({
    where: { name: { contains: 'Equinix', mode: 'insensitive' } },
    data: { logoUrl: '/images/partners/equinix.png' }
  });
  console.log('Equinix atualizado:', equinix.count);

  // Atualizar Blockbit
  const blockbit = await prisma.partner.updateMany({
    where: { name: { contains: 'Blockbit', mode: 'insensitive' } },
    data: { logoUrl: '/images/partners/blockbit.png' }
  });
  console.log('Blockbit atualizado:', blockbit.count);

  // Verificar se Adobe existe
  const adobe = await prisma.partner.findFirst({
    where: { name: { contains: 'Adobe', mode: 'insensitive' } }
  });
  
  if (!adobe) {
    // Adicionar Adobe
    const newAdobe = await prisma.partner.create({
      data: {
        name: 'Adobe',
        description: 'Soluções criativas e de marketing digital',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png',
        website: 'https://www.adobe.com/br',
        active: true,
        order: 20
      }
    });
    console.log('Adobe adicionado:', newAdobe.id);
  } else {
    console.log('Adobe já existe:', adobe.id);
  }

  // Listar todos os parceiros
  const all = await prisma.partner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, logoUrl: true }
  });
  console.log('Parceiros:', all);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
