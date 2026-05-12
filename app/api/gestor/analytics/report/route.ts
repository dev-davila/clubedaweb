import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGA4PropertyId, runReport, runRealtimeReport, formatReportRows } from '@/lib/google-analytics-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // 7, 15, 30, realtime
    const type = searchParams.get('type') || 'overview'; // overview, pages, devices, daily, monthly

    const propertyId = await getGA4PropertyId();
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID do GA4 n\u00e3o encontrado. Reconecte ao Google com permiss\u00f5es de Analytics.', needsAuth: true },
        { status: 400 }
      );
    }

    // Realtime report
    if (period === 'realtime') {
      const data = await runRealtimeReport(propertyId);
      const rows = formatReportRows(data);
      const totalActive = data.rows?.reduce(
        (sum: number, row: any) => sum + parseInt(row.metricValues?.[0]?.value || '0', 10),
        0
      ) || 0;
      return NextResponse.json({
        activeUsers: totalActive,
        topPages: rows.slice(0, 10).map((r: any) => ({
          page: r.unifiedScreenName || '(not set)',
          activeUsers: parseInt(r.activeUsers || '0', 10),
        })),
      });
    }

    const days = parseInt(period, 10);
    const endDate = 'today';
    const startDate = `${days}daysAgo`;

    if (type === 'overview') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'bounceRate'],
      });

      const row = report.rows?.[0];
      const values = row?.metricValues || [];

      return NextResponse.json({
        activeUsers: parseInt(values[0]?.value || '0', 10),
        sessions: parseInt(values[1]?.value || '0', 10),
        pageViews: parseInt(values[2]?.value || '0', 10),
        avgSessionDuration: parseFloat(values[3]?.value || '0'),
        bounceRate: parseFloat(values[4]?.value || '0'),
      });
    }

    if (type === 'pages') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['screenPageViews', 'activeUsers'],
        dimensions: ['pagePath', 'pageTitle'],
        limit: 20,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      });

      const rows = formatReportRows(report);
      return NextResponse.json({
        pages: rows.map((r: any) => ({
          path: r.pagePath,
          title: r.pageTitle || r.pagePath,
          views: parseInt(r.screenPageViews || '0', 10),
          users: parseInt(r.activeUsers || '0', 10),
        })),
      });
    }

    if (type === 'devices') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers'],
        dimensions: ['deviceCategory'],
      });

      const rows = formatReportRows(report);
      const total = rows.reduce((s: number, r: any) => s + parseInt(r.activeUsers || '0', 10), 0);
      return NextResponse.json({
        devices: rows.map((r: any) => {
          const users = parseInt(r.activeUsers || '0', 10);
          return {
            device: r.deviceCategory,
            users,
            percentage: total > 0 ? Math.round((users / total) * 100) : 0,
          };
        }),
      });
    }

    if (type === 'daily') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions', 'screenPageViews'],
        dimensions: ['date'],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 90,
      });

      const rows = formatReportRows(report);
      return NextResponse.json({
        daily: rows.map((r: any) => ({
          date: r.date, // YYYYMMDD format
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
          pageViews: parseInt(r.screenPageViews || '0', 10),
        })),
      });
    }

    if (type === 'monthly') {
      // Get last 12 months of data
      const report = await runReport(propertyId, {
        startDate: '365daysAgo',
        endDate: 'today',
        metrics: ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'bounceRate'],
        dimensions: ['yearMonth'],
        orderBys: [{ dimension: { dimensionName: 'yearMonth' }, desc: true }],
        limit: 12,
      });

      const rows = formatReportRows(report);
      return NextResponse.json({
        monthly: rows.map((r: any) => ({
          yearMonth: r.yearMonth, // YYYYMM format
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
          pageViews: parseInt(r.screenPageViews || '0', 10),
          avgDuration: parseFloat(r.averageSessionDuration || '0'),
          bounceRate: parseFloat(r.bounceRate || '0'),
        })),
      });
    }

    if (type === 'countries') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions', 'screenPageViews'],
        dimensions: ['country'],
        limit: 20,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      });

      const rows = formatReportRows(report);
      return NextResponse.json({
        countries: rows.map((r: any) => ({
          country: r.country,
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
          pageViews: parseInt(r.screenPageViews || '0', 10),
        })),
      });
    }

    if (type === 'hourly') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions', 'screenPageViews'],
        dimensions: ['hour'],
        orderBys: [{ dimension: { dimensionName: 'hour' }, desc: false }],
        limit: 24,
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        hourly: rows.map((r: any) => ({
          hour: parseInt(r.hour || '0', 10),
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
          pageViews: parseInt(r.screenPageViews || '0', 10),
        })),
      });
    }

    if (type === 'browsers') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions'],
        dimensions: ['browser'],
        limit: 15,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        browsers: rows.map((r: any) => ({
          browser: r.browser,
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
        })),
      });
    }

    if (type === 'os') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions'],
        dimensions: ['operatingSystem'],
        limit: 15,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        os: rows.map((r: any) => ({
          os: r.operatingSystem,
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
        })),
      });
    }

    if (type === 'sources') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers', 'sessions', 'screenPageViews'],
        dimensions: ['sessionDefaultChannelGroup'],
        limit: 15,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        sources: rows.map((r: any) => ({
          source: r.sessionDefaultChannelGroup,
          users: parseInt(r.activeUsers || '0', 10),
          sessions: parseInt(r.sessions || '0', 10),
          pageViews: parseInt(r.screenPageViews || '0', 10),
        })),
      });
    }

    if (type === 'referrers') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['sessions', 'screenPageViews'],
        dimensions: ['sessionSource'],
        limit: 20,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        referrers: rows.map((r: any) => ({
          source: r.sessionSource,
          sessions: parseInt(r.sessions || '0', 10),
          pageViews: parseInt(r.screenPageViews || '0', 10),
        })),
      });
    }

    if (type === 'screen') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['activeUsers'],
        dimensions: ['screenResolution'],
        limit: 10,
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        screens: rows.map((r: any) => ({
          resolution: r.screenResolution,
          users: parseInt(r.activeUsers || '0', 10),
        })),
      });
    }

    if (type === 'landing') {
      const report = await runReport(propertyId, {
        startDate,
        endDate,
        metrics: ['sessions', 'activeUsers', 'bounceRate'],
        dimensions: ['landingPagePlusQueryString'],
        limit: 20,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });
      const rows = formatReportRows(report);
      return NextResponse.json({
        landing: rows.map((r: any) => ({
          page: r.landingPagePlusQueryString,
          sessions: parseInt(r.sessions || '0', 10),
          users: parseInt(r.activeUsers || '0', 10),
          bounceRate: parseFloat(r.bounceRate || '0'),
        })),
      });
    }

    return NextResponse.json({ error: 'Tipo inv\u00e1lido' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados de analytics' },
      { status: 500 }
    );
  }
}
