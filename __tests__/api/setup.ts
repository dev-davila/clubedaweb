/**
 * Test Setup and Utilities for API Integration Tests
 */

export const TEST_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
export const TEST_INVALID_UUID = 'invalid-uuid';
export const TEST_TAG_ID = 'a47ac10b-58cc-4372-a567-0e02b2c3d470';
export const TEST_AUTHOR_ID = 'b47ac10b-58cc-4372-a567-0e02b2c3d471';
export const TEST_PARTNER_ID = 'c47ac10b-58cc-4372-a567-0e02b2c3d472';
export const TEST_CHRONICLE_ID = 'd47ac10b-58cc-4372-a567-0e02b2c3d473';

export const TEST_TAG = {
  name: 'Test Tag',
  slug: 'test-tag',
  color: '#FF0000',
  order: 1,
};

export const TEST_AUTHOR = {
  name: 'Test Author',
  email: 'author@test.com',
  bio: 'Test biography',
  avatar: 'https://example.com/avatar.jpg',
};

export const TEST_PARTNER = {
  name: 'Test Partner',
  logoUrl: 'https://example.com/logo.png',
  description: 'Test partner description',
  website: 'https://example.com',
  order: 1,
};

export const TEST_CHRONICLE = {
  articleId: TEST_USER_ID,
  title: 'Test Chronicle',
  content: 'This is a test chronicle content with sufficient length',
};

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateErrorResponse(body: any) {
  expect(body).toHaveProperty('error');
  expect(body.error).toBeDefined();
}

export function validateSuccessResponse(body: any) {
  expect(body).toBeDefined();
}
