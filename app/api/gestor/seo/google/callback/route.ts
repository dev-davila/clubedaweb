import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getGoogleSearchConsoleCredentials } from '@/lib/seo-credentials';
import { SITE_BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state') || ''; // redirect_to path

    // Usa SITE_BASE_URL para redirects consistentes
    const baseUrl = process.env.NEXTAUTH_URL || SITE_BASE_URL;

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/gestor/seo/google?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/gestor/seo/google?error=no_code`
      );
    }

    const credentials = getGoogleSearchConsoleCredentials();
    if (!credentials) {
      return NextResponse.redirect(
        `${baseUrl}/gestor/seo/google?error=no_credentials`
      );
    }

    // DEVE ser idêntica à redirect_uri usada em auth/route.ts
    const redirectUri = `${SITE_BASE_URL}/api/gestor/seo/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/gestor/seo/google?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();

    // Delete existing tokens and save new one
    await prisma.sEOGoogleToken.deleteMany({});
    
    await prisma.sEOGoogleToken.create({
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    });

    // Redirect to the page that initiated the auth, or default to Google SEO page
    const redirectPath = state && state.startsWith('/') ? state : '/gestor/seo/google';
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?success=true`
    );
  } catch (error) {
    console.error('Callback error:', error);
    const fallbackUrl = process.env.NEXTAUTH_URL || SITE_BASE_URL;
    const redirectPath = '/gestor/seo/google';
    return NextResponse.redirect(
      `${fallbackUrl}${redirectPath}?error=callback_failed`
    );
  }
}
