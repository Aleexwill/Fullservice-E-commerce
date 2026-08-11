import { prisma } from './prisma';

export interface PageView {
  path: string;
  timestamp: string;
  referrer: string;
  userAgent: string;
}

export async function trackPageView(pathName: string, referrer: string = '', userAgent: string = ''): Promise<void> {
  await prisma.pageView.create({ data: { path: pathName, referrer, userAgent } });
}

export async function getAnalytics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalViews, todayViews, weekViews, weekRows] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { timestamp: { gte: todayStart } } }),
    prisma.pageView.count({ where: { timestamp: { gte: weekAgo } } }),
    prisma.pageView.findMany({ where: { timestamp: { gte: weekAgo } }, select: { path: true, referrer: true, timestamp: true } }),
  ]);

  const pageCounts: Record<string, number> = {};
  weekRows.forEach((v) => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1; });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count, pct: weekRows.length > 0 ? Math.round((count / weekRows.length) * 100) : 0 }));

  const dailyViews: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const count = weekRows.filter((v) => v.timestamp.toISOString().startsWith(dateStr)).length;
    dailyViews.push({ date: dateStr, count });
  }

  const todayStr = now.toISOString().split('T')[0];
  const hourly: number[] = new Array(24).fill(0);
  weekRows.filter((v) => v.timestamp.toISOString().startsWith(todayStr)).forEach((v) => {
    hourly[v.timestamp.getHours()]++;
  });

  const refCounts: Record<string, number> = {};
  weekRows.forEach((v) => {
    const ref = v.referrer || 'Directo';
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(refCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([referrer, count]) => ({ referrer, count }));

  return {
    totalViews,
    todayViews,
    weekViews,
    topPages,
    dailyViews,
    hourly,
    topReferrers,
    maxDailyViews: Math.max(...dailyViews.map((d) => d.count), 1),
  };
}
