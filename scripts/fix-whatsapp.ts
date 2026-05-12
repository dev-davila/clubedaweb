import { prisma } from '../lib/db';

async function main() {
  // Update WhatsApp number and category in database
  await prisma.siteConfig.update({
    where: { key: 'contact_whatsapp' },
    data: { 
      value: '8008807777',
      category: 'contact'
    }
  });
  
  console.log('WhatsApp updated');
  
  // Verify all contact configs
  const configs = await prisma.siteConfig.findMany({
    where: { category: 'contact' }
  });
  console.log('Contact configs:', configs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
