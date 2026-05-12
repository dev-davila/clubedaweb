import { getValidAccessToken } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';

const GA_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

// Get the GA4 property ID (numeric) from database or discover it
export async function getGA4PropertyId(): Promise<string | null> {
  // Check if property ID is stored in SiteConfig
  const config = await prisma.siteConfig.findFirst({
    where: { key: 'analytics_ga4_property_id' },
  });
  if (config?.value) {
    // Validate it's a numeric property ID, not a measurement ID (G-XXXXXXX)
    if (/^\d+$/.test(config.value)) {
      return config.value;
    }
    // Invalid (non-numeric) value stored — clear it so we can rediscover
    console.warn('Invalid non-numeric GA4 property ID stored:', config.value, '— clearing and rediscovering');
    await prisma.siteConfig.delete({ where: { key: 'analytics_ga4_property_id' } }).catch(() => {});
  }

  // Try to discover it from the GA Admin API
  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch(
      `${GA_ADMIN_API}/accountSummaries`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      console.error('Failed to fetch GA4 account summaries:', response.status);
      return null;
    }

    const data = await response.json();
    const ga4Id = await prisma.siteConfig.findFirst({
      where: { key: 'analytics_ga4_id' },
    });
    const measurementId = ga4Id?.value; // e.g. G-D60M6WLCC3

    // Search through all accounts and properties
    for (const account of data.accountSummaries || []) {
      for (const prop of account.propertySummaries || []) {
        // prop.property is like "properties/123456789"
        const propertyId = prop.property?.replace('properties/', '');
        if (propertyId) {
          // Try to get data streams to match measurement ID
          try {
            const streamsRes = await fetch(
              `${GA_ADMIN_API}/${prop.property}/dataStreams`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (streamsRes.ok) {
              const streamsData = await streamsRes.json();
              for (const stream of streamsData.dataStreams || []) {
                if (stream.webStreamData?.measurementId === measurementId) {
                  // Found the matching property
                  await prisma.siteConfig.upsert({
                    where: { key: 'analytics_ga4_property_id' },
                    update: { value: propertyId },
                    create: { key: 'analytics_ga4_property_id', value: propertyId },
                  });
                  return propertyId;
                }
              }
            }
          } catch {
            // Continue searching
          }
        }
      }
    }

    // If no match found but there's only one property, use it
    const allProperties: string[] = [];
    for (const account of data.accountSummaries || []) {
      for (const prop of account.propertySummaries || []) {
        const propertyId = prop.property?.replace('properties/', '');
        if (propertyId) allProperties.push(propertyId);
      }
    }
    if (allProperties.length === 1) {
      await prisma.siteConfig.upsert({
        where: { key: 'analytics_ga4_property_id' },
        update: { value: allProperties[0] },
        create: { key: 'analytics_ga4_property_id', value: allProperties[0] },
      });
      return allProperties[0];
    }

    return null;
  } catch (error) {
    console.error('Error discovering GA4 property:', error);
    return null;
  }
}

export interface GAReportRequest {
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
  limit?: number;
  orderBys?: any[];
}

export async function runReport(propertyId: string, request: GAReportRequest): Promise<any> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Analytics');
  }

  const body: any = {
    dateRanges: [{ startDate: request.startDate, endDate: request.endDate }],
    metrics: request.metrics.map(m => ({ name: m })),
  };

  if (request.dimensions?.length) {
    body.dimensions = request.dimensions.map(d => ({ name: d }));
  }
  if (request.limit) {
    body.limit = request.limit;
  }
  if (request.orderBys?.length) {
    body.orderBys = request.orderBys;
  }

  const response = await fetch(
    `${GA_DATA_API}/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GA4 runReport error:', errorText);
    
    // Parse error details for better messages
    try {
      const errorData = JSON.parse(errorText);
      const msg = errorData?.error?.message || '';
      const reason = errorData?.error?.details?.[0]?.reason || '';
      
      if (reason === 'SERVICE_DISABLED' || msg.includes('has not been used in project')) {
        throw new Error('A Google Analytics Data API não está habilitada no seu projeto Google Cloud. Acesse o Google Cloud Console e ative a API "Google Analytics Data API".');
      }
      if (msg.includes('Invalid property ID') || msg.includes('numeric Property ID')) {
        throw new Error('Property ID inválido. É necessário um ID numérico da propriedade GA4 (não o Measurement ID). Acesse Admin → Detalhes da propriedade no GA4 para encontrar o ID numérico.');
      }
      if (response.status === 403) {
        throw new Error('Sem permissão para acessar esta propriedade GA4. Verifique se a conta Google tem acesso ao Analytics.');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('Unexpected token')) throw e;
    }
    
    throw new Error(`Falha ao buscar relatório GA4: HTTP ${response.status}`);
  }

  return response.json();
}

export async function runRealtimeReport(propertyId: string): Promise<any> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Analytics');
  }

  const body = {
    metrics: [
      { name: 'activeUsers' },
    ],
    dimensions: [
      { name: 'unifiedScreenName' },
    ],
    limit: 10,
  };

  const response = await fetch(
    `${GA_DATA_API}/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('GA4 realtime error:', error);
    throw new Error(`Falha ao buscar dados em tempo real: HTTP ${response.status}`);
  }

  return response.json();
}

// Helper to format GA4 response into simple objects
export function formatReportRows(report: any): any[] {
  if (!report?.rows) return [];
  
  const dimensionHeaders = report.dimensionHeaders?.map((h: any) => h.name) || [];
  const metricHeaders = report.metricHeaders?.map((h: any) => h.name) || [];

  return report.rows.map((row: any) => {
    const obj: any = {};
    row.dimensionValues?.forEach((v: any, i: number) => {
      obj[dimensionHeaders[i]] = v.value;
    });
    row.metricValues?.forEach((v: any, i: number) => {
      obj[metricHeaders[i]] = v.value;
    });
    return obj;
  });
}
