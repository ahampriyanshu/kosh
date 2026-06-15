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
  // IT
  { ticker: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT' },
  { ticker: 'WIPRO.NS', name: 'Wipro', sector: 'IT' },
  { ticker: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT' },
  { ticker: 'LTIM.NS', name: 'LTIMindtree', sector: 'IT' },
  // Financials
  { ticker: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Financials' },
  { ticker: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Financials' },
  { ticker: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Financials' },
  { ticker: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Financials' },
  { ticker: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Financials' },
  { ticker: 'SBILIFE.NS', name: 'SBI Life Insurance', sector: 'Financials' },
  { ticker: 'HDFCLIFE.NS', name: 'HDFC Life Insurance', sector: 'Financials' },
  // Pharma
  { ticker: 'DRREDDY.NS', name: "Dr. Reddy's Laboratories", sector: 'Pharma' },
  { ticker: 'DIVISLAB.NS', name: "Divi's Laboratories", sector: 'Pharma' },
  // Healthcare
  { ticker: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', sector: 'Healthcare' },
  // Auto
  { ticker: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { ticker: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', sector: 'Auto' },
  { ticker: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Auto' },
  { ticker: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Auto' },
  // Metal
  { ticker: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metal' },
  { ticker: 'COALINDIA.NS', name: 'Coal India', sector: 'Metal' },
  { ticker: 'VEDL.NS', name: 'Vedanta', sector: 'Metal' },
  // Power
  { ticker: 'POWERGRID.NS', name: 'Power Grid Corp', sector: 'Power' },
  { ticker: 'TATAPOWER.NS', name: 'Tata Power', sector: 'Power' },
  { ticker: 'JSWENERGY.NS', name: 'JSW Energy', sector: 'Power' },
  // Energy
  { ticker: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Energy' },
  { ticker: 'BPCL.NS', name: 'Bharat Petroleum', sector: 'Energy' },
  { ticker: 'IOC.NS', name: 'Indian Oil', sector: 'Energy' },
  { ticker: 'GAIL.NS', name: 'GAIL India', sector: 'Energy' },
  // Infrastructure
  { ticker: 'ADANIPORTS.NS', name: 'Adani Ports & SEZ', sector: 'Infrastructure' },
  // FMCG
  { ticker: 'NESTLEIND.NS', name: 'Nestle India', sector: 'FMCG' },
  { ticker: 'BRITANNIA.NS', name: 'Britannia Industries', sector: 'FMCG' },
  { ticker: 'TATACONSUM.NS', name: 'Tata Consumer Products', sector: 'FMCG' },
  { ticker: 'DABUR.NS', name: 'Dabur India', sector: 'FMCG' },
  // Consumer Durables
  { ticker: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer Durables' },
  { ticker: 'HAVELLS.NS', name: 'Havells India', sector: 'Consumer Durables' },
  // Cement
  { ticker: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement' },
  { ticker: 'GRASIM.NS', name: 'Grasim Industries', sector: 'Cement' },
  { ticker: 'SHREECEM.NS', name: 'Shree Cement', sector: 'Cement' },
  // Chemicals
  { ticker: 'PIDILITIND.NS', name: 'Pidilite Industries', sector: 'Chemicals' },
  { ticker: 'SRF.NS', name: 'SRF', sector: 'Chemicals' },
];
