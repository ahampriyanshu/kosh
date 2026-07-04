import type { MetadataRoute } from 'next';
import { getManifest } from '../lib/reports';
import { absoluteUrl } from '../lib/site';
import { entryPath } from '../../lib/report-routes';

export const dynamic = 'force-static';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

const staticRoutes: Array<{
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/reports/', changeFrequency: 'daily', priority: 0.9 },
  { path: '/outlook/', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/scorecard/', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/research/', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/portfolio/', changeFrequency: 'daily', priority: 0.7 },
];

function latestDate(dates: string[]): string | undefined {
  return dates.filter(Boolean).sort().at(-1);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const manifest = await getManifest();
  const latestReportDate = latestDate(manifest.reports.map((entry) => entry.date));

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: latestReportDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const reportEntryMap = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of manifest.reports) {
    const path = entryPath(entry);
    const url = absoluteUrl(path.endsWith('/') ? path : `${path}/`);
    const existing = reportEntryMap.get(url);
    if (existing && String(existing.lastModified ?? '') > entry.date) continue;

    reportEntryMap.set(url, {
      url,
      lastModified: entry.date,
      changeFrequency: 'monthly',
      priority: entry.type === 'daily' ? 0.8 : 0.6,
    });
  }
  const reportEntries: MetadataRoute.Sitemap = Array.from(reportEntryMap.values());

  return [...staticEntries, ...reportEntries];
}
