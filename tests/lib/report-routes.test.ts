import { describe, expect, it } from 'vitest';
import type { ManifestEntry } from '../../lib/schemas';
import {
  dateReportPath,
  entryPath,
  outlookPath,
  parseDateReportSlug,
  parseOutlookSlug,
} from '../../lib/report-routes';

function entry(type: ManifestEntry['type'], dateKey: string, date: string): ManifestEntry {
  return {
    id: `${type}-${dateKey}`,
    type,
    dateKey,
    date,
    path: `reports/2026/06/${type}/${type}-${dateKey}.json`,
    checksum: 'sha256:x',
  };
}

describe('report routes', () => {
  it('builds clean date report paths', () => {
    expect(dateReportPath('2026-07-04')).toBe('/reports/2026/07/04');
    expect(parseDateReportSlug(['2026', '07', '04'])).toBe('2026-07-04');
    expect(parseDateReportSlug(['2026', '7', '4'])).toBeNull();
  });

  it('builds clean weekly and monthly outlook paths', () => {
    expect(outlookPath(entry('weekly', '2026-W26', '2026-06-28'))).toBe('/outlook/2026/06/week-4');
    expect(outlookPath(entry('monthly', '2026-06', '2026-06-30'))).toBe('/outlook/2026/06/month');
    expect(parseOutlookSlug(['2026', '06', 'week-4'])).toEqual({ year: '2026', month: '06', period: 'week-4' });
    expect(parseOutlookSlug(['2026', '06', 'w4'])).toBeNull();
  });

  it('routes outlook entries to outlook and regular report entries to date pages', () => {
    expect(entryPath(entry('weekly', '2026-W26', '2026-06-28'))).toBe('/outlook/2026/06/week-4');
    expect(entryPath(entry('monthly', '2026-06', '2026-06-30'))).toBe('/outlook/2026/06/month');
    expect(entryPath(entry('daily', '2026-07-04', '2026-07-04'))).toBe('/reports/2026/07/04');
  });
});
