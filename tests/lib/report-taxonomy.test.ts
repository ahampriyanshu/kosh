import { describe, expect, it } from 'vitest';
import {
  REPORT_ARCHIVE_TYPES,
  REPORT_TYPE_HEADINGS,
  isReportArchiveType,
} from '../../lib/report-taxonomy';

describe('report taxonomy', () => {
  it('includes daily, weekly, and monthly reports in the report archive', () => {
    expect(REPORT_ARCHIVE_TYPES).toEqual(['daily', 'retro', 'weekly', 'monthly']);
    expect(isReportArchiveType('weekly')).toBe(true);
    expect(isReportArchiveType('monthly')).toBe(true);
    expect(isReportArchiveType('recap')).toBe(false);
    expect(isReportArchiveType('research')).toBe(false);
  });

  it('maps report types to unified user-facing headings', () => {
    expect(REPORT_TYPE_HEADINGS.daily).toBe('Daily Reports');
    expect(REPORT_TYPE_HEADINGS.retro).toBe('Daily Reports');
    expect(REPORT_TYPE_HEADINGS.weekly).toBe('Weekly Reports');
    expect(REPORT_TYPE_HEADINGS.monthly).toBe('Monthly Reports');
    expect(REPORT_TYPE_HEADINGS.recap).toBe('Weekly Recaps');
    expect(REPORT_TYPE_HEADINGS.research).toBe('Research');
  });
});
