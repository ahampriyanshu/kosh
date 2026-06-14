import { RSI, MACD, BollingerBands, SMA, EMA } from 'technicalindicators';

export function rsi(closes: number[], period = 14): number[] {
  return RSI.calculate({ values: closes, period });
}

export function macd(closes: number[]) {
  return MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
}

export function bollinger(closes: number[], period = 20, stdDev = 2) {
  return BollingerBands.calculate({ period, values: closes, stdDev });
}

export function sma(closes: number[], period: number): number[] {
  return SMA.calculate({ period, values: closes });
}

export function ema(closes: number[], period: number): number[] {
  return EMA.calculate({ period, values: closes });
}

export type Trend = 'bullish' | 'bearish' | 'neutral';

export function trend(closes: number[]): Trend {
  if (closes.length < 50) return 'neutral';
  const s = sma(closes, 50);
  const last = closes[closes.length - 1];
  const lastSma = s[s.length - 1];
  if (last > lastSma * 1.01) return 'bullish';
  if (last < lastSma * 0.99) return 'bearish';
  return 'neutral';
}
