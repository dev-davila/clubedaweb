import { prisma } from '@/lib/db';
import { getBingWebmasterCredentials } from '@/lib/seo-credentials';

const BING_WEBMASTER_API = 'https://ssl.bing.com/webmaster/api.svc/json';
const INDEXNOW_API = 'https://api.indexnow.org/indexnow';

function getApiKey(): string {
  const credentials = getBingWebmasterCredentials();
  if (!credentials) {
    throw new Error('Credenciais do Bing Webmaster não configuradas');
  }
  return credentials.apiKey;
}

export async function getSites(): Promise<any[]> {
  const apiKey = getApiKey();
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetUserSites?apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Falha ao listar sites do Bing');
  }

  const data = await response.json();
  return data.d || [];
}

export async function getSitemapStatus(siteUrl: string): Promise<any[]> {
  // The GetSitemaps endpoint has been deprecated by Bing.
  // Return submissions from our own database instead.
  try {
    const submissions = await prisma.sEOSitemapSubmission.findMany({
      where: { engine: 'bing' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return submissions.map((s: any) => ({
      Url: s.sitemapUrl,
      LastSubmittedDate: s.createdAt.toISOString(),
      Status: s.status,
      UrlCount: s.urlCount || 0,
    }));
  } catch {
    return [];
  }
}

export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<{ urlCount: number; method: string }> {
  const apiKey = getApiKey();

  // Contabilizar URLs no sitemap para registro
  let urlCount = 0;
  try {
    const sitemapRes = await fetch(sitemapUrl);
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const locRegex = /<loc>/g;
      let m;
      while ((m = locRegex.exec(xml)) !== null) urlCount++;
    }
  } catch {
    // Se não conseguir contar, prosseguir com 0
  }

  // Usar SubmitFeed — envia a URL do sitemap inteiro para o Bing crawlar
  // Sem limite de URLs, diferente do SubmitUrlBatch que tem cota diária
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(sitemapUrl);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/SubmitFeed?apikey=${apiKey}&siteUrl=${encodedSiteUrl}&feedpath=${encodedFeedpath}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const errorText = await response.text();
    // Se SubmitFeed falhar, tentar SubmitUrlBatch como fallback (com limite de cota)
    console.warn(`SubmitFeed falhou (${response.status}): ${errorText}. Tentando SubmitUrlBatch como fallback...`);
    return await submitSitemapViaUrlBatch(siteUrl, sitemapUrl, apiKey);
  }

  // Log submission
  await prisma.sEOSitemapSubmission.create({
    data: {
      sitemapUrl,
      engine: 'bing',
      status: 'SUBMITTED',
      urlCount,
    },
  });

  return { urlCount, method: 'SubmitFeed' };
}

// Fallback: submete URLs individualmente via SubmitUrlBatch (limitado por cota diária)
async function submitSitemapViaUrlBatch(siteUrl: string, sitemapUrl: string, apiKey: string): Promise<{ urlCount: number; method: string; skipped?: number }> {
  let dailyQuota = 100;
  try {
    const quota = await getUrlSubmissionQuota(siteUrl);
    if (quota && typeof quota.DailyQuota === 'number') {
      dailyQuota = quota.DailyQuota;
    }
  } catch {
    dailyQuota = 10;
  }

  if (dailyQuota <= 0) {
    throw new Error('Cota diária de submissão ao Bing esgotada. Tente novamente amanhã.');
  }

  const sitemapRes = await fetch(sitemapUrl);
  if (!sitemapRes.ok) {
    throw new Error(`Falha ao acessar sitemap: ${sitemapRes.status}`);
  }
  const xml = await sitemapRes.text();
  const allUrls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    allUrls.push(match[1]);
  }

  if (allUrls.length === 0) {
    throw new Error('Nenhuma URL encontrada no sitemap');
  }

  const urls = allUrls.slice(0, dailyQuota);
  const skipped = allUrls.length - urls.length;

  const batchSize = 100;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const response = await fetch(
      `${BING_WEBMASTER_API}/SubmitUrlBatch?apikey=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, urlList: batch }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Falha ao submeter URLs ao Bing (batch ${Math.floor(i/batchSize)+1}): ${error}`);
    }
  }

  await prisma.sEOSitemapSubmission.create({
    data: {
      sitemapUrl,
      engine: 'bing',
      status: 'SUBMITTED',
      urlCount: urls.length,
    },
  });

  return { urlCount: urls.length, method: 'SubmitUrlBatch', skipped: skipped > 0 ? skipped : undefined };
}

export async function getCrawlStats(siteUrl: string): Promise<any> {
  const apiKey = getApiKey();
  const encodedUrl = encodeURIComponent(siteUrl);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetCrawlStats?apikey=${apiKey}&siteUrl=${encodedUrl}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar estatísticas de crawl');
  }

  const data = await response.json();
  return data.d;
}

export async function getQueryStats(siteUrl: string): Promise<any[]> {
  const apiKey = getApiKey();
  const encodedUrl = encodeURIComponent(siteUrl);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetQueryStats?apikey=${apiKey}&siteUrl=${encodedUrl}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar estatísticas de queries');
  }

  const data = await response.json();
  return data.d || [];
}

export async function getPageStats(siteUrl: string): Promise<any[]> {
  const apiKey = getApiKey();
  const encodedUrl = encodeURIComponent(siteUrl);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetPageStats?apikey=${apiKey}&siteUrl=${encodedUrl}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar estatísticas de páginas');
  }

  const data = await response.json();
  return data.d || [];
}

// Pesquisa de palavras-chave - volume de busca no Bing
export async function getKeywordStats(siteUrl: string, query: string): Promise<any[]> {
  const apiKey = getApiKey();
  const encodedUrl = encodeURIComponent(siteUrl);
  const encodedQuery = encodeURIComponent(query);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetKeywordStats?apikey=${apiKey}&siteUrl=${encodedUrl}&q=${encodedQuery}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar dados de palavra-chave');
  }

  const data = await response.json();
  return data.d || [];
}

// Info sobre URL específica
export async function getUrlInfo(siteUrl: string, url: string): Promise<any> {
  const apiKey = getApiKey();
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedUrl = encodeURIComponent(url);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetUrlInfo?apikey=${apiKey}&siteUrl=${encodedSiteUrl}&url=${encodedUrl}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar informações da URL');
  }

  const data = await response.json();
  return data.d;
}

// Tráfego por URL
export async function getUrlTrafficInfo(siteUrl: string, url: string): Promise<any> {
  const apiKey = getApiKey();
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedUrl = encodeURIComponent(url);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetUrlTrafficInfo?apikey=${apiKey}&siteUrl=${encodedSiteUrl}&url=${encodedUrl}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar tráfego da URL');
  }

  const data = await response.json();
  return data.d;
}

// Histórico de submissões do banco de dados
export async function getSubmissionHistory(): Promise<any[]> {
  try {
    const submissions = await prisma.sEOSitemapSubmission.findMany({
      where: { engine: 'bing' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return submissions.map((s: any) => ({
      id: s.id,
      sitemapUrl: s.sitemapUrl,
      urlCount: s.urlCount || 0,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

// IndexNow - submete URLs para indexação imediata
export async function submitUrlsIndexNow(
  host: string,
  urls: string[],
  keyLocation?: string
): Promise<{ success: boolean; message: string }> {
  const apiKey = getApiKey();
  
  try {
    const body: any = {
      host,
      key: apiKey,
      urlList: urls,
    };

    if (keyLocation) {
      body.keyLocation = keyLocation;
    }

    const response = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });

    // IndexNow returns various status codes
    // 200/202 = success, 400 = bad request, 403 = key not valid, 422 = invalid URLs, 429 = too many requests
    let status = 'SUCCESS';
    let message = 'URLs submetidas com sucesso';

    if (!response.ok) {
      status = 'FAILED';
      if (response.status === 403) {
        message = 'Chave API inválida. Verifique se o arquivo da chave está hospedado corretamente.';
      } else if (response.status === 422) {
        message = 'URLs inválidas';
      } else if (response.status === 429) {
        message = 'Muitas requisições. Aguarde antes de tentar novamente.';
      } else {
        message = `Erro: ${response.status}`;
      }
    }

    // Log submission
    await prisma.sEOIndexNowLog.create({
      data: {
        urls,
        status,
        engine: 'indexnow',
        response: message,
      },
    });

    return { success: status === 'SUCCESS', message };
  } catch (error: any) {
    await prisma.sEOIndexNowLog.create({
      data: {
        urls,
        status: 'FAILED',
        engine: 'indexnow',
        response: error.message,
      },
    });

    throw error;
  }
}

// Submit URL diretamente ao Bing (alternativa ao IndexNow)
export async function submitUrlToBing(siteUrl: string, url: string): Promise<void> {
  const apiKey = getApiKey();
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/SubmitUrl?apikey=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl,
        url,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Falha ao submeter URL: ${error}`);
  }
}

export async function submitUrlBatch(siteUrl: string, urls: string[]): Promise<void> {
  const apiKey = getApiKey();
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/SubmitUrlBatch?apikey=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl,
        urlList: urls,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Falha ao submeter URLs: ${error}`);
  }
}

export async function getUrlSubmissionQuota(siteUrl: string): Promise<any> {
  const apiKey = getApiKey();
  const encodedUrl = encodeURIComponent(siteUrl);
  
  const response = await fetch(
    `${BING_WEBMASTER_API}/GetUrlSubmissionQuota?apikey=${apiKey}&siteUrl=${encodedUrl}`
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar quota de submissão');
  }

  const data = await response.json();
  return data.d;
}
