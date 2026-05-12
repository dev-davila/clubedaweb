import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper para formatar datas
function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  
  if (period === 'realtime') {
    start.setMinutes(start.getMinutes() - 30);
    return { start, end };
  }
  
  const days = parseInt(period, 10) || 7;
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';
    const type = searchParams.get('type') || 'overview';

    const { start, end } = getDateRange(period);
    const baseWhere = { createdAt: { gte: start, lte: end }, isBot: false };

    // ========== REALTIME ==========
    if (period === 'realtime') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { path: true, sessionId: true },
      });

      const uniqueSessions = new Set(views.map(v => v.sessionId));
      const pageCounts: Record<string, Set<string>> = {};
      for (const v of views) {
        if (!pageCounts[v.path]) pageCounts[v.path] = new Set();
        pageCounts[v.path].add(v.sessionId);
      }

      const topPages = Object.entries(pageCounts)
        .map(([page, sessions]) => ({ page, activeUsers: sessions.size }))
        .sort((a, b) => b.activeUsers - a.activeUsers)
        .slice(0, 10);

      return NextResponse.json({
        activeUsers: uniqueSessions.size,
        topPages,
      });
    }

    // ========== OVERVIEW ==========
    if (type === 'overview') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { sessionId: true, path: true, duration: true },
      });

      const uniqueUsers = new Set(views.map(v => v.sessionId));
      const sessions = new Set(views.map(v => v.sessionId));
      const pageViews = views.length;

      // Duração média das sessões
      const sessionDurations: Record<string, number> = {};
      for (const v of views) {
        if (v.duration && v.duration > 0) {
          sessionDurations[v.sessionId] = (sessionDurations[v.sessionId] || 0) + v.duration;
        }
      }
      const durValues = Object.values(sessionDurations);
      const avgDuration = durValues.length > 0
        ? durValues.reduce((a, b) => a + b, 0) / durValues.length
        : 0;

      // Bounce rate: sessões com apenas 1 pageview
      const sessionPageCounts: Record<string, number> = {};
      for (const v of views) {
        sessionPageCounts[v.sessionId] = (sessionPageCounts[v.sessionId] || 0) + 1;
      }
      const totalSessions = Object.keys(sessionPageCounts).length;
      const bounceSessions = Object.values(sessionPageCounts).filter(c => c === 1).length;
      const bounceRate = totalSessions > 0 ? bounceSessions / totalSessions : 0;

      return NextResponse.json({
        activeUsers: uniqueUsers.size,
        sessions: sessions.size,
        pageViews,
        avgSessionDuration: avgDuration,
        bounceRate,
      });
    }

    // ========== DAILY ==========
    if (type === 'daily') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { createdAt: true, sessionId: true, path: true },
      });

      const dayMap: Record<string, { users: Set<string>; sessions: Set<string>; pvs: number }> = {};
      for (const v of views) {
        const d = v.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
        if (!dayMap[d]) dayMap[d] = { users: new Set(), sessions: new Set(), pvs: 0 };
        dayMap[d].users.add(v.sessionId);
        dayMap[d].sessions.add(v.sessionId);
        dayMap[d].pvs++;
      }

      const daily = Object.entries(dayMap)
        .map(([date, data]) => ({
          date,
          users: data.users.size,
          sessions: data.sessions.size,
          pageViews: data.pvs,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({ daily });
    }

    // ========== MONTHLY ==========
    if (type === 'monthly') {
      // Últimos 12 meses
      const yearStart = new Date();
      yearStart.setFullYear(yearStart.getFullYear() - 1);
      yearStart.setDate(1);
      yearStart.setHours(0, 0, 0, 0);

      const views = await prisma.pageView.findMany({
        where: { createdAt: { gte: yearStart, lte: end }, isBot: false },
        select: { createdAt: true, sessionId: true, duration: true },
      });

      const monthMap: Record<string, {
        users: Set<string>; sessions: Set<string>; pvs: number;
        durations: number[]; bounceMap: Record<string, number>;
      }> = {};

      for (const v of views) {
        const ym = `${v.createdAt.getFullYear()}${String(v.createdAt.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap[ym]) monthMap[ym] = { users: new Set(), sessions: new Set(), pvs: 0, durations: [], bounceMap: {} };
        monthMap[ym].users.add(v.sessionId);
        monthMap[ym].sessions.add(v.sessionId);
        monthMap[ym].pvs++;
        if (v.duration && v.duration > 0) monthMap[ym].durations.push(v.duration);
        monthMap[ym].bounceMap[v.sessionId] = (monthMap[ym].bounceMap[v.sessionId] || 0) + 1;
      }

      const monthly = Object.entries(monthMap)
        .map(([yearMonth, data]) => {
          const avgDur = data.durations.length > 0
            ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
            : 0;
          const totalS = Object.keys(data.bounceMap).length;
          const bounces = Object.values(data.bounceMap).filter(c => c === 1).length;
          return {
            yearMonth,
            users: data.users.size,
            sessions: data.sessions.size,
            pageViews: data.pvs,
            avgDuration: avgDur,
            bounceRate: totalS > 0 ? bounces / totalS : 0,
          };
        })
        .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

      return NextResponse.json({ monthly });
    }

    // ========== HOURLY ==========
    if (type === 'hourly') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { createdAt: true, sessionId: true },
      });

      const hourMap: Record<number, { users: Set<string>; sessions: Set<string>; pvs: number }> = {};
      for (let h = 0; h < 24; h++) hourMap[h] = { users: new Set(), sessions: new Set(), pvs: 0 };
      for (const v of views) {
        const h = v.createdAt.getHours();
        hourMap[h].users.add(v.sessionId);
        hourMap[h].sessions.add(v.sessionId);
        hourMap[h].pvs++;
      }

      const hourly = Object.entries(hourMap)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          users: data.users.size,
          sessions: data.sessions.size,
          pageViews: data.pvs,
        }))
        .sort((a, b) => a.hour - b.hour);

      return NextResponse.json({ hourly });
    }

    // ========== COUNTRIES ==========
    if (type === 'countries') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { country: true, sessionId: true },
      });

      const countryMap: Record<string, { users: Set<string>; pvs: number }> = {};
      for (const v of views) {
        const c = v.country || 'Brasil';
        if (!countryMap[c]) countryMap[c] = { users: new Set(), pvs: 0 };
        countryMap[c].users.add(v.sessionId);
        countryMap[c].pvs++;
      }

      const countries = Object.entries(countryMap)
        .map(([country, data]) => ({
          country,
          users: data.users.size,
          sessions: data.users.size,
          pageViews: data.pvs,
        }))
        .sort((a, b) => b.pageViews - a.pageViews)
        .slice(0, 20);

      return NextResponse.json({ countries });
    }

    // ========== BROWSERS ==========
    if (type === 'browsers') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { browser: true, sessionId: true },
      });

      const map: Record<string, { users: Set<string>; sessions: number }> = {};
      for (const v of views) {
        const b = v.browser || 'Desconhecido';
        if (!map[b]) map[b] = { users: new Set(), sessions: 0 };
        map[b].users.add(v.sessionId);
        map[b].sessions++;
      }

      const browsers = Object.entries(map)
        .map(([browser, data]) => ({
          browser,
          users: data.users.size,
          sessions: data.sessions,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 15);

      return NextResponse.json({ browsers });
    }

    // ========== OS ==========
    if (type === 'os') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { os: true, sessionId: true },
      });

      const map: Record<string, { users: Set<string>; sessions: number }> = {};
      for (const v of views) {
        const o = v.os || 'Desconhecido';
        if (!map[o]) map[o] = { users: new Set(), sessions: 0 };
        map[o].users.add(v.sessionId);
        map[o].sessions++;
      }

      const os = Object.entries(map)
        .map(([os, data]) => ({
          os,
          users: data.users.size,
          sessions: data.sessions,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 15);

      return NextResponse.json({ os });
    }

    // ========== DEVICES ==========
    if (type === 'devices') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { deviceType: true, sessionId: true },
      });

      const map: Record<string, Set<string>> = {};
      for (const v of views) {
        const d = v.deviceType || 'desktop';
        if (!map[d]) map[d] = new Set();
        map[d].add(v.sessionId);
      }

      const total = new Set(views.map(v => v.sessionId)).size;
      const devices = Object.entries(map)
        .map(([device, sessions]) => ({
          device,
          users: sessions.size,
          percentage: total > 0 ? Math.round((sessions.size / total) * 100) : 0,
        }))
        .sort((a, b) => b.users - a.users);

      return NextResponse.json({ devices });
    }

    // ========== SOURCES (Channel Groups) ==========
    if (type === 'sources') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { channelGroup: true, sessionId: true },
      });

      const map: Record<string, { users: Set<string>; sessions: number; pvs: number }> = {};
      for (const v of views) {
        const s = v.channelGroup || 'Direct';
        if (!map[s]) map[s] = { users: new Set(), sessions: 0, pvs: 0 };
        map[s].users.add(v.sessionId);
        map[s].sessions++;
        map[s].pvs++;
      }

      const sources = Object.entries(map)
        .map(([source, data]) => ({
          source,
          users: data.users.size,
          sessions: data.sessions,
          pageViews: data.pvs,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 15);

      return NextResponse.json({ sources });
    }

    // ========== REFERRERS ==========
    if (type === 'referrers') {
      const views = await prisma.pageView.findMany({
        where: { ...baseWhere, referrerDomain: { not: null } },
        select: { referrerDomain: true, sessionId: true },
      });

      const map: Record<string, { sessions: Set<string>; pvs: number }> = {};
      for (const v of views) {
        const r = v.referrerDomain || '(direct)';
        if (!map[r]) map[r] = { sessions: new Set(), pvs: 0 };
        map[r].sessions.add(v.sessionId);
        map[r].pvs++;
      }

      // Adiciona (direct) para views sem referrer
      const directViews = await prisma.pageView.count({
        where: { ...baseWhere, referrerDomain: null },
      });

      const referrers = [
        { source: '(direct)', sessions: directViews, pageViews: directViews },
        ...Object.entries(map)
          .map(([source, data]) => ({
            source,
            sessions: data.sessions.size,
            pageViews: data.pvs,
          }))
          .sort((a, b) => b.sessions - a.sessions),
      ].slice(0, 20);

      return NextResponse.json({ referrers });
    }

    // ========== PAGES ==========
    if (type === 'pages') {
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { path: true, title: true, sessionId: true },
      });

      const map: Record<string, { title: string; views: number; users: Set<string> }> = {};
      for (const v of views) {
        if (!map[v.path]) map[v.path] = { title: v.title || v.path, views: 0, users: new Set() };
        map[v.path].views++;
        map[v.path].users.add(v.sessionId);
        if (v.title && v.title !== v.path) map[v.path].title = v.title;
      }

      const pages = Object.entries(map)
        .map(([path, data]) => ({
          path,
          title: data.title,
          views: data.views,
          users: data.users.size,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20);

      return NextResponse.json({ pages });
    }

    // ========== LANDING PAGES ==========
    if (type === 'landing') {
      // Primeira página de cada sessão
      const views = await prisma.pageView.findMany({
        where: baseWhere,
        select: { path: true, sessionId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      // Agrupar: primeira pageview de cada sessão
      const sessionFirst: Record<string, string> = {};
      const sessionCounts: Record<string, number> = {};
      for (const v of views) {
        if (!sessionFirst[v.sessionId]) sessionFirst[v.sessionId] = v.path;
        sessionCounts[v.sessionId] = (sessionCounts[v.sessionId] || 0) + 1;
      }

      const landingMap: Record<string, { sessions: number; users: Set<string>; bounces: number }> = {};
      for (const [sid, page] of Object.entries(sessionFirst)) {
        if (!landingMap[page]) landingMap[page] = { sessions: 0, users: new Set(), bounces: 0 };
        landingMap[page].sessions++;
        landingMap[page].users.add(sid);
        if (sessionCounts[sid] === 1) landingMap[page].bounces++;
      }

      const landing = Object.entries(landingMap)
        .map(([page, data]) => ({
          page,
          sessions: data.sessions,
          users: data.users.size,
          bounceRate: data.sessions > 0 ? data.bounces / data.sessions : 0,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 20);

      return NextResponse.json({ landing });
    }

    // ========== SCREEN RESOLUTIONS ==========
    if (type === 'screen') {
      const views = await prisma.pageView.findMany({
        where: { ...baseWhere, screenWidth: { not: null }, screenHeight: { not: null } },
        select: { screenWidth: true, screenHeight: true, sessionId: true },
      });

      const map: Record<string, Set<string>> = {};
      for (const v of views) {
        const res = `${v.screenWidth}x${v.screenHeight}`;
        if (!map[res]) map[res] = new Set();
        map[res].add(v.sessionId);
      }

      const screens = Object.entries(map)
        .map(([resolution, sessions]) => ({
          resolution,
          users: sessions.size,
        }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 10);

      return NextResponse.json({ screens });
    }

    // ========== ERRORS (páginas 404 / não encontradas) ==========
    if (type === 'errors') {
      const views = await prisma.pageView.findMany({
        where: {
          ...baseWhere,
          OR: [
            { title: { contains: '404', mode: 'insensitive' } },
            { title: { contains: 'não encontrad', mode: 'insensitive' } },
            { title: { contains: 'not found', mode: 'insensitive' } },
            { title: null },
          ],
        },
        select: { path: true, title: true, referrer: true, createdAt: true, sessionId: true },
        orderBy: { createdAt: 'desc' },
      });

      const map: Record<string, { path: string; title: string | null; count: number; sessions: Set<string>; lastSeen: Date; referrers: Set<string> }> = {};
      for (const v of views) {
        if (!map[v.path]) {
          map[v.path] = { path: v.path, title: v.title, count: 0, sessions: new Set(), lastSeen: v.createdAt, referrers: new Set() };
        }
        map[v.path].count++;
        map[v.path].sessions.add(v.sessionId);
        if (v.referrer) map[v.path].referrers.add(v.referrer);
        if (v.createdAt > map[v.path].lastSeen) map[v.path].lastSeen = v.createdAt;
      }

      const errors = Object.values(map)
        .map(e => ({
          path: e.path,
          title: e.title || '(sem título)',
          hits: e.count,
          users: e.sessions.size,
          lastSeen: e.lastSeen.toISOString(),
          referrers: Array.from(e.referrers).slice(0, 3),
        }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 50);

      return NextResponse.json({ errors });
    }

    // ========== STATS (para dashboard resumido) ==========
    if (type === 'stats') {
      const totalViews = await prisma.pageView.count({ where: baseWhere });
      const allViews = await prisma.pageView.findMany({
        where: baseWhere,
        select: { sessionId: true },
      });
      const uniqueVisitors = new Set(allViews.map(v => v.sessionId)).size;
      const totalAll = await prisma.pageView.count({ where: { isBot: false } });

      return NextResponse.json({
        totalViews,
        uniqueVisitors,
        totalAllTime: totalAll,
      });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('[Local Analytics] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados de analytics local' },
      { status: 500 }
    );
  }
}