import YahooFinance from 'yahoo-finance2';

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

export async function searchTicker(query: string): Promise<string[]> {
  const res = (await yf.search(query)) as unknown as { quotes?: Array<{ symbol?: string }> };
  return (res.quotes ?? [])
    .map((q) => q.symbol)
    .filter((s): s is string => Boolean(s));
}
