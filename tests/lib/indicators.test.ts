import { describe, it, expect } from 'vitest';
import { rsi, sma, trend } from '../../lib/indicators';

describe('indicators', () => {
  it('sma of a constant series is that constant', () => {
    const out = sma([5, 5, 5, 5], 2);
    expect(out[out.length - 1]).toBe(5);
  });

  it('rsi of a strictly rising series is high (>70)', () => {
    const rising = Array.from({ length: 30 }, (_, i) => 100 + i);
    const out = rsi(rising, 14);
    expect(out[out.length - 1]).toBeGreaterThan(70);
  });

  it('trend is bullish when price is well above its 50-SMA', () => {
    const series = [...Array.from({ length: 50 }, () => 100), 130];
    expect(trend(series)).toBe('bullish');
  });

  it('trend is neutral with insufficient data', () => {
    expect(trend([1, 2, 3])).toBe('neutral');
  });
});
