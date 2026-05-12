import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy initialization - only create PrismaClient when first accessed
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // Append connection_limit to DATABASE_URL if not already present
    const url = process.env.DATABASE_URL || ''
    if (url && !url.includes('connection_limit=')) {
      const separator = url.includes('?') ? '&' : '?'
      process.env.DATABASE_URL = `${url}${separator}connection_limit=5`
    }
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

// Export a proxy that lazily initializes PrismaClient on first access
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    const client = getPrismaClient()
    const value = client[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
