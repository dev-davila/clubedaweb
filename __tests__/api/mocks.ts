/**
 * Test Mocks for Integration Tests
 * Provides mock implementations for Prisma, NextAuth, and other dependencies
 */

export const mockPrisma = {
  tag: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  author: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  partner: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  chronicle: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  siteConfig: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'admin@test.com',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockRateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function resetRateLimitStore() {
  mockRateLimitStore.clear();
}

export function createMockRequest(
  method: string,
  body?: any,
  headers?: Record<string, string>
) {
  return {
    method,
    json: jest.fn().mockResolvedValue(body || {}),
    headers: new Map(Object.entries(headers || { 'x-forwarded-for': '127.0.0.1' })),
  } as any;
}

export function createMockResponse() {
  const response: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headers: new Map(),
  };
  return response;
}
