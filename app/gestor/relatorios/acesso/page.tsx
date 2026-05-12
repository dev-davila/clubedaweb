export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { AccessReportClient } from "./client";

type PeriodKey = "hoje" | "7d" | "15d" | "30d" | "3m" | "6m" | "1a";

const PERIOD_DAYS: Record<PeriodKey, number> = {
  hoje: 1,
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1a": 365,
};

interface PageProps {
  searchParams: { periodo?: string };
}

export default async function AccessReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/gestor/login");

  const periodKey = (Object.keys(PERIOD_DAYS).includes(searchParams.periodo || "") ? searchParams.periodo : "30d") as PeriodKey;
  const days = PERIOD_DAYS[periodKey];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Current period range
  const periodStart = periodKey === "hoje" ? today : new Date(today.getTime() - days * 86400000);
  const periodEnd = now;

  // Previous period (same duration, right before current)
  const prevStart = new Date(periodStart.getTime() - days * 86400000);
  const prevEnd = periodStart;

  // Helper for where clause
  const currentWhere = { isBot: false, createdAt: { gte: periodStart, lte: periodEnd } };
  const prevWhere = { isBot: false, createdAt: { gte: prevStart, lte: prevEnd } };

  // --- Main stats: current + previous ---
  const [currentViews, prevViews, currentBots, totalViews] = await Promise.all([
    prisma.pageView.count({ where: currentWhere }),
    prisma.pageView.count({ where: prevWhere }),
    prisma.pageView.count({ where: { isBot: true, createdAt: { gte: periodStart, lte: periodEnd } } }),
    prisma.pageView.count({ where: { isBot: false } }),
  ]);

  // --- Unique sessions + unique IPs current + prev ---
  const sessionsIpsRaw: { curr_sessions: bigint; prev_sessions: bigint; curr_ips: bigint; prev_ips: bigint }[] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(DISTINCT "sessionId") FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd})::bigint as curr_sessions,
      (SELECT COUNT(DISTINCT "sessionId") FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${prevStart} AND "createdAt" <= ${prevEnd})::bigint as prev_sessions,
      (SELECT COUNT(DISTINCT ip) FROM "PageView" WHERE "isBot"=false AND ip IS NOT NULL AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd})::bigint as curr_ips,
      (SELECT COUNT(DISTINCT ip) FROM "PageView" WHERE "isBot"=false AND ip IS NOT NULL AND "createdAt" >= ${prevStart} AND "createdAt" <= ${prevEnd})::bigint as prev_ips
  `;
  const currentSessions = Number(sessionsIpsRaw[0]?.curr_sessions || 0);
  const prevSessions = Number(sessionsIpsRaw[0]?.prev_sessions || 0);
  const currentUniqueIPs = Number(sessionsIpsRaw[0]?.curr_ips || 0);
  const prevUniqueIPs = Number(sessionsIpsRaw[0]?.prev_ips || 0);

  // --- Bounce rate (sessions with only 1 pageview) ---
  const bounceRaw: { curr_bounce: number; curr_total: number; prev_bounce: number; prev_total: number }[] = await prisma.$queryRaw`
    SELECT
      COALESCE((SELECT COUNT(*)::int FROM (SELECT "sessionId" FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd} GROUP BY "sessionId" HAVING COUNT(*)=1) s), 0) as curr_bounce,
      COALESCE((SELECT COUNT(DISTINCT "sessionId")::int FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}), 0) as curr_total,
      COALESCE((SELECT COUNT(*)::int FROM (SELECT "sessionId" FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${prevStart} AND "createdAt" <= ${prevEnd} GROUP BY "sessionId" HAVING COUNT(*)=1) s), 0) as prev_bounce,
      COALESCE((SELECT COUNT(DISTINCT "sessionId")::int FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${prevStart} AND "createdAt" <= ${prevEnd}), 0) as prev_total
  `;
  const currBounceRate = bounceRaw[0]?.curr_total > 0 ? Math.round((bounceRaw[0].curr_bounce / bounceRaw[0].curr_total) * 100) : 0;
  const prevBounceRate = bounceRaw[0]?.prev_total > 0 ? Math.round((bounceRaw[0].prev_bounce / bounceRaw[0].prev_total) * 100) : 0;

  // --- Avg pages/session + duration current + prev ---
  const behaviorRaw: { curr_pages: string; curr_dur: number; prev_pages: string; prev_dur: number }[] = await prisma.$queryRaw`
    SELECT
      COALESCE((SELECT AVG(pg)::numeric(10,2) FROM (SELECT "sessionId", COUNT(*)::int as pg FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd} GROUP BY "sessionId") s), 0) as curr_pages,
      COALESCE((SELECT AVG(duration)::int FROM "PageView" WHERE "isBot"=false AND duration IS NOT NULL AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}), 0) as curr_dur,
      COALESCE((SELECT AVG(pg)::numeric(10,2) FROM (SELECT "sessionId", COUNT(*)::int as pg FROM "PageView" WHERE "isBot"=false AND "createdAt" >= ${prevStart} AND "createdAt" <= ${prevEnd} GROUP BY "sessionId") s), 0) as prev_pages,
      COALESCE((SELECT AVG(duration)::int FROM "PageView" WHERE "isBot"=false AND duration IS NOT NULL AND "createdAt" >= ${prevStart} AND "createdAt" <= ${prevEnd}), 0) as prev_dur
  `;
  const avgPagesPerSession = parseFloat(String(behaviorRaw[0]?.curr_pages || "0"));
  const avgDuration = Number(behaviorRaw[0]?.curr_dur || 0);
  const prevAvgPages = parseFloat(String(behaviorRaw[0]?.prev_pages || "0"));
  const prevAvgDuration = Number(behaviorRaw[0]?.prev_dur || 0);

  // --- Top pages (ALL, no limit) ---
  const topPagesRaw: any[] = await prisma.pageView.groupBy({
    by: ["path"],
    where: currentWhere,
    _count: { path: true },
    orderBy: { _count: { path: "desc" } },
    take: 500,
  }) as any;
  const topPages = topPagesRaw.map((r: any) => ({ path: r.path, views: r._count.path }));
  const uniquePages = topPages.length;

  // --- Entry pages (first page of each session) ---
  const entryPagesRaw: { path: string; entries: number }[] = await prisma.$queryRaw`
    SELECT path, COUNT(*)::int as entries FROM (
      SELECT DISTINCT ON ("sessionId") "sessionId", path
      FROM "PageView"
      WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
      ORDER BY "sessionId", "createdAt" ASC
    ) first_pages
    GROUP BY path ORDER BY entries DESC LIMIT 20
  `;
  const entryPages = entryPagesRaw.map(r => ({ path: r.path, views: r.entries }));

  // --- Exit pages (last page of each session) ---
  const exitPagesRaw: { path: string; exits: number }[] = await prisma.$queryRaw`
    SELECT path, COUNT(*)::int as exits FROM (
      SELECT DISTINCT ON ("sessionId") "sessionId", path
      FROM "PageView"
      WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
      ORDER BY "sessionId", "createdAt" DESC
    ) last_pages
    GROUP BY path ORDER BY exits DESC LIMIT 20
  `;
  const exitPages = exitPagesRaw.map(r => ({ path: r.path, views: r.exits }));

  // --- Referrer domains (ALL) ---
  const referrersRaw: any[] = await prisma.pageView.groupBy({
    by: ["referrerDomain"],
    where: { ...currentWhere, referrerDomain: { not: null } },
    _count: { referrerDomain: true },
    orderBy: { _count: { referrerDomain: "desc" } },
    take: 200,
  }) as any;
  const referrers = referrersRaw
    .filter((r: any) => r.referrerDomain)
    .map((r: any) => ({ domain: r.referrerDomain!, views: r._count.referrerDomain }));

  // --- Devices ---
  const devicesRaw: any[] = await prisma.pageView.groupBy({
    by: ["deviceType"],
    where: currentWhere,
    _count: { deviceType: true },
    orderBy: { _count: { deviceType: "desc" } },
  }) as any;
  const devices = devicesRaw.map((r: any) => ({
    type: r.deviceType || "Desconhecido",
    views: r._count.deviceType,
  }));

  // --- Daily views ---
  const dailyViewsRaw: any[] = await prisma.$queryRaw`
    SELECT DATE("createdAt") as date, COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;
  const dailyViews = dailyViewsRaw.map((r: any) => ({
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
    views: Number(r.views),
  }));

  // --- Browsers ---
  const browsersRaw: any[] = await prisma.pageView.groupBy({
    by: ["browser"],
    where: { ...currentWhere, browser: { not: null } },
    _count: { browser: true },
    orderBy: { _count: { browser: "desc" } },
    take: 10,
  }) as any;
  const browsers = browsersRaw
    .filter((r: any) => r.browser)
    .map((r: any) => ({ name: r.browser!, views: r._count.browser }));

  // --- OS ---
  const osRaw: any[] = await prisma.pageView.groupBy({
    by: ["os"],
    where: { ...currentWhere, os: { not: null } },
    _count: { os: true },
    orderBy: { _count: { os: "desc" } },
    take: 10,
  }) as any;
  const osList = osRaw
    .filter((r: any) => r.os)
    .map((r: any) => ({ name: r.os!, views: r._count.os }));

  // --- Hourly distribution ---
  const hourlyRaw: { hour: number; views: number }[] = await prisma.$queryRaw`
    SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
    GROUP BY hour ORDER BY hour
  `;
  const hourly = hourlyRaw.map((r) => ({ hour: r.hour, views: r.views }));

  // --- Channel groups ---
  const channelsRaw: { channelGroup: string | null; views: number }[] = await prisma.$queryRaw`
    SELECT "channelGroup", COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
    GROUP BY "channelGroup" ORDER BY views DESC
  `;
  const channels = channelsRaw.map((r) => ({
    channel: r.channelGroup || "Direto / Desconhecido",
    views: r.views,
  }));

  // --- Languages ---
  const langsRaw: { language: string; views: number }[] = await prisma.$queryRaw`
    SELECT language, COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd} AND language IS NOT NULL
    GROUP BY language ORDER BY views DESC LIMIT 15
  `;
  const languages = langsRaw.map((r) => ({ lang: r.language, views: r.views }));

  // --- Countries ---
  const countriesRaw: { country: string; views: number }[] = await prisma.$queryRaw`
    SELECT country, COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd} AND country IS NOT NULL
    GROUP BY country ORDER BY views DESC LIMIT 15
  `;
  const countries = countriesRaw.map((r) => ({ country: r.country, views: r.views }));

  // --- 404 errors (ALL) ---
  const errors404Raw: { path: string; views: number }[] = await prisma.$queryRaw`
    SELECT path, COUNT(*)::int as views
    FROM "PageView"
    WHERE "statusCode" = 404 AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
    GROUP BY path ORDER BY views DESC
  `;
  const errors404 = errors404Raw.map((r) => ({ path: r.path, views: r.views }));
  const total404 = await prisma.pageView.count({
    where: { statusCode: 404, createdAt: { gte: periodStart, lte: periodEnd } },
  });

  // --- Redirects (ALL) ---
  const redirects = await prisma.urlRedirect.findMany({
    where: { active: true },
    orderBy: [{ hits: "desc" }, { createdAt: "desc" }],
    select: { id: true, sourcePath: true, targetPath: true, statusCode: true, hits: true, createdAt: true, note: true },
  });
  const totalRedirects = await prisma.urlRedirect.count({ where: { active: true } });

  return (
    <AccessReportClient
      period={periodKey}
      periodLabel={{
        hoje: "Hoje",
        "7d": "7 dias",
        "15d": "15 dias",
        "30d": "30 dias",
        "3m": "3 meses",
        "6m": "6 meses",
        "1a": "1 ano",
      }[periodKey]}
      stats={{
        currentViews,
        prevViews,
        totalViews,
        botViews: currentBots,
        currentSessions,
        prevSessions,
        currentUniqueIPs,
        prevUniqueIPs,
        uniquePages,
        bounceRate: currBounceRate,
        prevBounceRate,
        avgPagesPerSession,
        avgDuration,
        prevAvgPages,
        prevAvgDuration,
      }}
      topPages={topPages}
      entryPages={entryPages}
      exitPages={exitPages}
      referrers={referrers}
      devices={devices}
      dailyViews={dailyViews}
      browsers={browsers}
      osList={osList}
      hourly={hourly}
      channels={channels}
      languages={languages}
      countries={countries}
      errors404={errors404}
      total404={total404}
      redirects={redirects.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      totalRedirects={totalRedirects}
    />
  );
}
