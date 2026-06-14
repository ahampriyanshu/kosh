import { describe, it, expect } from 'vitest';
import { istDateString, istParts, isFirstOfMonthIST, istMonthId, istWeekId } from '../../lib/time';

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

describe('istParts', () => {
  it('returns year/month/day in IST', () => {
    expect(istParts(new Date('2026-06-14T02:30:00.000Z'))).toEqual({ year: 2026, month: 6, day: 14 });
  });
});

describe('isFirstOfMonthIST', () => {
  it('returns true when the IST date is the 1st', () => {
    // 2026-06-30T18:30:00Z == 2026-07-01 00:00 IST
    expect(isFirstOfMonthIST(new Date('2026-06-30T18:30:00.000Z'))).toBe(true);
  });

  it('returns false when the IST date is not the 1st', () => {
    expect(isFirstOfMonthIST(new Date('2026-06-14T02:30:00.000Z'))).toBe(false);
  });
});

describe('istMonthId', () => {
  it('returns YYYY-MM for the IST calendar month', () => {
    expect(istMonthId(new Date('2026-06-14T02:30:00.000Z'))).toBe('2026-06');
  });
});

describe('istWeekId', () => {
  it('returns the correct ISO week for 2026-01-01 (W01)', () => {
    expect(istWeekId(new Date('2026-01-01T06:00:00.000Z'))).toBe('2026-W01');
  });

  it('returns the correct ISO week for 2026-06-14 (W24)', () => {
    expect(istWeekId(new Date('2026-06-14T02:30:00.000Z'))).toBe('2026-W24');
  });

  it('returns 2026-W01 for 2025-12-29 (ISO week 1 of 2026 starts Mon 2025-12-29)', () => {
    expect(istWeekId(new Date('2025-12-29T06:00:00.000Z'))).toBe('2026-W01');
  });
});
