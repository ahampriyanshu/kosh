import { getMarketQuote } from '../market-data';
import type { IndicesSlice } from '../schemas';

const INDIAN_INDICES: Array<{ name: string; symbol: string }> = [
  { name: 'NIFTY 50', symbol: '^NSEI' },
  { name: 'SENSEX', symbol: '^BSESN' },
  { name: 'NIFTY BANK', symbol: '^NSEBANK' },
  { name: 'NIFTY IT', symbol: '^CNXIT' },
  { name: 'NIFTY PHARMA', symbol: '^CNXPHARMA' },
  { name: 'NIFTY AUTO', symbol: '^CNXAUTO' },
  { name: 'NIFTY FMCG', symbol: '^CNXFMCG' },
  { name: 'NIFTY METAL', symbol: '^CNXMETAL' },
  { name: 'NIFTY ENERGY', symbol: '^CNXENERGY' },
  { name: 'NIFTY REALTY', symbol: '^CNXREALTY' },
  { name: 'NIFTY FIN SERVICE', symbol: '^CNXFIN' },
];

export async function fetchIndices(): Promise<IndicesSlice> {
  const indianIndices: IndicesSlice['indianIndices'] = [];
  for (const idx of INDIAN_INDICES) {
    try {
      const q = await getMarketQuote(idx.symbol);
      indianIndices.push({ name: idx.name, symbol: idx.symbol, ltp: q.ltp, changePct: q.changePct });
    } catch {
      // omit on failure — consistency over availability
    }
  }
  let vix: IndicesSlice['vix'] = null;
  try {
    const q = await getMarketQuote('^INDIAVIX');
    vix = { value: q.ltp, changePct: q.changePct };
  } catch {
    vix = null;
  }
  return { indianIndices, vix };
}
