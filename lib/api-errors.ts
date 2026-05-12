import { NextResponse } from 'next/server';
import { logger } from './logger';
import { z } from 'zod';

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Não autenticado') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Não autorizado') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(404, `${resource} não encontrado`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Muitas requisições. Tente novamente mais tarde.') {
    super(429, message, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = 'Erro interno do servidor') {
    super(500, message, 'INTERNAL_ERROR');
    this.name = 'InternalServerError';
  }
}

export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    const validated = schema.safeParse(body);

    if (!validated.success) {
      const issues = validated.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      logger.warn('Request validation failed', { issues });
      throw new ValidationError('Dados inválidos', { issues });
    }

    return validated.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new ValidationError('JSON inválido');
    }
    throw error;
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    logger.warn(`API Error: ${error.code}`, {
      status: error.status,
      message: error.message,
      details: error.details,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      },
      { status: error.status }
    );
  }

  if (error instanceof SyntaxError) {
    logger.warn('Request parsing error', { message: error.message });
    return NextResponse.json(
      { error: 'JSON inválido', code: 'PARSE_ERROR' },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', error, { name: error.name });
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: 500 }
    );
  }

  logger.error('Unknown error', new Error(String(error)));
  return NextResponse.json(
    { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

export function createAPIHandler<T>(
  handler: (request: Request, context?: any) => Promise<NextResponse<T>> | NextResponse<T>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}
