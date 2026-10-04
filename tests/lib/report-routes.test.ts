import { describe, expect, it } from 'vitest';
import type { ManifestEntry } from '../../lib/schemas';
import {
  dateReportPath,
  entryPath,
  parseDateReportSlug,
  parseReportSlug,
  reportPath,
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

  it('routes weekly and monthly reports inside the Reports archive', () => {
    expect(reportPath(entry('weekly', '2026-W26', '2026-06-28'))).toBe('/reports/2026/06/week-4');
    expect(reportPath(entry('monthly', '2026-06', '2026-06-30'))).toBe('/reports/2026/06/month');
    expect(parseReportSlug(['2026', '06', 'week-4'])).toEqual({
      type: 'weekly', year: '2026', month: '06', period: 'week-4',
    });
    expect(parseReportSlug(['2026', '06', 'w4'])).toBeNull();
  });

  it('routes each report type inside the Reports archive', () => {
    expect(entryPath(entry('weekly', '2026-W26', '2026-06-28'))).toBe('/reports/2026/06/week-4');
    expect(entryPath(entry('monthly', '2026-06', '2026-06-30'))).toBe('/reports/2026/06/month');
    expect(entryPath({ ...entry('research', '1', '2026-07-04'), id: '1' })).toBe('/research/1');
    expect(entryPath(entry('daily', '2026-07-04', '2026-07-04'))).toBe('/reports/2026/07/04');
  });
});
