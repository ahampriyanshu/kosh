import type { ReportType } from './schemas';

export const REPORT_ARCHIVE_TYPES = ['daily', 'retro', 'recap', 'research'] as const satisfies readonly ReportType[];
export const OUTLOOK_REPORT_TYPES = ['weekly', 'monthly'] as const satisfies readonly ReportType[];

export const REPORT_TYPE_HEADINGS: Record<ReportType, string> = {
  daily: 'Daily Briefs',
  retro: 'Mid-Session',
  recap: 'Weekly Recaps',
  weekly: 'Weekly Outlooks',
  monthly: 'Monthly Outlooks',
  research: 'Research',
};

export function isReportArchiveType(type: ReportType): boolean {
  return REPORT_ARCHIVE_TYPES.includes(type as (typeof REPORT_ARCHIVE_TYPES)[number]);
}

export function isOutlookReportType(type: ReportType): boolean {
  return OUTLOOK_REPORT_TYPES.includes(type as (typeof OUTLOOK_REPORT_TYPES)[number]);
}
