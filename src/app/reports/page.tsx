import { getManifest, getReport } from '../../lib/reports';
import type { ManifestEntry, ReportEnvelope, ReportType } from '../../../lib/schemas';
import { reportPath } from '../../../lib/report-routes';
import { ReportsMonthArchive, type ReportArchiveCard } from '../../components/ReportsMonthArchive';

type ContentRecord = Record<string, unknown>;

function asRecord(value: unknown): ContentRecord {
  return value !== null && typeof value === 'object' ? value as ContentRecord : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function firstSentence(value: string): string {
  return value.split(/(?<=[.!?])\s+/)[0]?.trim() || value.trim();
}

function titleCaseFallback(type: ReportType): string {
  if (type === 'weekly') return 'Weekly Market Review';
  if (type === 'monthly') return 'Monthly Market Review';
  return 'Daily Market Review';
}

function trimTitle(value: string, maxLength = 100): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cutAt = clean.lastIndexOf(' ', maxLength - 1);
  return `${clean.slice(0, cutAt > 45 ? cutAt : maxLength - 1).trimEnd()}…`;
}

function archiveCopy(envelope: ReportEnvelope): { title: string; description: string } {
  const content = asRecord(envelope.content);

  if (envelope.type === 'daily') {
    const outlook = typeof content.outlook === 'string' ? content.outlook : '';
    const headline = firstSentence(outlook);
    const remainder = outlook.slice(headline.length).trim();
    return {
      title: trimTitle(headline || titleCaseFallback(envelope.type)),
      description: remainder || strings(content.keyTakeaways).slice(0, 3).join(' '),
    };
  }

  if (envelope.type === 'retro') {
    const summary = typeof content.summary === 'string' ? content.summary : '';
    return {
      title: trimTitle(firstSentence(summary) || 'Daily Review'),
      description: summary,
    };
  }

  if (envelope.type === 'weekly') {
    const themes = strings(content.themes);
    const snapshot = asRecord(content.snapshot);
    const indices = Array.isArray(snapshot.indianIndices) ? snapshot.indianIndices : [];
    const indexSummary = indices
      .filter((value): value is ContentRecord => value !== null && typeof value === 'object')
      .slice(0, 2)
      .map((index) => `${String(index.name ?? 'Index')} ${Number(index.changePct) > 0 ? 'rose' : 'fell'} ${Math.abs(Number(index.changePct) || 0).toFixed(2)}%`)
      .join(' while ');
    return {
      title: trimTitle(themes[0] || titleCaseFallback(envelope.type)),
      description: [
        themes.length > 1 ? `Other themes: ${themes.slice(1, 4).join('; ')}.` : '',
        indexSummary ? `Major benchmarks: ${indexSummary}.` : '',
      ].filter(Boolean).join(' '),
    };
  }

  if (envelope.type === 'monthly') {
    const sectorInsights = strings(content.sectorInsights);
    const macroThemes = strings(content.macroThemes);
    return {
      title: trimTitle(firstSentence(sectorInsights[0] || macroThemes[0] || titleCaseFallback(envelope.type))),
      description: [macroThemes.slice(0, 2).join(' '), sectorInsights.slice(1, 3).join(' ')].filter(Boolean).join(' '),
    };
  }

  return { title: titleCaseFallback(envelope.type), description: '' };
}

function cardFrom(entry: ManifestEntry, envelope: ReportEnvelope): ReportArchiveCard {
  const copy = archiveCopy(envelope);
  const type = entry.type === 'retro' ? 'daily' : entry.type;
  return {
    id: entry.id,
    type: type === 'weekly' || type === 'monthly' ? type : 'daily',
    publishedAt: entry.date,
    href: reportPath(entry),
    title: copy.title,
    description: copy.description,
  };
}

export default async function ReportsPage() {
  const manifest = await getManifest();
  const candidates = manifest.reports.filter((entry) => (
    entry.type === 'daily' || entry.type === 'retro' || entry.type === 'weekly' || entry.type === 'monthly'
  ));
  const dailyDates = new Set(candidates.filter((entry) => entry.type === 'daily').map((entry) => entry.date));
  const archiveEntries = candidates.filter((entry) => entry.type !== 'retro' || !dailyDates.has(entry.date));

  const cards = await Promise.all(archiveEntries.map(async (entry) => {
    const envelope = await getReport(entry.id);
    return cardFrom(entry, envelope);
  }));

  return <ReportsMonthArchive entries={cards} />;
}
