import { isValidImageUrl, getValidImageUrl, normalizeImageUrl } from '@/lib/image-validator';

describe('Image Validator', () => {
  describe('isValidImageUrl', () => {
    it('should accept valid CDN URLs', () => {
      expect(isValidImageUrl('https://cdn.m3solutions.net.br/images/test.jpg')).toBe(true);
      expect(isValidImageUrl('https://img.m3solutions.com.br/image.png')).toBe(true);
    });

    it('should accept local image paths', () => {
      expect(isValidImageUrl('/images/blog-default.jpg')).toBe(true);
    });

    it('should reject YouTube URLs', () => {
      expect(isValidImageUrl('https://youtube.com/watch?v=123')).toBe(false);
    });

    it('should reject HTTP URLs', () => {
      expect(isValidImageUrl('http://example.com/image.jpg')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidImageUrl(null)).toBe(false);
      expect(isValidImageUrl(undefined)).toBe(false);
    });
  });

  describe('getValidImageUrl', () => {
    it('should return valid URL as is', () => {
      const url = 'https://cdn.m3solutions.net.br/images/test.jpg';
      expect(getValidImageUrl(url)).toBe(url);
    });

    it('should return fallback for invalid URL', () => {
      expect(getValidImageUrl('https://youtube.com/video')).toBe('/images/blog-default.jpg');
    });

    it('should use custom fallback', () => {
      const fallback = '/images/custom.jpg';
      expect(getValidImageUrl(null, fallback)).toBe(fallback);
    });
  });
});
