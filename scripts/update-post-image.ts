import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.blogPost.update({
    where: { id: 'cmklqaqbq000fql08eqj5qcvc' },
    data: { featuredImage: '/images/technical_support.webp' },
    select: { id: true, title: true, featuredImage: true }
  });
  console.log('Updated:', updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
