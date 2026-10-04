import { describe, expect, it } from 'vitest';
import {
  OUTLOOK_REPORT_TYPES,
  REPORT_ARCHIVE_TYPES,
  REPORT_TYPE_HEADINGS,
  isOutlookReportType,
  isReportArchiveType,
} from '../../lib/report-taxonomy';

describe('report taxonomy', () => {
  it('keeps recaps, research, and outlooks out of the report archive', () => {
    expect(REPORT_ARCHIVE_TYPES).toEqual(['daily', 'retro']);
    expect(isReportArchiveType('weekly')).toBe(false);
    expect(isReportArchiveType('monthly')).toBe(false);
    expect(isReportArchiveType('recap')).toBe(false);
    expect(isReportArchiveType('research')).toBe(false);
  });

  it('groups weekly and monthly reports as outlooks', () => {
    expect(OUTLOOK_REPORT_TYPES).toEqual(['weekly', 'monthly']);
    expect(isOutlookReportType('weekly')).toBe(true);
    expect(isOutlookReportType('monthly')).toBe(true);
    expect(isOutlookReportType('recap')).toBe(false);
  });

  it('maps report types to modern user-facing headings', () => {
    expect(REPORT_TYPE_HEADINGS.daily).toBe('Daily Reports');
    expect(REPORT_TYPE_HEADINGS.retro).toBe('Daily Reports');
    expect(REPORT_TYPE_HEADINGS.weekly).toBe('Weekly Outlooks');
    expect(REPORT_TYPE_HEADINGS.monthly).toBe('Monthly Outlooks');
    expect(REPORT_TYPE_HEADINGS.recap).toBe('Weekly Recaps');
    expect(REPORT_TYPE_HEADINGS.research).toBe('Research');
  });
});
