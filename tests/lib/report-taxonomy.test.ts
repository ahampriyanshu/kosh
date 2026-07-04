import { describe, expect, it } from 'vitest';
import {
  OUTLOOK_REPORT_TYPES,
  REPORT_ARCHIVE_TYPES,
  isOutlookReportType,
  isReportArchiveType,
} from '../../lib/report-taxonomy';

describe('report taxonomy', () => {
  it('keeps weekly and monthly outlooks out of the report archive', () => {
    expect(REPORT_ARCHIVE_TYPES).toEqual(['daily', 'retro', 'recap', 'research']);
    expect(isReportArchiveType('weekly')).toBe(false);
    expect(isReportArchiveType('monthly')).toBe(false);
  });

  it('groups weekly and monthly reports as outlooks', () => {
    expect(OUTLOOK_REPORT_TYPES).toEqual(['weekly', 'monthly']);
    expect(isOutlookReportType('weekly')).toBe(true);
    expect(isOutlookReportType('monthly')).toBe(true);
    expect(isOutlookReportType('recap')).toBe(false);
  });
});
