import { readFile, rm, access } from 'node:fs/promises';
import path from 'node:path';
import type { ZodType } from 'zod';
import { atomicWriteJson } from '../storage';
import { MarketSnapshotSchema, type MarketSnapshot } from '../schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}
function feedDir(date: string): string {
  return path.join(dataDir(), 'feed', date);
}
function slicePath(date: string, name: string): string {
  return path.join(feedDir(date), `${name}.json`);
}
export function snapshotRelPath(date: string): string {
  const [yyyy, mm] = date.split('-');
  return path.join('snapshots', yyyy, mm, `${date}.json`);
}

export async function writeSlice<T>(date: string, name: string, slice: T, schema: ZodType<T>): Promise<void> {
  const valid = schema.parse(slice);
  await atomicWriteJson(slicePath(date, name), valid);
}

export async function readSlice<T>(date: string, name: string, schema: ZodType<T>): Promise<T | null> {
  try {
    const raw = await readFile(slicePath(date, name), 'utf8');
    return schema.parse(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    throw e;
  }
}

export async function writeSnapshot(date: string, snapshot: MarketSnapshot): Promise<void> {
  const valid = MarketSnapshotSchema.parse(snapshot);
  await atomicWriteJson(path.join(dataDir(), snapshotRelPath(date)), valid);
}

export async function readSnapshot(date: string): Promise<MarketSnapshot | null> {
  try {
    const raw = await readFile(path.join(dataDir(), snapshotRelPath(date)), 'utf8');
    return MarketSnapshotSchema.parse(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteFeed(date: string): Promise<void> {
  await rm(feedDir(date), { recursive: true, force: true });
}

export async function feedExists(date: string, name: string): Promise<boolean> {
  return access(slicePath(date, name)).then(() => true).catch(() => false);
}
