import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodSchema, ZodError } from 'zod';
import { authOptions } from './auth-options';
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError,
  APIError,
  NotFoundError,
  RateLimitError,
  handleAPIError as handleAPIErrorFn
} from './api-errors';

// Re-export error classes for use in API routes
export { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, RateLimitError, APIError };

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new AuthenticationError('Sessão expirada. Faça login novamente.');
  }

  return session;
}

export async function requireRole(request: NextRequest, roles: string[]) {
  const session = await requireAuth(request);
  const userRole = (session.user as any)?.role;

  if (!roles.includes(userRole)) {
    throw new AuthorizationError('Você não tem permissão para realizar esta ação.');
  }

  return session;
}

export async function getUser(request: NextRequest) {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || real || 'unknown';
}

export function getRequestMetadata(request: NextRequest) {
  return {
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || 'unknown',
    method: request.method,
    url: new URL(request.url).pathname,
  };
}

const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now - entry.timestamp > windowMs) {
    requestCounts.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export function getQueryParams<T extends Record<string, string>>(
  request: NextRequest,
  schema: Record<keyof T, (value: string) => any>
): Partial<T> {
  const params: Partial<T> = {};
  const searchParams = new URL(request.url).searchParams;

  for (const [key, parser] of Object.entries(schema)) {
    const value = searchParams.get(key);
    if (value) {
      try {
        (params as any)[key] = parser(value);
      } catch (error) {
        // Skip invalid params
      }
    }
  }

  return params;
}

export function createTimer() {
  const start = Date.now();
  return {
    duration: () => Date.now() - start,
    log: (label: string) => {
      const duration = Date.now() - start;
      return { label, duration: `${duration}ms` };
    },
  };
}

/**
 * Valida requisição contra um schema Zod
 * @param request - NextRequest a ser validada
 * @param schema - Schema Zod para validação
 * @returns Dados validados
 * @throws ValidationError se a validação falhar
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema
): Promise<T> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return validated as T;
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new ValidationError(`Dados inválidos: ${issues}`);
    }
    throw new ValidationError('Erro ao processar requisição');
  }
}

/**
 * Wrapper para criar um API handler com tratamento de erro
 * @param handler - Função handler da requisição
 * @returns NextResponse com erro ou resultado do handler
 */
export function createAPIHandler(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Trata erros de API de forma centralizada
 */
export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: error.message, code: 'AUTHENTICATION_ERROR' },
      { status: 401 }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message, code: 'AUTHORIZATION_ERROR' },
      { status: 403 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'Erro desconhecido', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  );
}
