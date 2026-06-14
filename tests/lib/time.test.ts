import { describe, it, expect } from 'vitest';
import { istDateString } from '../../lib/time';

describe('istDateString', () => {
  it('returns YYYY-MM-DD in IST', () => {
    // 2026-06-14T02:30:00Z == 2026-06-14 08:00 IST
    expect(istDateString(new Date('2026-06-14T02:30:00.000Z'))).toBe('2026-06-14');
  });

  it('rolls to the next IST day for late-UTC times', () => {
    // 2026-06-30T18:30:00Z == 2026-07-01 00:00 IST
    expect(istDateString(new Date('2026-06-30T18:30:00.000Z'))).toBe('2026-07-01');
  });
});
