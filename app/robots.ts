import { SITE_BASE_URL } from "@/lib/constants";
import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// URL imported from constants

const DEFAULT_DISALLOW = ['/admin/', '/gestor/', '/api/', '/gestor/login'];

export default async function robots(): Promise<MetadataRoute.Robots> {
  let siteUrl = SITE_BASE_URL;
  try {
    const headersList = headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    if (host) {
      siteUrl = `https://${host}`;
    }
  } catch {
    // fallback to SITE_BASE_URL
  }

  // Try to load config from DB
  try {
    const config = await prisma.siteConfig.findFirst({
      where: { key: 'robots_config' },
    });

    if (config?.value) {
      const parsed = JSON.parse(config.value);

      if (parsed.mode === 'manual' && parsed.customRules) {
        // For manual mode, we parse the custom rules text into the robots format
        // The custom rules are raw robots.txt content, but Next.js needs structured data
        // We'll parse the key directives
        const rules: MetadataRoute.Robots['rules'] = [];
        const lines = (parsed.customRules as string).split('\n');
        let currentRule: { userAgent: string; allow?: string[]; disallow?: string[] } | null = null;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          const [directive, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();

          if (directive.toLowerCase() === 'user-agent') {
            if (currentRule) rules.push(currentRule);
            currentRule = { userAgent: value || '*' };
          } else if (directive.toLowerCase() === 'allow' && currentRule) {
            if (!currentRule.allow) currentRule.allow = [];
            currentRule.allow.push(value);
          } else if (directive.toLowerCase() === 'disallow' && currentRule) {
            if (!currentRule.disallow) currentRule.disallow = [];
            currentRule.disallow.push(value);
          }
        }
        if (currentRule) rules.push(currentRule);

        if (rules.length === 0) {
          rules.push({ userAgent: '*', allow: '/' as any });
        }

        return {
          rules,
          sitemap: `${siteUrl}/sitemap.xml`,
        };
      }

      if (parsed.mode === 'automatic') {
        const disallow = Array.isArray(parsed.disallowPaths) && parsed.disallowPaths.length > 0
          ? parsed.disallowPaths
          : DEFAULT_DISALLOW;

        return {
          rules: [
            {
              userAgent: '*',
              allow: parsed.allowAll !== false ? '/' : undefined,
              disallow,
            },
          ],
          sitemap: `${siteUrl}/sitemap.xml`,
        };
      }
    }
  } catch (err) {
    console.error('Error reading robots config from DB:', err);
  }

  // Fallback: default rules
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DEFAULT_DISALLOW,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
