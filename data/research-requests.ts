import type { ResearchRequest } from '../lib/schemas';

// Add tickers to research, then commit this file — the research workflow evaluates each.
// Idempotent: a ticker already researched today is skipped, so you can append freely.
export const researchRequests: ResearchRequest[] = [
  { ticker: 'TATAMOTORS.NS', note: 'fresh entry' },
];
