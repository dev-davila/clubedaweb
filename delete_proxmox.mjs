import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Delete all Proxmox VE related posts
  const result = await prisma.blogPost.deleteMany({
    where: {
      OR: [
        { title: { contains: 'Proxmox VE' } },
        { title: { contains: 'O que é Proxmox' } }
      ]
    }
  })
  
  console.log(`Deleted ${result.count} posts`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
