import { getUniverse } from '../universe';
import { getUniverseQuotes } from '../market-data';
import type { UniverseSlice } from '../schemas';

export async function fetchUniverse(): Promise<UniverseSlice> {
  const quotes = await getUniverseQuotes(getUniverse());
  return { quotes };
}
