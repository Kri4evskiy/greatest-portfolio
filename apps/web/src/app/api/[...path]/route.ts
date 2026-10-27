import { randomUUID } from 'node:crypto';
import {
  APP_VERSION,
  type ArticleMeta,
  ArticleReactionInputSchema,
  GuestPassFormSchema,
  type Role,
  type SessionProfile,
  type TelemetryEvent,
  VISITOR_ROLE_LABELS,
} from '@repo/shared-schemas';
import { type NextRequest, NextResponse } from 'next/server';

const KB_ACCESS_COOKIE = 'kb_access_token';
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

const fallbackMetrics = new Map<string, ArticleMeta>([
  [
    'adr-full-stack-catalog',
    {
      slug: 'adr-full-stack-catalog',
      category: 'architecture-devops',
      viewsCount: 142,
      helpfulCount: 48,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'react-18-vs-19-compiler-and-fiber',
    {
      slug: 'react-18-vs-19-compiler-and-fiber',
      category: 'react',
      viewsCount: 98,
      helpfulCount: 37,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'nestjs-jwt-httponly-rbac-prisma',
    {
      slug: 'nestjs-jwt-httponly-rbac-prisma',
      category: 'nestjs-prisma',
      viewsCount: 116,
      helpfulCount: 41,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'strict-typescript-zod-contracts',
    {
      slug: 'strict-typescript-zod-contracts',
      category: 'typescript',
      viewsCount: 84,
      helpfulCount: 29,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'tanstack-redact-bundle-experiment',
    {
      slug: 'tanstack-redact-bundle-experiment',
      category: 'architecture-devops',
      viewsCount: 73,
      helpfulCount: 26,
      updatedAt: new Date().toISOString(),
    },
  ],
]);

let latestTelemetryMessage = `SSE Stream Active • Build v${APP_VERSION}`;

function encodeToken(profile: SessionProfile): string {
  return Buffer.from(JSON.stringify(profile), 'utf8').toString('base64url');
}

function decodeToken(token: string | undefined): SessionProfile {
  const guest: SessionProfile = {
    id: null,
    displayName: null,
    visitorType: null,
    role: 'GUEST',
    expiresAt: null,
  };
  if (!token) return guest;
  try {
    // Support both NestJS 3-part JWT and fallback base64url token
    const parts = token.split('.');
    const payloadSegment = parts.length === 3 ? parts[1] : token;
    if (!payloadSegment) return guest;
    const decoded = JSON.parse(
      Buffer.from(payloadSegment, 'base64url').toString('utf8'),
    ) as Partial<SessionProfile> & { sub?: string };

    if (!decoded.role || !decoded.displayName) return guest;
    return {
      id: decoded.id ?? decoded.sub ?? randomUUID(),
      displayName: decoded.displayName,
      visitorType: decoded.visitorType ?? 'TEAM_LEAD',
      role: decoded.role,
      expiresAt: decoded.expiresAt ?? null,
    };
  } catch {
    return guest;
  }
}

async function tryProxyToNestApi(request: NextRequest, subPath: string): Promise<Response | null> {
  const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';
  const targetUrl = `${apiOrigin}/api/${subPath}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);

    const headers = new Headers();
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const bodyText =
      request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().text() : null;

    const resp = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: bodyText,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp;
  } catch {
    return null;
  }
}

async function handleApiRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const subPath = path.join('/');

  // 1. SSE Stream endpoint
  if (subPath === 'telemetry/stream' && request.method === 'GET') {
    const encoder = new TextEncoder();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (message: string) => {
          const payload: TelemetryEvent = {
            id: randomUUID(),
            type: 'SYSTEM_HEARTBEAT',
            message,
            timestamp: new Date().toISOString(),
          };
          const chunk = `event: telemetry\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        };

        sendEvent(latestTelemetryMessage);
        intervalId = setInterval(() => {
          sendEvent(latestTelemetryMessage);
        }, 15000);
      },
      cancel() {
        if (intervalId) clearInterval(intervalId);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // 2. Try forwarding to NestJS apps/api on :4000 first
  const proxied = await tryProxyToNestApi(request, subPath);
  if (proxied) {
    return proxied;
  }

  // 3. Seamless Local Fallback when only apps/web is running
  if (subPath === 'auth/me' && request.method === 'GET') {
    const token = request.cookies.get(KB_ACCESS_COOKIE)?.value;
    return NextResponse.json(decodeToken(token));
  }

  if (subPath === 'auth/guest-pass' && request.method === 'POST') {
    const rawBody: unknown = await request.json();
    const parsed = GuestPassFormSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid Guest Pass input' }, { status: 400 });
    }

    const expectedSecret = process.env.ADMIN_SECRET_PASSCODE ?? 'workfolio-admin-2026';
    const role: Role =
      parsed.data.adminPasscode && parsed.data.adminPasscode === expectedSecret ? 'ADMIN' : 'USER';

    const profile: SessionProfile = {
      id: randomUUID(),
      displayName: parsed.data.displayName,
      visitorType: parsed.data.visitorType,
      role,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_SECONDS * 1000).toISOString(),
    };

    latestTelemetryMessage = `${profile.displayName} (${VISITOR_ROLE_LABELS[parsed.data.visitorType]}) unlocked Base of Knowledge as ${role}`;

    const response = NextResponse.json(profile);
    response.cookies.set(KB_ACCESS_COOKIE, encodeToken(profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SEVEN_DAYS_SECONDS,
    });
    return response;
  }

  if (subPath === 'auth/logout' && request.method === 'POST') {
    const guest: SessionProfile = {
      id: null,
      displayName: null,
      visitorType: null,
      role: 'GUEST',
      expiresAt: null,
    };
    const response = NextResponse.json(guest);
    response.cookies.delete(KB_ACCESS_COOKIE);
    return response;
  }

  if (subPath === 'knowledge/metrics' && request.method === 'GET') {
    return NextResponse.json({ items: Array.from(fallbackMetrics.values()) });
  }

  if (subPath.startsWith('knowledge/') && request.method === 'POST') {
    const rawBody: unknown = await request.json().catch(() => ({}));
    const parsed = ArticleReactionInputSchema.safeParse(rawBody);
    const parts = subPath.split('/');
    const slug = parts[1] ?? parsed.data?.slug ?? 'adr-full-stack-catalog';
    const action = parts[2];

    const existing = fallbackMetrics.get(slug) ?? {
      slug,
      category: parsed.data?.category ?? 'architecture-devops',
      viewsCount: 100,
      helpfulCount: 25,
      updatedAt: new Date().toISOString(),
    };

    const updated: ArticleMeta =
      action === 'helpful'
        ? {
            ...existing,
            helpfulCount: existing.helpfulCount + 1,
            updatedAt: new Date().toISOString(),
          }
        : {
            ...existing,
            viewsCount: existing.viewsCount + 1,
            updatedAt: new Date().toISOString(),
          };

    fallbackMetrics.set(slug, updated);
    if (action === 'helpful') {
      latestTelemetryMessage = `Reader marked "${slug}" as Helpful (${updated.helpfulCount} helpful)`;
    }
    return NextResponse.json(updated);
  }

  return NextResponse.json({ status: 'ok', version: APP_VERSION });
}

export const GET = handleApiRequest;
export const POST = handleApiRequest;
