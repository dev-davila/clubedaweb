import { prisma } from '@/lib/db';
import { getGoogleSearchConsoleCredentials } from '@/lib/seo-credentials';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEARCH_CONSOLE_API = 'https://www.googleapis.com/webmasters/v3';
const SEARCH_ANALYTICS_API = 'https://searchconsole.googleapis.com/v1';

export async function getValidAccessToken(): Promise<string | null> {
  const token = await prisma.sEOGoogleToken.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    return null;
  }

  // Check if token is expired or about to expire (5 min buffer)
  if (token.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    // Refresh the token
    const credentials = getGoogleSearchConsoleCredentials();
    if (!credentials) {
      return null;
    }

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          refresh_token: token.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('Failed to refresh token');
        return null;
      }

      const data = await response.json();

      await prisma.sEOGoogleToken.update({
        where: { id: token.id },
        data: {
          accessToken: data.access_token,
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
        },
      });

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  return token.accessToken;
}

export async function listProperties(): Promise<any[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Search Console');
  }

  const response = await fetch(`${SEARCH_CONSOLE_API}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Falha ao listar propriedades');
  }

  const data = await response.json();
  return data.siteEntry || [];
}

export async function getSitemaps(siteUrl: string): Promise<any[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Search Console');
  }

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${SEARCH_CONSOLE_API}/sites/${encodedSiteUrl}/sitemaps`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Accept': 'application/json' } }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Permissão insuficiente para acessar sitemaps desta propriedade. Verifique suas permissões no Google Search Console.');
    }
    throw new Error(`Falha ao listar sitemaps (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.sitemap || [];
}

export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Search Console');
  }

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedSitemapUrl = encodeURIComponent(sitemapUrl);
  
  // Try with Search Console API v1 first
  let response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
    {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    // Fallback to the older API
    response = await fetch(
      `${SEARCH_CONSOLE_API}/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
      {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
  }

  if (!response.ok) {
    let errorMsg = '';
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMsg = errorData?.error?.message || JSON.stringify(errorData);
      } catch {
        errorMsg = `HTTP ${response.status}`;
      }
    } else {
      // Response is HTML or other non-JSON - don't show raw HTML
      errorMsg = `HTTP ${response.status}`;
    }
    
    // Provide user-friendly messages for known error codes
    if (response.status === 403) {
      throw new Error('Permissão insuficiente. Você precisa ser proprietário verificado do site no Google Search Console para submeter sitemaps. Verifique suas permissões em https://search.google.com/search-console');
    } else if (response.status === 401) {
      throw new Error('Token de autenticação expirado ou inválido. Tente desconectar e reconectar ao Google Search Console.');
    } else if (response.status === 404) {
      throw new Error(`Propriedade não encontrada: ${siteUrl}. Verifique se o site está adicionado e verificado no Google Search Console.`);
    }
    
    throw new Error(errorMsg || `Falha ao submeter sitemap (HTTP ${response.status})`);
  }
}

export async function deleteSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Search Console');
  }

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedSitemapUrl = encodeURIComponent(sitemapUrl);
  
  const response = await fetch(
    `${SEARCH_CONSOLE_API}/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Falha ao remover sitemap');
  }
}

export interface PerformanceQuery {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
}

export async function getPerformanceData(query: PerformanceQuery): Promise<any> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Search Console');
  }

  const encodedSiteUrl = encodeURIComponent(query.siteUrl);
  
  const response = await fetch(
    `${SEARCH_ANALYTICS_API}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions || ['query'],
        rowLimit: query.rowLimit || 100,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Falha ao buscar dados de performance: ${error}`);
  }

  return response.json();
}
