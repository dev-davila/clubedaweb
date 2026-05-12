export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getClientIP, checkRateLimit } from '@/lib/api-utils';

const pageViewSchema = z.object({
  path: z.string().min(1),
  referrer: z.string().nullable().optional(),
  userAgent: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get IP from request headers
    const ip = getClientIP(request);
    
    // Rate limit: 1000 requests per minute per IP (generous for public analytics)
    if (!checkRateLimit(`analytics-pageview-${ip}`, 1000, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = pageViewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { path, referrer, userAgent, duration, statusCode } = parsed.data;

    // Create page view record
    const sessionId = request.headers.get('x-session-id') || 
                      request.cookies.get('sessionId')?.value || 
                      `session-${Date.now()}`;

    await prisma.pageView.create({
      data: {
        sessionId,
        path,
        referrer: referrer || null,
        userAgent: userAgent || null,
        ip,
        statusCode: statusCode || 200,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record page view' },
      { status: 500 }
    );
  }
}
