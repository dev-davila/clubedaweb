import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.blogPost.deleteMany({
      where: {
        title: {
          contains: 'Proxmox'
        }
      }
    })
    
    console.log(`✅ Deleted ${result.count} Proxmox VE related posts`)
  } catch (error) {
    console.error('❌ Error deleting posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
