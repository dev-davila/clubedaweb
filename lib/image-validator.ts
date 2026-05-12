import { logger } from './logger';

const VALID_DOMAINS = [
  'cdn.m3solutions.net.br',
  'cdn.abacus.ai',
  'img.m3solutions.com.br',
  'images.m3solutions.com.br',
  'www.m3solutions.com.br',
  'm3solutions.com.br',
];

const DEFAULT_IMAGES = {
  blog: '/images/blog-default.jpg',
  partner: '/images/partners/default.svg',
  solution: '/images/solutions/default.jpg',
  team: '/images/team-default.jpg',
};

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    if (url.includes('youtube.com') || url.includes('youtube') || url === '') {
      return false;
    }

    if (url.startsWith('/images/')) {
      return true;
    }

    const urlObj = new URL(url);

    if (urlObj.protocol !== 'https:') {
      return false;
    }

    return VALID_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    logger.debug('Invalid image URL detected', { url, error: String(error) });
    return false;
  }
}

export function getValidImageUrl(
  url: string | null | undefined,
  fallback: string = DEFAULT_IMAGES.blog
): string {
  if (isValidImageUrl(url)) {
    return url as string;
  }

  logger.warn('Invalid image URL, using fallback', { url, fallback });
  return fallback;
}

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    if (url.includes('wp-content') || url.includes('uploads')) {
      const filename = url.split('/').pop();
      if (filename) {
        return `https://letswp.justifiedgrid.com/wp-content/uploads/2018/09/image-size-suffix-screenshot-4a-2.png`;
      }
    }

    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }

    if (url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return url;
    }

    return null;
  } catch (error) {
    logger.debug('Error normalizing image URL', { url });
    return null;
  }
}

export function validateImageUrls(urls: (string | null | undefined)[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  urls.forEach(url => {
    if (isValidImageUrl(url)) {
      valid.push(url as string);
    } else if (url) {
      invalid.push(url);
    }
  });

  if (invalid.length > 0) {
    logger.warn('Invalid image URLs detected', { count: invalid.length, urls: invalid });
  }

  return { valid, invalid };
}
