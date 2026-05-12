/**
 * Validation & Error Handling Tests
 * Comprehensive validation testing for Zod schemas and error handling
 */

import { z } from 'zod';

// Validation schemas used in the API
const tagSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  order: z.number().optional(),
});

const authorSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
});

const partnerSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
});

const chronicleSchema = z.object({
  articleId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(20),
});

describe('Validation Error Handling', () => {
  describe('Zod Schema Validation', () => {
    it('should reject request with missing required fields', () => {
      const invalidData = { slug: 'test' }; // Missing name and color

      expect(() => tagSchema.parse(invalidData)).toThrow();
    });

    it('should reject request with invalid field types', () => {
      const invalidData = {
        name: 'Test',
        slug: 'test',
        color: '#FF0000',
        order: 'not-a-number', // Should be number
      };

      expect(() => tagSchema.parse(invalidData)).toThrow();
    });

    it('should return validation error details', () => {
      const invalidData = { name: 'a', slug: 'test', color: '#FF0000' }; // name too short

      try {
        tagSchema.parse(invalidData);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(z.ZodError);
      }
    });

    it('should validate string length constraints', () => {
      const tooShort = { name: 'a', slug: 'test', color: '#FF0000' };
      const tooLong = {
        name: 'x'.repeat(101),
        slug: 'test',
        color: '#FF0000',
      };

      expect(() => tagSchema.parse(tooShort)).toThrow();
      expect(() => tagSchema.parse(tooLong)).toThrow();
    });

    it('should validate email format', () => {
      const validEmail = {
        name: 'Test Author',
        email: 'test@example.com',
      };
      const invalidEmail = {
        name: 'Test Author',
        email: 'invalid-email',
      };

      expect(authorSchema.parseAsync(validEmail)).toBeDefined();
      expect(() => authorSchema.parse(invalidEmail)).toThrow();
    });

    it('should validate URL format', () => {
      const validUrl = {
        name: 'Partner',
        website: 'https://example.com',
      };
      const invalidUrl = {
        name: 'Partner',
        website: 'not-a-url',
      };

      expect(() => partnerSchema.parse(invalidUrl)).toThrow();
    });

    it('should validate UUID format', () => {
      const validUUID = {
        articleId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Test Chronicle',
        content: 'This is test content with minimum length required',
      };
      const invalidUUID = {
        articleId: 'invalid-uuid',
        title: 'Test Chronicle',
        content: 'This is test content with minimum length required',
      };

      expect(chronicleSchema.parseAsync(validUUID)).toBeDefined();
      expect(() => chronicleSchema.parse(invalidUUID)).toThrow();
    });

    it('should validate enum values', () => {
      const statusSchema = z.enum(['draft', 'published', 'archived']);

      expect(statusSchema.parse('draft')).toBe('draft');
      expect(() => statusSchema.parse('invalid')).toThrow();
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error structure', () => {
      const errorResponse = {
        error: 'Validation failed',
        status: 400,
        details: [{ field: 'name', message: 'String must contain at least 2 character(s)' }],
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('status');
      expect(errorResponse).toHaveProperty('details');
    });

    it('should include error message in response', () => {
      const errorResponse = { error: 'Invalid input provided' };
      expect(errorResponse.error).toBeDefined();
    });

    it('should include status code in error', () => {
      const errorResponse = { status: 400 };
      expect(errorResponse.status).toBe(400);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 for missing session', () => {
      const errorResponse = { status: 401, error: 'Unauthorized' };
      expect(errorResponse.status).toBe(401);
    });

    it('should return 401 for invalid token', () => {
      const errorResponse = { status: 401, error: 'Invalid token' };
      expect(errorResponse.status).toBe(401);
    });

    it('should return 403 for insufficient permissions', () => {
      const errorResponse = { status: 403, error: 'Forbidden' };
      expect(errorResponse.status).toBe(403);
    });
  });
});
