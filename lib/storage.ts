import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import {
  ReportEnvelopeSchema,
  ManifestSchema,
  type ReportEnvelope,
  type Manifest,
} from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR ?? path.join(process.cwd(), 'data');
}
function briefingsDir(): string {
  return path.join(dataDir(), 'briefings');
}
function manifestPath(): string {
  return path.join(dataDir(), 'manifest.json');
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
  const file = path.join(briefingsDir(), `${valid.id}.json`);
  await atomicWriteJson(file, valid);

  const manifest = await readManifest();
  const entry = {
    id: valid.id,
    type: valid.type,
    date: valid.generatedAt.slice(0, 10),
    path: path.relative(dataDir(), file),
    checksum: valid.checksum,
  };
  manifest.reports = manifest.reports.filter((r) => r.id !== valid.id);
  manifest.reports.push(entry);
  manifest.reports.sort((a, b) => (a.id < b.id ? 1 : -1)); // newest id first
  manifest.latest = { ...manifest.latest, [valid.type]: valid.id };
  await atomicWriteJson(manifestPath(), ManifestSchema.parse(manifest));
}

export async function readReport(id: string): Promise<ReportEnvelope> {
  const raw = await readFile(path.join(briefingsDir(), `${id}.json`), 'utf8');
  return ReportEnvelopeSchema.parse(JSON.parse(raw)); // validate on read
}
