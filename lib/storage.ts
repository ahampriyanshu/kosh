import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import {
  ReportEnvelopeSchema,
  ManifestSchema,
  type ReportEnvelope,
  type Manifest,
} from './schemas';

// Integrity model (single-process, sequential cron use):
// - Writes are atomic per file (temp + rename). The report file and manifest are
//   written in two steps and are NOT jointly atomic; a crash between them can orphan
//   a report file (no manifest entry). Acceptable here because jobs run one at a time.
// - Reports are stored at reports/<yyyy>/<mm>/<type>/<id>.json; reads are manifest-
//   resolved (the manifest entry's path field is the source of truth for file location).
// - writeReport trusts the caller-supplied envelope.checksum; readReport verifies it,
//   so post-write corruption is detected on read.

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}
function manifestPath(): string {
  return path.join(dataDir(), 'manifest.json');
}

// reports/<yyyy>/<mm>/<type>/<id>.json — yyyy/mm from the report's calendar date (generatedAt slice)
function reportRelPath(type: string, isoDate: string, id: string): string {
  const [yyyy, mm] = isoDate.split('-');
  return path.join('reports', yyyy, mm, type, `${id}.json`);
}

export function computeChecksum(content: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

async function atomicWriteJson(filePath: string, obj: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
  await rename(tmp, filePath); // atomic on the same filesystem
}

export async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(manifestPath(), 'utf8');
    return ManifestSchema.parse(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return { reports: [], latest: {} };
    }
    throw e;
  }
}

export async function writeReport(envelope: ReportEnvelope): Promise<void> {
  const valid = ReportEnvelopeSchema.parse(envelope); // validate on write
  const isoDate = valid.generatedAt.slice(0, 10);
  const rel = reportRelPath(valid.type, isoDate, valid.id);
  const file = path.join(dataDir(), rel);
  await atomicWriteJson(file, valid);

  const manifest = await readManifest();
  const entry = {
    id: valid.id,
    type: valid.type,
    dateKey: valid.dateKey,
    date: isoDate,
    path: rel,
    checksum: valid.checksum,
  };
  manifest.reports = manifest.reports.filter((r) => r.id !== valid.id);
  manifest.reports.push(entry);
  manifest.reports.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  manifest.latest = { ...manifest.latest, [valid.type]: valid.id };
  await atomicWriteJson(manifestPath(), ManifestSchema.parse(manifest));
}

export async function readReport(id: string): Promise<ReportEnvelope> {
  const manifest = await readManifest();
  const entry = manifest.reports.find((r) => r.id === id);
  if (!entry) throw new Error(`No manifest entry for report ${id}`);
  const raw = await readFile(path.join(dataDir(), entry.path), 'utf8');
  const envelope = ReportEnvelopeSchema.parse(JSON.parse(raw)); // validate shape on read
  const expected = computeChecksum(envelope.content);
  if (envelope.checksum !== expected) {
    throw new Error(`Checksum mismatch for report ${id}: stored ${envelope.checksum}, computed ${expected}`);
  }
  return envelope;
}

export async function findReportByRoute(type: string, dateKey: string): Promise<ReportEnvelope | null> {
  const manifest = await readManifest();
  const entry = manifest.reports.find((r) => r.type === type && r.dateKey === dateKey);
  return entry ? readReport(entry.id) : null;
}
