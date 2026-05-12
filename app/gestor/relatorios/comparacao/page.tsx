export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { ComparisonClient } from "./client";

export default async function ComparisonPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/gestor/login");

  const now = new Date();
  const currentYear = now.getFullYear();

  // Find the earliest record to know available years
  const earliest = await prisma.pageView.findFirst({
    where: { isBot: false },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const startYear = earliest ? earliest.createdAt.getFullYear() : currentYear;
  const years: number[] = [];
  for (let y = startYear; y <= currentYear; y++) years.push(y);

  // Monthly data per year (views + sessions)
  const monthlyRaw: { year: number; month: number; views: number; sessions: number }[] = await prisma.$queryRaw`
    SELECT
      EXTRACT(YEAR FROM "createdAt")::int as year,
      EXTRACT(MONTH FROM "createdAt")::int as month,
      COUNT(*)::int as views,
      COUNT(DISTINCT "sessionId")::int as sessions
    FROM "PageView"
    WHERE "isBot" = false
    GROUP BY year, month
    ORDER BY year, month
  `;

  // Yearly totals
  const yearlyRaw: { year: number; views: number; sessions: number }[] = await prisma.$queryRaw`
    SELECT
      EXTRACT(YEAR FROM "createdAt")::int as year,
      COUNT(*)::int as views,
      COUNT(DISTINCT "sessionId")::int as sessions
    FROM "PageView"
    WHERE "isBot" = false
    GROUP BY year
    ORDER BY year
  `;

  // Monthly top pages for current and previous year (top 10 per year)
  const topPagesCurrentYear: { path: string; views: number }[] = await prisma.$queryRaw`
    SELECT path, COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND EXTRACT(YEAR FROM "createdAt") = ${currentYear}
    GROUP BY path ORDER BY views DESC LIMIT 15
  `;

  const topPagesPrevYear: { path: string; views: number }[] = years.length > 1 ? await prisma.$queryRaw`
    SELECT path, COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false AND EXTRACT(YEAR FROM "createdAt") = ${currentYear - 1}
    GROUP BY path ORDER BY views DESC LIMIT 15
  ` : [];

  // Channel comparison per year
  const channelsByYear: { year: number; channel: string; views: number }[] = await prisma.$queryRaw`
    SELECT
      EXTRACT(YEAR FROM "createdAt")::int as year,
      COALESCE("channelGroup", 'Direto / Desconhecido') as channel,
      COUNT(*)::int as views
    FROM "PageView"
    WHERE "isBot" = false
    GROUP BY year, channel
    ORDER BY year, views DESC
  `;

  // Format monthly data: { "2025": [{month:1, views:X, sessions:Y}, ...], ... }
  const monthlyByYear: Record<string, { month: number; monthLabel: string; views: number; sessions: number }[]> = {};
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  for (const y of years) {
    monthlyByYear[String(y)] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthLabel: monthLabels[i],
      views: 0,
      sessions: 0,
    }));
  }
  for (const r of monthlyRaw) {
    const yearData = monthlyByYear[String(r.year)];
    if (yearData && yearData[r.month - 1]) {
      yearData[r.month - 1].views = r.views;
      yearData[r.month - 1].sessions = r.sessions;
    }
  }

  // Format yearly totals
  const yearlyTotals = yearlyRaw.map((r) => ({
    year: r.year,
    views: r.views,
    sessions: r.sessions,
  }));

  // Format channels by year
  const channelsGrouped: Record<string, { channel: string; views: number }[]> = {};
  for (const r of channelsByYear) {
    if (!channelsGrouped[String(r.year)]) channelsGrouped[String(r.year)] = [];
    channelsGrouped[String(r.year)].push({ channel: r.channel, views: r.views });
  }

  return (
    <ComparisonClient
      years={years}
      currentYear={currentYear}
      monthlyByYear={monthlyByYear}
      yearlyTotals={yearlyTotals}
      topPagesCurrentYear={topPagesCurrentYear}
      topPagesPrevYear={topPagesPrevYear}
      channelsByYear={channelsGrouped}
    />
  );
}
