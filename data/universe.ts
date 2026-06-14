import type { UniverseEntry } from '../lib/schemas';

// Seed subset of the Nifty 500 across sectors. Expanded to the full list in Phase 2.
export const universe: UniverseEntry[] = [
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
  { ticker: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
  { ticker: 'INFY.NS', name: 'Infosys', sector: 'IT' },
  { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Financials' },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Financials' },
  { ticker: 'SBIN.NS', name: 'State Bank of India', sector: 'Financials' },
  { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
  { ticker: 'ITC.NS', name: 'ITC', sector: 'FMCG' },
  { ticker: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
  { ticker: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure' },
  { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharma' },
  { ticker: 'CIPLA.NS', name: 'Cipla', sector: 'Pharma' },
  { ticker: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto' },
  { ticker: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Auto' },
  { ticker: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metal' },
  { ticker: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Metal' },
  { ticker: 'NTPC.NS', name: 'NTPC', sector: 'Power' },
  { ticker: 'ONGC.NS', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
  { ticker: 'DLF.NS', name: 'DLF', sector: 'Realty' },
  { ticker: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Consumer Durables' },
];
