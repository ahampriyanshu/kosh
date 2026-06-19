import YahooFinance from 'yahoo-finance2';
import { type UniverseEntry, type UniverseQuote } from './schemas';

const yf = new YahooFinance({});

export interface Quote {
  price: number;
  currency: string;
  name: string;
}

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RawCandle {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export async function getQuote(ticker: string): Promise<Quote> {
  const q = await yf.quote(ticker);
  return {
    price: q.regularMarketPrice ?? 0,
    currency: q.currency ?? 'INR',
    name: q.shortName ?? q.longName ?? ticker,
  };
}

export async function getHistorical(
  ticker: string,
  period1: string,
  interval: '1d' | '1wk' | '1mo' = '1d',
): Promise<Candle[]> {
  // chart()'s return type is a union over its options overloads and may not
  // narrow on `return: 'array'`; isolate that with a local-shape cast.
  const result = (await yf.chart(ticker, { period1, interval, return: 'array' })) as unknown as {
    quotes: RawCandle[];
  };
  return result.quotes
    .filter((c) => c.close != null)
    .map((c) => ({
      date: c.date,
      open: c.open ?? 0,
      high: c.high ?? 0,
      low: c.low ?? 0,
      close: c.close as number,
      volume: c.volume ?? 0,
    }));
}

export interface QuoteDetail extends Quote {
  previousClose: number;
  volume: number;
}

export async function getQuoteDetail(ticker: string): Promise<QuoteDetail> {
  const q = (await yf.quote(ticker)) as unknown as {
    regularMarketPrice?: number;
    currency?: string;
    shortName?: string;
    longName?: string;
    regularMarketPreviousClose?: number;
    regularMarketVolume?: number;
  };
  return {
    price: q.regularMarketPrice ?? 0,
    currency: q.currency ?? 'INR',
    name: q.shortName ?? q.longName ?? ticker,
    previousClose: q.regularMarketPreviousClose ?? 0,
    volume: q.regularMarketVolume ?? 0,
  };
}

export async function searchTicker(query: string): Promise<string[]> {
  const res = (await yf.search(query)) as unknown as { quotes?: Array<{ symbol?: string }> };
  return (res.quotes ?? [])
    .map((q) => q.symbol)
    .filter((s): s is string => Boolean(s));
}

export interface MarketQuote { name: string; ltp: number; changePct: number; }

export async function getMarketQuote(symbol: string): Promise<MarketQuote> {
  const q = (await yf.quote(symbol)) as unknown as {
    regularMarketPrice?: number; regularMarketChangePercent?: number; shortName?: string; longName?: string;
  };
  return {
    name: q.shortName ?? q.longName ?? symbol,
    ltp: q.regularMarketPrice ?? 0,
    changePct: q.regularMarketChangePercent ?? 0,
  };
}

interface RawUniQuote {
  symbol?: string; regularMarketPrice?: number; regularMarketChangePercent?: number;
  regularMarketVolume?: number; averageDailyVolume3Month?: number;
  fiftyTwoWeekHigh?: number | null; fiftyTwoWeekLow?: number | null;
}

function oneYearAgo(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

function valid52WeekRange(ltp: number, high52w: number, low52w: number): boolean {
  return high52w > 0 && low52w > 0 && high52w >= low52w && ltp <= high52w && ltp >= low52w;
}

async function get52WeekRangeFromChart(ticker: string): Promise<{ high52w: number; low52w: number }> {
  const candles = await getHistorical(ticker, oneYearAgo(), '1d');
  const highs = candles.map((c) => c.high).filter((value) => value > 0);
  const lows = candles.map((c) => c.low).filter((value) => value > 0);
  return {
    high52w: highs.length ? Math.max(...highs) : 0,
    low52w: lows.length ? Math.min(...lows) : 0,
  };
}

// Batched quotes for the universe. yahoo-finance2 quote() accepts an array and returns an array.
// Chunk to stay within request limits; skip symbols that returned no price.
export async function getUniverseQuotes(entries: UniverseEntry[], chunkSize = 50): Promise<UniverseQuote[]> {
  const bySymbol = new Map(entries.map((e) => [e.ticker, e]));
  const out: UniverseQuote[] = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize).map((e) => e.ticker);
    const res = (await yf.quote(chunk)) as unknown as RawUniQuote[];
    for (const r of res) {
      const entry = r.symbol ? bySymbol.get(r.symbol) : undefined;
      if (!entry || r.regularMarketPrice == null) continue;
      let high52w = typeof r.fiftyTwoWeekHigh === 'number' ? r.fiftyTwoWeekHigh : 0;
      let low52w = typeof r.fiftyTwoWeekLow === 'number' ? r.fiftyTwoWeekLow : 0;
      if (!valid52WeekRange(r.regularMarketPrice, high52w, low52w)) {
        const chartRange = await get52WeekRangeFromChart(entry.ticker);
        high52w = chartRange.high52w;
        low52w = chartRange.low52w;
      }
      out.push({
        ticker: entry.ticker, name: entry.name, sector: entry.sector,
        ltp: r.regularMarketPrice,
        changePct: r.regularMarketChangePercent ?? 0,
        volume: r.regularMarketVolume ?? 0,
        avgVolume: r.averageDailyVolume3Month ?? 0,
        high52w,
        low52w,
      });
    }
  }
  return out;
}
