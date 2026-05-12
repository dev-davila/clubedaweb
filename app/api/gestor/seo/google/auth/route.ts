import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGoogleSearchConsoleCredentials } from '@/lib/seo-credentials';
import { SITE_BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const credentials = getGoogleSearchConsoleCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'Credenciais do Google Search Console não configuradas' },
        { status: 500 }
      );
    }

    // Support redirect_to query param for post-auth redirection
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirect_to') || '';

    // Use SITE_BASE_URL fixo para que a redirect_uri seja sempre a mesma
    // independente do domínio de acesso (m3solutions.com.br, www, newsite, etc.)
    const redirectUri = `${SITE_BASE_URL}/api/gestor/seo/google/callback`;
    
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: redirectTo, // pass through as state param
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
