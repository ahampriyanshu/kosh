import type { MetadataRoute } from 'next';
import { getManifest } from '../lib/reports';
import { absoluteUrl } from '../lib/site';

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

  const reportEntries: MetadataRoute.Sitemap = manifest.reports.map((entry) => ({
    url: absoluteUrl(`/reports/${encodeURIComponent(entry.type)}/${encodeURIComponent(entry.dateKey)}/`),
    lastModified: entry.date,
    changeFrequency: 'monthly',
    priority: entry.type === 'daily' ? 0.8 : 0.6,
  }));

  return [...staticEntries, ...reportEntries];
}
