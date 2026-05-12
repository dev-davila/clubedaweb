import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/security';

/**
 * Middleware global para:
 * 1. Security headers
 * 2. CORS
 * 3. IP Blocking
 * 4. Request logging
 * 5. Rate limiting (básico)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const timestamp = new Date().toISOString();
  
  // Get client IP (for logging/monitoring)
  const clientIP = getClientIP(request);
  
  // Note: IP blocking is implemented per-endpoint in API routes using the security module
  // Middleware cannot use async/await for IP blocking checks

  // Log de requisição (apenas para endpoints da API)
  if (pathname.startsWith('/api/')) {
    // console.log(`[${timestamp}] ${method} ${pathname}`);
  }

  // Preparar resposta com security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // X-Frame-Options removido - CSP frame-ancestors já cobre proteção contra clickjacking
  // e DENY bloqueia o iframe de preview do Abacus.AI
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP (Content Security Policy) - customizado para permitir analytics
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apps.abacus.ai https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.m3solutions.net.br https://*.m3solutions.com.br https://www.google-analytics.com https://*.analytics.google.com https://apis.google.com https://graph.facebook.com https://*.s3.*.amazonaws.com https://*.s3.amazonaws.com https://s3.*.amazonaws.com",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', cspHeader);

  // CORS para API (se necessário)
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
};
