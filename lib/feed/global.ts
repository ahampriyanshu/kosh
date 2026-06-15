import { getMarketQuote } from '../market-data';
import type { GlobalSlice } from '../schemas';

const GLOBAL_INDICES: Array<{ name: string; symbol: string }> = [
  { name: 'Dow Jones', symbol: '^DJI' },
  { name: 'NASDAQ', symbol: '^IXIC' },
  { name: 'S&P 500', symbol: '^GSPC' },
  { name: 'Nikkei 225', symbol: '^N225' },
  { name: 'Hang Seng', symbol: '^HSI' },
  { name: 'FTSE 100', symbol: '^FTSE' },
];
const COMMODITIES: Array<{ name: string; symbol: string }> = [
  { name: 'Gold', symbol: 'GC=F' },
  { name: 'Silver', symbol: 'SI=F' },
  { name: 'Crude Oil', symbol: 'CL=F' },
];

export async function fetchGlobal(): Promise<GlobalSlice> {
  const globalIndices: GlobalSlice['globalIndices'] = [];
  for (const idx of GLOBAL_INDICES) {
    try {
      const q = await getMarketQuote(idx.symbol);
      globalIndices.push({ name: idx.name, symbol: idx.symbol, ltp: q.ltp, changePct: q.changePct });
    } catch { /* omit */ }
  }
  const commodities: GlobalSlice['commodities'] = [];
  for (const c of COMMODITIES) {
    try {
      const q = await getMarketQuote(c.symbol);
      commodities.push({ name: c.name, value: q.ltp, changePct: q.changePct });
    } catch { /* omit */ }
  }
  const currencies: GlobalSlice['currencies'] = [];
  try {
    const q = await getMarketQuote('USDINR=X');
    currencies.push({ pair: 'USD/INR', value: q.ltp, changePct: q.changePct });
  } catch { /* omit */ }
  return { globalIndices, commodities, currencies };
}
