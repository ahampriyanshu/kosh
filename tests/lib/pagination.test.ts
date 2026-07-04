import { describe, expect, it } from 'vitest';
import { paginateByCursor } from '../../lib/pagination';

const items = Array.from({ length: 18 }, (_, index) => ({ id: `recap-${index + 1}` }));

describe('paginateByCursor', () => {
  it('returns the first page when no cursor is provided', () => {
    const page = paginateByCursor(items, { cursor: null, size: 8, getCursor: (item) => item.id });

    expect(page.items.map((item) => item.id)).toEqual([
      'recap-1',
      'recap-2',
      'recap-3',
      'recap-4',
      'recap-5',
      'recap-6',
      'recap-7',
      'recap-8',
    ]);
    expect(page.nextCursor).toBe('recap-8');
    expect(page.previousCursor).toBeNull();
  });

  it('returns the page after the matching cursor', () => {
    const page = paginateByCursor(items, { cursor: 'recap-8', size: 8, getCursor: (item) => item.id });

    expect(page.items.map((item) => item.id)).toEqual([
      'recap-9',
      'recap-10',
      'recap-11',
      'recap-12',
      'recap-13',
      'recap-14',
      'recap-15',
      'recap-16',
    ]);
    expect(page.nextCursor).toBe('recap-16');
    expect(page.previousCursor).toBeNull();
  });

  it('returns a previous cursor for pages after the second page', () => {
    const page = paginateByCursor(items, { cursor: 'recap-16', size: 8, getCursor: (item) => item.id });

    expect(page.items.map((item) => item.id)).toEqual(['recap-17', 'recap-18']);
    expect(page.nextCursor).toBeNull();
    expect(page.previousCursor).toBe('recap-8');
  });

  it('falls back to the first page for an unknown cursor', () => {
    const page = paginateByCursor(items, { cursor: 'missing', size: 8, getCursor: (item) => item.id });

    expect(page.items[0]?.id).toBe('recap-1');
    expect(page.previousCursor).toBeNull();
  });
});
