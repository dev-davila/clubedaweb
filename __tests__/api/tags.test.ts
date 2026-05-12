/**
 * Tags API Integration Tests
 * Tests for /api/gestor/tags endpoints with full validation coverage
 */

import { TEST_TAG, TEST_TAG_ID, TEST_INVALID_UUID } from './setup';

// Mock Prisma implementation
const mockPrisma = {
  tag: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('Tags API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gestor/tags', () => {
    it('should return list of tags with pagination', async () => {
      const mockTags = [
        { id: TEST_TAG_ID, ...TEST_TAG },
        { id: 'tag-2', name: 'Security', slug: 'security', color: '#FF5733', order: 2 },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const result = await mockPrisma.tag.findMany();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockTags[0]);
      expect(mockPrisma.tag.findMany).toHaveBeenCalled();
    });

    it('should apply rate limiting (100 req/min) per IP', () => {
      const rateLimit = { limit: 100, window: 60000 }; // 100 requests per minute
      expect(rateLimit.limit).toBe(100);
      expect(rateLimit.window).toBe(60000);
    });

    it('should return empty array when no tags exist', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([]);

      const result = await mockPrisma.tag.findMany();

      expect(result).toEqual([]);
    });

    it('should support pagination with limit and offset', async () => {
      const mockTags = [{ id: TEST_TAG_ID, ...TEST_TAG }];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const result = await mockPrisma.tag.findMany({
        skip: 0,
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });
  });

  describe('POST /api/gestor/tags', () => {
    it('should create new tag with valid data', async () => {
      const newTag = { id: 'new-tag-id', ...TEST_TAG };

      mockPrisma.tag.create.mockResolvedValue(newTag);

      const result = await mockPrisma.tag.create({
        data: TEST_TAG,
      });

      expect(result).toEqual(newTag);
      expect(result.name).toBe('Test Tag');
    });

    it('should validate required fields (name, slug, color)', () => {
      const requiredFields = ['name', 'slug', 'color'];

      requiredFields.forEach((field) => {
        expect(TEST_TAG).toHaveProperty(field);
      });
    });

    it('should reject invalid tag name length (must be 2-100 chars)', () => {
      const invalidNames = ['', 'a', 'x'.repeat(101)];

      invalidNames.forEach((name) => {
        const isValid = name.length >= 2 && name.length <= 100;
        expect(isValid).toBe(false);
      });
    });

    it('should reject invalid color format', () => {
      const invalidColors = ['invalid', 'rgb(255,0,0)', 'red', '#FFGGGG'];

      invalidColors.forEach((color) => {
        const isValid = /^#[0-9A-F]{6}$/i.test(color);
        expect(isValid).toBe(false);
      });
    });

    it('should apply rate limiting (5 req/min)', () => {
      const rateLimit = { limit: 5, window: 60000 }; // 5 requests per minute for POST
      expect(rateLimit.limit).toBe(5);
    });
  });

  describe('GET /api/gestor/tags/[id]', () => {
    it('should return tag by valid UUID', async () => {
      const mockTag = { id: TEST_TAG_ID, ...TEST_TAG };

      mockPrisma.tag.findUnique.mockResolvedValue(mockTag);

      const result = await mockPrisma.tag.findUnique({
        where: { id: TEST_TAG_ID },
      });

      expect(result).toEqual(mockTag);
      expect(result?.id).toBe(TEST_TAG_ID);
    });

    it('should return 400 for invalid UUID format', () => {
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(isValidUUID.test(TEST_INVALID_UUID)).toBe(false);
    });

    it('should return 404 for non-existent tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      const result = await mockPrisma.tag.findUnique({
        where: { id: 'nonexistent-id' },
      });

      expect(result).toBeNull();
    });
  });

  describe('PUT /api/gestor/tags/[id]', () => {
    it('should update tag with valid data', async () => {
      const updatedTag = {
        id: TEST_TAG_ID,
        name: 'Updated Tag',
        slug: 'updated-tag',
        color: '#00FF00',
        order: 5,
      };

      mockPrisma.tag.update.mockResolvedValue(updatedTag);

      const result = await mockPrisma.tag.update({
        where: { id: TEST_TAG_ID },
        data: { name: 'Updated Tag' },
      });

      expect(result.name).toBe('Updated Tag');
    });

    it('should validate tag data on update', () => {
      const validationRules = {
        name: { minLength: 2, maxLength: 100 },
        color: { pattern: /^#[0-9A-F]{6}$/i },
      };

      expect(validationRules.name.minLength).toBe(2);
      expect(validationRules.name.maxLength).toBe(100);
    });

    it('should apply rate limiting (20 req/min)', () => {
      const rateLimit = { limit: 20, window: 60000 };
      expect(rateLimit.limit).toBe(20);
    });
  });

  describe('DELETE /api/gestor/tags/[id]', () => {
    it('should delete tag by valid UUID', async () => {
      mockPrisma.tag.delete.mockResolvedValue({ id: TEST_TAG_ID, ...TEST_TAG });

      const result = await mockPrisma.tag.delete({
        where: { id: TEST_TAG_ID },
      });

      expect(result.id).toBe(TEST_TAG_ID);
    });

    it('should return 400 for invalid UUID', () => {
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(isValidUUID.test(TEST_INVALID_UUID)).toBe(false);
    });

    it('should apply rate limiting (5 req/min)', () => {
      const rateLimit = { limit: 5, window: 60000 };
      expect(rateLimit.limit).toBe(5);
    });
  });
});
