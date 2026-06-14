import { readManifest, readReport, findReportByRoute } from '../../lib/storage';
import { getWatchlist } from '../../lib/watchlist';
import { readPortfolio } from '../../lib/portfolio';
import type { ReportEnvelope, ReportType, Manifest } from '../../lib/schemas';

export async function getManifest(): Promise<Manifest> { return readManifest(); }
export async function getReport(id: string): Promise<ReportEnvelope> { return readReport(id); }
export async function getReportByRoute(type: string, dateKey: string): Promise<ReportEnvelope | null> {
  return findReportByRoute(type, dateKey);
}
export async function getAllReports(): Promise<ReportEnvelope[]> {
  const m = await readManifest();
  return Promise.all(m.reports.map((r) => readReport(r.id)));
}
export async function getReportsByType(type: ReportType): Promise<ReportEnvelope[]> {
  const m = await readManifest();
  return Promise.all(m.reports.filter((r) => r.type === type).map((r) => readReport(r.id)));
}
export async function getLatest(type: ReportType): Promise<ReportEnvelope | null> {
  const m = await readManifest();
  const id = m.latest[type];
  return id ? readReport(id) : null;
}
export { getWatchlist, readPortfolio };
