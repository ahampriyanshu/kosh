import type { ReportType } from './schemas';

export const REPORT_ARCHIVE_TYPES = ['daily', 'retro', 'weekly', 'monthly'] as const satisfies readonly ReportType[];

export const REPORT_TYPE_HEADINGS: Record<ReportType, string> = {
  daily: 'Daily Reports',
  retro: 'Daily Reports',
  weekly: 'Weekly Reports',
  monthly: 'Monthly Reports',
  recap: 'Weekly Recaps',
  research: 'Research',
};

export function isReportArchiveType(type: ReportType): boolean {
  return REPORT_ARCHIVE_TYPES.includes(type as (typeof REPORT_ARCHIVE_TYPES)[number]);
}
