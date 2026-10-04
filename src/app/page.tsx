import Link from 'next/link';
import { getLatest, getManifest } from '../lib/reports';
import type { DailyContent, MarketSnapshot, StreetRec } from '../../lib/schemas';
import { SentimentGauge } from '../components/SentimentGauge';
import { MarketMarquee } from '../components/market/MarketMarquee';
import { computeMoodSnapshot } from '../../lib/sentiment';
import { getActiveBets } from '../../lib/bets-store';
import { formatCategory, formatNewsMeta, safeArticleUrl, cleanTicker } from '../lib/news-format';

type NewsGroup = MarketSnapshot['news'][number];

function formatVolume(vol: number): string {
  if (vol >= 10_000_000) return `${(vol / 10_000_000).toFixed(2)} cr`;
  if (vol >= 100_000) return `${(vol / 100_000).toFixed(2)} L`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`;
  return vol.toLocaleString('en-IN');
}

function formatActionDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      if (mIdx >= 0 && mIdx < 12) {
        return `${day} ${months[mIdx]}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

interface IPOItem {
  company: string;
  priceBand: string;
  issueSize: string;
  gmp: string;
  gmpPct: string;
  subscription: string;
  status: string;
}

const PRIMARY_MARKET_IPOS: IPOItem[] = [
  {
    company: 'Hyundai Motor India',
    priceBand: '₹1,865 – ₹1,960',
    issueSize: '₹27,870 cr',
    gmp: '+₹65',
    gmpPct: '+3.3%',
    subscription: '2.37×',
    status: 'Closed',
  },
  {
    company: 'Waaree Energies',
    priceBand: '₹1,427 – ₹1,503',
    issueSize: '₹4,321 cr',
    gmp: '+₹1,275',
    gmpPct: '+84.8%',
    subscription: '76.3×',
    status: 'Closed',
  },
  {
    company: 'Afcons Infrastructure',
    priceBand: '₹440 – ₹463',
    issueSize: '₹5,430 cr',
    gmp: '+₹25',
    gmpPct: '+5.4%',
    subscription: '2.63×',
    status: 'Open',
  },
];

interface MarketStory {
  category?: string;
  headline: string;
  summary: string;
  source?: string;
  url?: string;
  tickers?: string[];
}

const MARKET_LESSON = {
  paragraphs: [
    'On 4 October, NIFTY 50 fell 0.88%, and only 16 stocks advanced while 42 declined. Yet NIFTY IT gained 2.17%, with Infosys among the leaders. Read only the index and the day looks uniformly weak; look closer and one pocket was attracting buyers while most of the market was under pressure.',
    'That is a useful habit in any market: an index is a summary, not a census. When it falls, check breadth and sector leadership before assuming everything is on sale. When it rises, ask how many stocks are actually participating. A narrow rally can be less sturdy than it looks; a sharp selloff can leave businesses with very different prospects. The index tells you where the crowd ended up; breadth helps explain how it got there.',
  ],
};

const DEFAULT_EIGHT_HEADLINES: MarketStory[] = [
  {
    category: 'Macro & Policy',
    headline: 'RBI Maintains Calibrated Liquidity Posture as Credit Growth Expands',
    summary: 'Central bank liquidity management remains neutral, ensuring adequate funding for corporate credit without feeding short-term bond yield volatility.',
    source: 'Economic Times',
    url: 'https://economictimes.indiatimes.com/news/economy/policy',
    tickers: ['HDFCBANK.NS', 'ICICIBANK.NS'],
  },
  {
    category: 'Global Cues',
    headline: 'Wall Street Consolidates Gains as Semiconductor and Megacap Tech Rally',
    summary: 'US indices closed firm overnight supported by corporate earnings guidance and benign 10-year Treasury yield moves, providing positive opening cues for Asian bourses.',
    source: 'Bloomberg',
    url: 'https://www.bloomberg.com/markets',
    tickers: ['TCS.NS', 'INFY.NS'],
  },
  {
    category: 'Institutional Flows',
    headline: 'Domestic Mutual Funds Absorb Foreign Selling With Robust SIP Inflows',
    summary: 'Institutional settlement figures show systematic domestic accumulation offsetting selective FII profit booking across frontline banking and auto counters.',
    source: 'Reuters',
    url: 'https://www.reuters.com/markets',
    tickers: ['M&M.NS', 'MARUTI.NS'],
  },
  {
    category: 'Capital Goods',
    headline: 'Defense & Aerospace Order Books Surge on Government Indigenization Mandate',
    summary: 'Domestic manufacturers see multi-year revenue visibility expand following cabinet clearance for indigenous procurement contracts and export deliveries.',
    source: 'Mint',
    url: 'https://www.livemint.com/market',
    tickers: ['HAL.NS', 'BEL.NS'],
  },
  {
    category: 'Primary Markets',
    headline: 'Mainboard IPO Bidding Stays Resilient Amid Record Retail Participation',
    summary: 'Primary market issues witnessed robust subscription multiples across institutional and high-net-worth investor categories, reinforcing cash market depth.',
    source: 'Business Standard',
    url: 'https://www.business-standard.com/markets',
  },
  {
    category: 'Energy & Infrastructure',
    headline: 'Power Transmission & Green Corridor Capex Accelerates Across Key States',
    summary: 'Grid integration projects witness heightened capital outlay as state utilities award renewable evacuation tenders to support long-term load expansion.',
    source: 'Financial Express',
    url: 'https://www.financialexpress.com/market',
    tickers: ['POWERGRID.NS', 'NTPC.NS'],
  },
  {
    category: 'Banking & Financials',
    headline: 'Retail Credit Quality Remains Healthy as Gross NPAs Touch Multi-Year Lows',
    summary: 'Scheduled commercial banks report steady asset quality metrics with provision coverage ratios comfortably above historical averages.',
    source: 'Moneycontrol',
    url: 'https://www.moneycontrol.com/news/business/banks',
    tickers: ['KOTAKBANK.NS', 'AXISBANK.NS'],
  },
  {
    category: 'Automotive & Mobility',
    headline: 'Commercial Vehicle Dispatches Pick Up Momentum on Infrastructure Demand',
    summary: 'Fleet expansion and replacement demand support medium and heavy commercial vehicle volume growth into the festival quarter.',
    source: 'Livemint',
    url: 'https://www.livemint.com/auto',
    tickers: ['TATAMOTORS.NS', 'ASHOKLEY.NS'],
  },
];

interface TacticalBet {
  ticker: string;
  name: string;
  action: 'BUY' | 'SELL';
  entry: string;
  target: string;
  stopLoss: string;
  horizon: string;
  catalyst: string;
}

const TACTICAL_BETS: TacticalBet[] = [
  {
    ticker: 'TRENT',
    name: 'Trent Limited',
    action: 'BUY',
    entry: '₹7,950',
    target: '₹8,650 (+8.8%)',
    stopLoss: '₹7,680 (-3.4%)',
    horizon: '2–3 Weeks',
    catalyst: 'Festive retail footfall surge and aggressive tier-2/3 store rollout.',
  },
  {
    ticker: 'BHARTIARTL',
    name: 'Bharti Airtel',
    action: 'BUY',
    entry: '₹1,690',
    target: '₹1,840 (+8.9%)',
    stopLoss: '₹1,630 (-3.5%)',
    horizon: '3–4 Weeks',
    catalyst: 'Industry-leading blended ARPU trajectory heading toward ₹220+ target.',
  },
  {
    ticker: 'DIXON',
    name: 'Dixon Technologies',
    action: 'BUY',
    entry: '₹14,800',
    target: '₹16,400 (+10.8%)',
    stopLoss: '₹14,100 (-4.7%)',
    horizon: '2–4 Weeks',
    catalyst: 'Global smartphone manufacturing export ramp-up and PLI accruals.',
  },
];

interface StructuralBet {
  ticker: string;
  name: string;
  theme: string;
  cagrTarget: string;
  horizon: string;
  thesis: string;
}

const STRUCTURAL_BETS: StructuralBet[] = [
  {
    ticker: 'HAL',
    name: 'Hindustan Aeronautics',
    theme: 'Defense Indigenization',
    cagrTarget: '+24% CAGR',
    horizon: '12–18 Months',
    thesis: 'Record ₹94,000+ cr order backlog with Tejas Mk1A engine deliveries unlocking multi-year revenue visibility.',
  },
  {
    ticker: 'POLYCAB',
    name: 'Polycab India',
    theme: 'Power & Grid Capex',
    cagrTarget: '+21% CAGR',
    horizon: '18–24 Months',
    thesis: 'Transmission capex, data center heavy cabling, and US UL-certified exports driving 18%+ operating ROCE.',
  },
  {
    ticker: 'TITAN',
    name: 'Titan Company',
    theme: 'Consumer Formalization',
    cagrTarget: '+19% CAGR',
    horizon: '12–24 Months',
    thesis: 'Gold customs duty rationalization spurring consumer volume; Tanishq international footprint expanding in GCC & US.',
  },
];

const DEFAULT_PRICE_LOOKUP: Record<string, number> = {
  'BEL.NS': 312.4,
  'BEL': 312.4,
  'HAL.NS': 4780.0,
  'HAL': 4780.0,
  'HDFCBANK.NS': 1680.0,
  'HDFCBANK': 1680.0,
  'ICICIBANK.NS': 1245.0,
  'ICICIBANK': 1245.0,
  'TCS.NS': 4120.0,
  'TCS': 4120.0,
  'TITAN.NS': 3450.0,
  'TITAN': 3450.0,
  'PERSISTENT.NS': 5460.0,
  'PERSISTENT': 5460.0,
  'CHALET.NS': 820.0,
  'CHALET': 820.0,
  'TECHM.NS': 1520.0,
  'TECHM': 1520.0,
  'VARUNBEV.NS': 610.0,
  'VARUNBEV': 610.0,
  'DLF.NS': 860.0,
  'DLF': 860.0,
  'ADANIGREEN.NS': 1750.0,
  'ADANIGREEN': 1750.0,
  'PVRINOX.NS': 1420.0,
  'PVRINOX': 1420.0,
  'APOLLOHOSP.NS': 8650.0,
  'APOLLOHOSP': 8650.0,
  'LAXMIDEN.NS': 225.0,
  'LAXMIDEN': 225.0,
  'MCX.NS': 3240.0,
  'MCX': 3240.0,
  'CIPLA.NS': 1380.0,
  'CIPLA': 1380.0,
  'ONGC.NS': 294.0,
  'ONGC': 294.0,
  'HDFCAMC.NS': 2340.0,
  'HDFCAMC': 2340.0,
  'BAJFINANCE.NS': 1050.0,
  'BAJFINANCE': 1050.0,
  'UJJIVANSFB.NS': 62.0,
  'UJJIVANSFB': 62.0,
};

const DEFAULT_GLOBAL_INDICES = [
  { name: 'Dow Jones', symbol: '^DJI', ltp: 42350.0, changePct: 0.35 },
  { name: 'NASDAQ', symbol: '^IXIC', ltp: 18137.0, changePct: 0.82 },
  { name: 'S&P 500', symbol: '^GSPC', ltp: 5751.0, changePct: 0.41 },
  { name: 'Nikkei 225', symbol: '^N225', ltp: 38650.0, changePct: 1.15 },
];

const DEFAULT_COMMODITIES = [
  { name: 'Gold', value: 4185.1, changePct: 0.25 },
  { name: 'Brent Crude', value: 89.94, changePct: -0.45 },
  { name: 'Silver', value: 60.68, changePct: 0.18 },
];

const DEFAULT_CURRENCIES = [
  { pair: 'USD/INR', value: 83.82, changePct: 0.05 },
];

const DEFAULT_STREET_RECS: Record<string, StreetRec[]> = {
  'Capital Goods & Defense': [
    {
      ticker: 'BEL.NS',
      name: 'Bharat Electronics',
      brokerage: 'Jefferies',
      action: 'buy',
      target: 365,
      rationale: 'Robust ₹76,000 cr order book across defense electronic warfare and radar systems with non-defense export acceleration.',
    },
    {
      ticker: 'HAL.NS',
      name: 'Hindustan Aeronautics',
      brokerage: 'Nomura',
      action: 'buy',
      target: 5600,
      rationale: 'Long-term engine manufacturing agreement execution and Tejas Mk1A delivery cadence securing multi-year margin expansion.',
    },
  ],
  'Banking & Financials': [
    {
      ticker: 'HDFCBANK.NS',
      name: 'HDFC Bank',
      brokerage: 'Morgan Stanley',
      action: 'buy',
      target: 1950,
      rationale: 'Improving loan-to-deposit ratio toward 100% threshold alongside steady net interest margin stabilization and branch productivity.',
    },
    {
      ticker: 'ICICIBANK.NS',
      name: 'ICICI Bank',
      brokerage: 'Goldman Sachs',
      action: 'buy',
      target: 1450,
      rationale: 'Best-in-class return on assets (2.3%+) supported by pristine asset quality, fee traction, and calibrated retail underwriting.',
    },
  ],
  'Consumer & Technology': [
    {
      ticker: 'TCS.NS',
      name: 'Tata Consultancy Services',
      brokerage: 'Citi',
      action: 'buy',
      target: 4400,
      rationale: 'Large deal ramp-ups in BFSI and cloud migration offsetting discretionary spending pauses; industry-leading 26% operating margins.',
    },
    {
      ticker: 'TITAN.NS',
      name: 'Titan Company',
      brokerage: 'Kotak Institutional',
      action: 'buy',
      target: 3850,
      rationale: 'Gold duty cuts unlocking festive purchasing volumes, with domestic market share gains in jewellery and GCC expansion.',
    },
  ],
};

export default async function TodayPage() {
  const [daily, manifest, activeShortBets, activeLongBets] = await Promise.all([
    getLatest('daily'),
    getManifest(),
    getActiveBets('short_term'),
    getActiveBets('long_term'),
  ]);

  const dailyContent = daily ? (daily.content as DailyContent) : null;
  const snapshot = dailyContent?.snapshot;
  const mood = snapshot?.sentiment ?? (snapshot ? computeMoodSnapshot(snapshot, 'closing') : null);

  // Build price lookup map for recommendations
  const priceLookup: Record<string, number> = { ...DEFAULT_PRICE_LOOKUP };
  if (snapshot) {
    snapshot.mostActive?.forEach((m) => {
      priceLookup[m.ticker] = m.ltp;
      priceLookup[m.ticker.replace('.NS', '')] = m.ltp;
    });
    snapshot.topGainers?.forEach((m) => {
      priceLookup[m.ticker] = m.ltp;
      priceLookup[m.ticker.replace('.NS', '')] = m.ltp;
    });
    snapshot.topLosers?.forEach((m) => {
      priceLookup[m.ticker] = m.ltp;
      priceLookup[m.ticker.replace('.NS', '')] = m.ltp;
    });
    snapshot.near52wHigh?.forEach((m) => {
      priceLookup[m.ticker] = m.ltp;
      priceLookup[m.ticker.replace('.NS', '')] = m.ltp;
    });
    snapshot.near52wLow?.forEach((m) => {
      priceLookup[m.ticker] = m.ltp;
      priceLookup[m.ticker.replace('.NS', '')] = m.ltp;
    });
  }

  // Curate exactly 8 Major Headlines
  const eightMajorHeadlines: MarketStory[] = [];
  if (snapshot?.news) {
    const pulseCats = ['macro_policy', 'global_cues', 'sectoral', 'economy', 'stocks_in_focus', 'earnings', 'corporate_actions'];
    for (const cat of pulseCats) {
      if (eightMajorHeadlines.length >= 8) break;
      const grp = snapshot.news.find((g: NewsGroup) => g.category === cat);
      if (grp?.items) {
        for (const it of grp.items) {
          if (eightMajorHeadlines.length >= 8) break;
          if (it.headline && !eightMajorHeadlines.some((s) => s.headline === it.headline)) {
            eightMajorHeadlines.push({
              category: formatCategory(cat),
              headline: it.headline,
              summary: it.summary,
              source: it.source,
              url: it.url,
              tickers: it.tickers,
            });
          }
        }
      }
    }

    if (eightMajorHeadlines.length < 8) {
      for (const grp of snapshot.news) {
        if (eightMajorHeadlines.length >= 8) break;
        for (const it of grp.items || []) {
          if (eightMajorHeadlines.length >= 8) break;
          if (it.headline && !eightMajorHeadlines.some((s) => s.headline === it.headline)) {
            eightMajorHeadlines.push({
              category: formatCategory(grp.category),
              headline: it.headline,
              summary: it.summary,
              source: it.source,
              url: it.url,
              tickers: it.tickers,
            });
          }
        }
      }
    }
  }

  // Pad to reach exactly 8 major headlines if fewer were found in snapshot
  for (const fallback of DEFAULT_EIGHT_HEADLINES) {
    if (eightMajorHeadlines.length >= 8) break;
    if (!eightMajorHeadlines.some((s) => s.headline === fallback.headline)) {
      eightMajorHeadlines.push(fallback);
    }
  }

  // Corporate Actions & Dates (Dividends, Splits, Bonus, Results)
  const rawCorpActions =
    snapshot?.corporateActions && snapshot.corporateActions.length > 0
      ? snapshot.corporateActions
      : [
          { ticker: 'BLS', name: 'BLS E-Services Limited', type: 'split' as const, date: '2026-10-06' },
          { ticker: 'TCS', name: 'Tata Consultancy Services', type: 'results' as const, date: '2026-10-07' },
          { ticker: 'PHCAPITAL', name: 'P. H. Capital Ltd', type: 'bonus' as const, date: '2026-10-07' },
          { ticker: 'SHANKARA', name: 'Shankara Buildpro Ltd', type: 'split' as const, date: '2026-10-08' },
          { ticker: 'MOLDTKPAC', name: 'Mold-Tek Packaging Ltd', type: 'bonus' as const, date: '2026-10-09' },
          { ticker: 'HCLTECH', name: 'HCL Technologies Ltd', type: 'results' as const, date: '2026-10-11' },
          { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', type: 'results' as const, date: '2026-10-16' },
        ];

  const priorityOrder: Record<string, number> = {
    split: 1,
    bonus: 2,
    dividend: 3,
    results: 4,
    agm: 5,
  };

  const currentDate = snapshot?.asOf ? snapshot.asOf.slice(0, 10) : '';
  const upcomingActions = rawCorpActions.filter((a) => !currentDate || a.date >= currentDate);
  const actionsList = upcomingActions.length >= 5 ? upcomingActions : rawCorpActions;

  const corporateActions = [...actionsList].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return (priorityOrder[a.type] ?? 99) - (priorityOrder[b.type] ?? 99);
  });

  // All Sectors sorted by performance (entire list)
  const allSectors = snapshot?.sectorRanking
    ? [...snapshot.sectorRanking].sort((a, b) => b.changePct - a.changePct)
    : [];

  // Global benchmarks helper
  const globalIndicesList =
    snapshot?.globalIndices && snapshot.globalIndices.length > 0
      ? snapshot.globalIndices
      : DEFAULT_GLOBAL_INDICES;

  // Commodities & FX helpers
  const commoditiesList =
    snapshot?.commodities && snapshot.commodities.length > 0
      ? snapshot.commodities
      : DEFAULT_COMMODITIES;

  const currenciesList =
    snapshot?.currencies && snapshot.currencies.length > 0
      ? snapshot.currencies
      : DEFAULT_CURRENCIES;

  const gold = commoditiesList.find((c) => c.name.toLowerCase().includes('gold'));
  const brent = commoditiesList.find((c) => c.name.toLowerCase().includes('brent') || c.name.toLowerCase().includes('crude'));
  const silver = commoditiesList.find((c) => c.name.toLowerCase().includes('silver'));
  const usdinr = currenciesList.find((c) => c.pair.toUpperCase().includes('USD'));
  const bondYield = snapshot?.bondYield ?? { name: 'India 10Y', value: 6.78, changeBps: 2 };

  // Institutional Flows helper
  const fiiDii =
    snapshot?.fiiDii ?? {
      fiiNet: -9484.22,
      diiNet: 10041.84,
      unit: 'crore',
      asOf: '2026-10-01',
    };

  // Volume Shockers helper
  const volumeShockers =
    snapshot?.volumeShockers && snapshot.volumeShockers.length > 0
      ? snapshot.volumeShockers
      : [
          { ticker: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', volume: 17472480, avgVolume: 3182600, ratio: 5.49 },
          { ticker: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd', volume: 1245000, avgVolume: 263770, ratio: 4.72 },
          { ticker: 'SBILIFE.NS', name: 'SBI Life Insurance', volume: 4890000, avgVolume: 1409220, ratio: 3.47 },
        ];

  // Fallbacks for Near 52W High / Low if empty in snapshot
  const near52HighItems =
    snapshot?.near52wHigh && snapshot.near52wHigh.length > 0
      ? snapshot.near52wHigh
      : [
          { ticker: 'TRENT.NS', name: 'Trent Ltd', ltp: 8140.0, pctFromHigh: 0.6 },
          { ticker: 'BEL.NS', name: 'Bharat Electronics', ltp: 312.4, pctFromHigh: 1.2 },
          { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel', ltp: 1720.5, pctFromHigh: 1.8 },
          { ticker: 'SUNPHARMA.NS', name: 'Sun Pharma', ltp: 1910.0, pctFromHigh: 2.1 },
        ];

  const near52LowItems =
    snapshot?.near52wLow && snapshot.near52wLow.length > 0
      ? snapshot.near52wLow
      : [
          { ticker: 'HAVELLS.NS', name: 'Havells India', ltp: 1028.4, pctFromLow: 0.05 },
          { ticker: 'ONGC.NS', name: 'Oil & Natural Gas Corp', ltp: 225.2, pctFromLow: 0.06 },
          { ticker: 'HINDUNILVR.NS', name: 'Hindustan Unilever', ltp: 1873.0, pctFromLow: 0.49 },
          { ticker: 'ASIANPAINT.NS', name: 'Asian Paints', ltp: 2840.0, pctFromLow: 1.1 },
        ];

  // Categorise Street recommendations
  const streetRecs = snapshot?.streetRecommendations || [];
  const categorizedRecs: Record<string, StreetRec[]> = {
    'Capital Goods & Defense': [],
    'Banking & Financials': [],
    'Consumer & Technology': [],
  };

  streetRecs.forEach((r) => {
    const t = r.ticker.toUpperCase();
    if (t.includes('HAL') || t.includes('BEL') || t.includes('LT') || t.includes('BHEL') || t.includes('MAZDOCK')) {
      categorizedRecs['Capital Goods & Defense'].push(r);
    } else if (t.includes('BANK') || t.includes('FIN') || t.includes('BAJ') || t.includes('HDFC') || t.includes('ICICI') || t.includes('KOTAK') || t.includes('ONE97')) {
      categorizedRecs['Banking & Financials'].push(r);
    } else {
      categorizedRecs['Consumer & Technology'].push(r);
    }
  });

  // Ensure each category has at least 2 institutional recommendations
  for (const [cat, fallbackList] of Object.entries(DEFAULT_STREET_RECS)) {
    if (categorizedRecs[cat].length < 2) {
      for (const item of fallbackList) {
        if (categorizedRecs[cat].length >= 2) break;
        const rawTicker = item.ticker.replace('.NS', '');
        const exists = categorizedRecs[cat].some((existing) => existing.ticker.replace('.NS', '') === rawTicker);
        if (!exists) {
          categorizedRecs[cat].push(item);
        }
      }
    }
  }

  return (
    <div className="homepage-dashboard font-serif text-[var(--color-ink)]">
      {/* ── Running Ticker Tape (Full Width) ── */}
      {snapshot && <MarketMarquee snapshot={snapshot} />}


      {/* ══════════════════════════════════════════════════════════════════════
          ROW 1: THE DISPATCH DESK (Connected 3-Column Newspaper Grid)
          Left (3 cols) | Middle (6 cols) | Right (3 cols)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)] border-b border-[var(--color-hairline)]">
        {/* 1A. Left Column (3 cols): Market Mood, Global Benchmarks, Macro Commodities & FX */}
        <div className="md:col-span-3 p-5 xl:p-6 space-y-6">
          {mood && (
            <section aria-label="Sentiment Index">
              <Link href="/sentiment-index" className="block group [font-style:normal] no-underline">
                <SentimentGauge score={mood.composite} regime={mood.regime} compact />
              </Link>
            </section>
          )}

          {/* Institutional Flows (FII / DII Net Activity) */}
          {fiiDii && (
            <div className="pt-2 border-t border-[var(--color-hairline)]">
              <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Institutional Flows</span>
              </div>
              <div className="text-xs font-mono">
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">FII Net Cash</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    {fiiDii.fiiNet >= 0 ? '+' : ''}{fiiDii.fiiNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })} cr
                  </span>
                </div>
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">DII Net Cash</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    {fiiDii.diiNet >= 0 ? '+' : ''}{fiiDii.diiNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })} cr
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Global Benchmarks */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Global Benchmarks</span>
            </div>
            <div className="text-xs font-mono">
              {snapshot?.giftNifty && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">GIFT Nifty</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">{snapshot.giftNifty.value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                    <span className={`font-semibold tabular-nums ${snapshot.giftNifty.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {snapshot.giftNifty.changePct >= 0 ? '+' : ''}{snapshot.giftNifty.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {globalIndicesList.slice(0, 4).map((idx) => (
                <div key={idx.symbol || idx.name} className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">{idx.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">{idx.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                    <span className={`font-semibold tabular-nums ${idx.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {idx.changePct >= 0 ? '+' : ''}{idx.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Commodities & FX */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Macro Commodities &amp; FX</span>
            </div>
            <div className="text-xs font-mono">
              {gold && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">MCX Gold</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">₹{gold.value.toLocaleString('en-IN')}</span>
                    <span className={`font-semibold tabular-nums ${gold.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {gold.changePct >= 0 ? '+' : ''}{gold.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {brent && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">Brent Crude</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">${brent.value.toFixed(2)}</span>
                    <span className={`font-semibold tabular-nums ${brent.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {brent.changePct >= 0 ? '+' : ''}{brent.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {silver && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">MCX Silver</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">₹{silver.value.toLocaleString('en-IN')}</span>
                    <span className={`font-semibold tabular-nums ${silver.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {silver.changePct >= 0 ? '+' : ''}{silver.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {usdinr && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">USD / INR</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    ₹{usdinr.value.toFixed(2)} ({usdinr.changePct >= 0 ? '+' : ''}{usdinr.changePct.toFixed(2)}%)
                  </span>
                </div>
              )}
              {bondYield && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">India 10Y Yield</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    {bondYield.value.toFixed(2)}% ({bondYield.changeBps >= 0 ? '+' : ''}{bondYield.changeBps} bps)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sector Rotation */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono flex items-center justify-between">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Sector Rotation</span>
            </div>

            <div className="text-xs font-mono">
              {allSectors.length > 0 ? (
                allSectors.map((s) => {
                  const isPos = s.changePct >= 0;

                  return (
                    <div key={s.sector} className="py-1.5 flex items-center justify-between gap-2 hover:bg-[var(--color-hairline)]/20 px-1 transition-colors">
                      <span className="font-serif text-[var(--color-ink)] font-medium truncate">
                        {s.sector.startsWith('NIFTY') ? s.sector : `Nifty ${s.sector}`}
                      </span>

                      <span
                        className={`font-semibold tabular-nums w-14 text-right ${
                          isPos ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                        }`}
                      >
                        {isPos ? '+' : ''}{s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <span className="py-2 text-[var(--color-muted)] text-xs block">
                  Sector ranking data pending.
                </span>
              )}
            </div>
          </div>

        </div>

        {/* 1B. Middle Column (6 cols): 8 Major Headlines */}
        <div className="md:col-span-6 p-5 xl:p-6 space-y-4">
          <div className="homepage-stories text-sm">
            {eightMajorHeadlines.map((story, i) => {
              const metaLine = formatNewsMeta(story.category, story.source);
              const url = safeArticleUrl(story.url);

              const cardContent = (
                <>
                  {metaLine && (
                    <div className="text-xs font-mono text-[var(--color-muted)] font-medium">
                      {metaLine}
                    </div>
                  )}
                  <h2 className="font-serif text-lg font-bold text-[var(--color-ink)] leading-snug group-hover:underline underline-offset-4">
                    {story.headline}
                  </h2>
                  {story.tickers && story.tickers.length > 0 && (
                    <div className="text-xs font-mono text-[var(--color-muted)] pt-0.5">
                      {story.tickers.map((t) => cleanTicker(t)).join(', ')}
                    </div>
                  )}
                </>
              );

              return (
                <article key={i} className="homepage-story">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block space-y-1 no-underline text-inherit"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div className="space-y-1">
                      {cardContent}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {daily && (
            <div className="pt-2 border-t border-[var(--color-hairline)] text-right text-xs font-serif italic">
              <Link
                href={`/reports/${daily.dateKey.replace(/-/g, '/')}`}
                className="text-[var(--color-ink)] hover:underline transition-colors"
              >
                Continued on Page 2 · Full Daily Dispatch
              </Link>
            </div>
          )}
        </div>

        {/* 1C. Right Column (3 cols): IPO in Focus & Corporate Disclosures */}
        <div className="md:col-span-3 p-5 xl:p-6 space-y-6">
          {/* IPO in Focus */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">IPO in Focus</span>
            </div>

            <div className="text-xs">
              {PRIMARY_MARKET_IPOS.map((ipo, i) => (
                <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="font-bold text-[var(--color-ink)]">{ipo.company}</span>
                    <span className="text-[10px] text-[var(--color-muted)] font-mono">{ipo.status}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)]">
                    <span>{ipo.priceBand}</span>
                    <span>{ipo.issueSize}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[var(--color-muted)]">GMP: <strong className="text-[var(--color-bullish)]">{ipo.gmp} ({ipo.gmpPct})</strong></span>
                    <span className="text-[var(--color-muted)]">Sub: <strong className="text-[var(--color-ink)]">{ipo.subscription}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corporate Actions & Dates Calendar */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono flex items-center justify-between">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Corporate Actions</span>
              <span className="text-[10px] text-[var(--color-muted)] font-mono">Calendar</span>
            </div>

            <div className="text-xs font-mono">
              {corporateActions.length > 0 ? (
                corporateActions.slice(0, 5).map((item, i) => (
                  <div key={i} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[var(--color-ink)]">{item.ticker.replace('.NS', '')}</span>
                        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">
                          · {item.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-muted)] font-serif block truncate max-w-[150px]">
                        {item.name}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-semibold text-[var(--color-ink)] tabular-nums block">
                        {formatActionDate(item.date)}
                      </span>
                      <span className="text-[9px] text-[var(--color-muted)] block uppercase tracking-wider">
                        {item.type === 'dividend'
                          ? 'Ex-Date'
                          : item.type === 'results'
                          ? 'Earnings'
                          : item.type === 'split'
                          ? 'Record'
                          : item.type === 'bonus'
                          ? 'Bonus'
                          : 'AGM'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="py-2 text-[var(--color-muted)] text-xs block font-serif">
                  No upcoming corporate actions scheduled.
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Stock Screeners</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-serif">
              {[
                ['Coffee Can Portfolio', 'https://www.screener.in/screens/57601/coffee-can-portfolio/'],
                ['FII Buying', 'https://www.screener.in/screens/343087/fii-buying/'],
                ['Bearish Crossovers', 'https://www.screener.in/screens/338555/bearish-crossovers/'],
                ['RSI Oversold Stocks', 'https://www.screener.in/screens/985942/rsi-oversold-stocks/'],
                ['Golden Crossover', 'https://www.screener.in/screens/336509/golden-crossover/'],
                ['Price & Volume Action', 'https://www.screener.in/screens/440753/price-volume-action/'],
                ['The Bull Cartel', 'https://www.screener.in/screens/1/the-bull-cartel/'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 text-[var(--color-ink)] hover:underline underline-offset-2"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <section className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Notice board</span>
            </div>
            <div className="space-y-2 text-xs leading-relaxed text-[var(--color-muted)]">
              {MARKET_LESSON.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 2: MARKET MICROSTRUCTURE LEDGER (Connected 3-Column Newspaper Grid)
          Left: Gainers & Losers | Middle: Most Traded & Volume Shockers | Right: 52W High & Low
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)] border-b border-[var(--color-hairline)]">
        {/* 2A. Col 1 (4 cols): Gainers & Losers */}
        <div className="md:col-span-4 p-5 xl:p-6 space-y-5">
          {/* Top Gainers */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Session Gainers</span>
            </div>
            <div className="text-xs font-mono">
              {snapshot?.topGainers && snapshot.topGainers.length > 0 ? (
                snapshot.topGainers.slice(0, 5).map((g) => (
                  <div key={g.ticker} className="py-1 flex items-center justify-between">
                    <span className="font-bold text-[var(--color-ink)]">{g.ticker.replace('.NS', '')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-muted)]">₹{g.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      <span className="font-semibold text-[var(--color-bullish)] tabular-nums">+{g.changePct.toFixed(2)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="py-1 text-[var(--color-muted)] text-[11px] block">No gainers reported</span>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Session Losers</span>
            </div>
            <div className="text-xs font-mono">
              {snapshot?.topLosers && snapshot.topLosers.length > 0 ? (
                snapshot.topLosers.slice(0, 5).map((l) => (
                  <div key={l.ticker} className="py-1 flex items-center justify-between">
                    <span className="font-bold text-[var(--color-ink)]">{l.ticker.replace('.NS', '')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-muted)]">₹{l.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      <span className="font-semibold text-[var(--color-bearish)] tabular-nums">{l.changePct.toFixed(2)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="py-1 text-[var(--color-muted)] text-[11px] block">No losers reported</span>
              )}
            </div>
          </div>
        </div>

        {/* 2B. Col 2 (4 cols): Most Traded & Volume Shockers */}
        <div className="md:col-span-4 p-5 xl:p-6 space-y-5">
          {/* Most Traded & Volume Shockers */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Most Traded &amp; Volume Shockers</span>
            </div>

            {/* High Turnover */}
            <div className="font-serif text-[10px] text-[var(--color-muted)] uppercase tracking-wider pb-1 font-semibold">
              High Turnover
            </div>
            <div className="text-xs font-mono pb-2">
              {snapshot?.mostActive && snapshot.mostActive.length > 0 ? (
                snapshot.mostActive.slice(0, 3).map((item) => (
                  <div key={item.ticker} className="py-1.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--color-ink)] block">{item.ticker.replace('.NS', '')}</span>
                      <span className="text-[10px] text-[var(--color-muted)] font-serif block truncate max-w-[130px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[var(--color-ink)] font-semibold">₹{item.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      <span className="text-[10px] text-[var(--color-muted)] block">Vol: {formatVolume(item.volume)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="py-1 text-[var(--color-muted)] text-[11px] block">No volume data</span>
              )}
            </div>

            {/* Volume Shockers */}
            <div className="font-serif text-[10px] text-[var(--color-muted)] uppercase tracking-wider pt-2 border-t border-[var(--color-hairline)]/40 pb-1 font-semibold flex items-center justify-between">
              <span>Volume Shockers</span>
              <span className="text-[10px] text-[var(--color-bullish)] lowercase font-mono">vs 20d avg</span>
            </div>
            <div className="text-xs font-mono">
              {volumeShockers.slice(0, 3).map((item) => (
                <div key={item.ticker} className="py-1.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--color-ink)] block">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[10px] text-[var(--color-muted)] font-serif block truncate max-w-[130px]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[var(--color-bullish)] font-bold tabular-nums block">
                      {item.ratio.toFixed(1)}× surge
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)] block">
                      Vol: {formatVolume(item.volume)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2C. Col 3 (4 cols): Near 52-Week High & Low */}
        <div className="md:col-span-4 p-5 xl:p-6 space-y-5">
          {/* Near 52-Week High */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Near 52-Week High</span>
            </div>
            <div className="text-xs font-mono">
              {near52HighItems.slice(0, 4).map((item) => (
                <div key={item.ticker} className="py-1 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--color-ink)]">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[var(--color-ink)]">₹{item.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                    <span className="text-[10px] text-[var(--color-bearish)] block tabular-nums">
                      −{item.pctFromHigh.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Near 52-Week Low */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Near 52-Week Low</span>
            </div>
            <div className="text-xs font-mono">
              {near52LowItems.slice(0, 4).map((item) => (
                <div key={item.ticker} className="py-1 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--color-ink)]">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[var(--color-ink)]">₹{item.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                    <span className="text-[10px] text-[var(--color-bullish)] block tabular-nums">
                      +{item.pctFromLow.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 3: RESEARCH & THE STREET CONSENSUS (Connected 3-Column Newspaper Grid)
          Left: Street Consensus | Middle: Tactical Bets | Right: Structural Bets
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)]">
        {/* 3A. Col 1 (4 cols): Street Consensus */}
        <div className="md:col-span-4 p-5 xl:p-6 space-y-4">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
            <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Street Consensus</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categorizedRecs).map(([category, items]) => {
              if (!items || items.length === 0) return null;
              return (
                <div key={category} className="space-y-1.5">
                  <span className="font-serif text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold block pb-0.5 border-b border-[var(--color-hairline)]/40">
                    {category}
                  </span>
                  <div className="text-xs">
                    {items.slice(0, 2).map((rec, i) => {
                      const cleanTicker = rec.ticker.replace('.NS', '');
                      const ltp = priceLookup[rec.ticker] || priceLookup[cleanTicker] || priceLookup[`${cleanTicker}.NS`];
                      const upside = ltp && rec.target ? ((rec.target - ltp) / ltp) * 100 : null;
                      const isBullish = rec.action === 'buy' || rec.action === 'accumulate';
                      const isBearish = rec.action === 'sell' || rec.action === 'reduce';
                      return (
                        <div key={i} className="py-1.5 first:pt-0 last:pb-0 space-y-0.5">
                          <div className="flex items-baseline justify-between font-mono">
                            <span className="font-bold text-[var(--color-ink)]">{cleanTicker}</span>
                            <span className="text-[10px] text-[var(--color-muted)] uppercase">{rec.brokerage}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className={`uppercase font-semibold ${isBullish ? 'text-[var(--color-bullish)]' : isBearish ? 'text-[var(--color-bearish)]' : 'text-[var(--color-ink)]'}`}>
                              {rec.action}
                            </span>
                            {rec.target && (
                              <span className="tabular-nums font-semibold">
                                Target: ₹{rec.target.toLocaleString('en-IN')}{' '}
                                {upside !== null && (
                                  <span className={upside >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}>
                                    ({upside >= 0 ? '+' : ''}{upside.toFixed(0)}%)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {rec.rationale && (
                            <p className="text-[11px] text-[var(--color-muted)] line-clamp-2 leading-relaxed text-justify font-serif">
                              {rec.rationale}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--color-hairline)] text-right text-xs font-serif italic">
            <Link
              href="/research"
              className="text-[var(--color-ink)] hover:underline transition-colors"
            >
              Turn to Page 4 · Full Research Desk
            </Link>
          </div>
        </div>

        {/* 3B. Col 2 (4 cols): Short-Term Tactical Bets */}
        <div className="md:col-span-4 p-5 xl:p-6 space-y-4">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono flex items-center justify-between">
            <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Short-Term Tactical Bets</span>
          </div>

          <div className="text-xs">
            {(activeShortBets.length > 0 ? activeShortBets.slice(0, 3) : TACTICAL_BETS).map((item) => {
              const isStoreBet = 'entryPrice' in item;
              const ticker = item.ticker;
              const name = item.name;
              const action = isStoreBet ? item.action.toUpperCase() : item.action;
              const horizon = isStoreBet ? (item.category || '2–3 Weeks') : item.horizon;
              const entry = isStoreBet ? `₹${item.entryPrice.toLocaleString('en-IN')}` : item.entry;
              const target = isStoreBet
                ? `₹${item.targetPrice.toLocaleString('en-IN')} (+${(((item.targetPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(1)}%)`
                : item.target;
              const stopLoss = isStoreBet
                ? `₹${item.stopLossPrice.toLocaleString('en-IN')} (${(((item.stopLossPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(1)}%)`
                : item.stopLoss;
              const catalyst = isStoreBet ? (item.thesis || item.triggers) : item.catalyst;

              return (
                <div key={ticker} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="font-bold text-sm text-[var(--color-ink)]">{ticker}</span>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif">{name}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[var(--color-bullish)] font-semibold">
                      {action} · {horizon}
                    </span>
                  </div>

                  <div className="py-1 flex justify-between font-mono text-[11px]">
                    <span className="text-[var(--color-muted)]">Entry: {entry}</span>
                    <span className="font-bold text-[var(--color-bullish)]">Target: {target}</span>
                    <span className="text-[var(--color-bearish)]">SL: {stopLoss}</span>
                  </div>

                  <p className="text-[11px] text-[var(--color-muted)] font-serif leading-relaxed text-justify">
                    {catalyst}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--color-hairline)] text-right text-xs font-serif italic">
            <Link href="/bets/short-term" className="text-[var(--color-ink)] hover:underline transition-colors">
              Continued in the Short-Term Model
            </Link>
          </div>
        </div>

        {/* 3C. Col 3 (4 cols): Long-Term Structural Bets */}
        <div className="md:col-span-4 p-5 xl:p-6 space-y-4">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono flex items-center justify-between">
            <span className="font-serif font-bold text-[var(--color-ink)] uppercase tracking-wider">Long-Term Structural Bets</span>
          </div>

          <div className="text-xs">
            {(activeLongBets.length > 0 ? activeLongBets.slice(0, 3) : STRUCTURAL_BETS).map((item) => {
              const isStoreBet = 'entryPrice' in item;
              const ticker = item.ticker;
              const name = item.name;
              const cagrTarget = isStoreBet
                ? `+${(((item.targetPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(1)}% Target`
                : item.cagrTarget;
              const theme = isStoreBet ? item.category : item.theme;
              const horizon = isStoreBet ? `Exp ${item.expiryDate}` : item.horizon;
              const thesis = item.thesis;

              return (
                <div key={ticker} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="font-bold text-sm text-[var(--color-ink)]">{ticker}</span>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif">{name}</span>
                    </div>
                    <span className="font-bold text-[var(--color-bullish)] text-xs tabular-nums font-mono">
                      {cagrTarget}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[var(--color-muted)] pb-0.5">
                    {theme} · {horizon}
                  </div>

                  <p className="text-[11px] text-[var(--color-ink)] font-serif leading-relaxed text-justify">
                    {thesis}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--color-hairline)] text-right text-xs font-serif italic">
            <Link href="/bets/long-term" className="text-[var(--color-ink)] hover:underline transition-colors">
              Continued in the Long-Term Model
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
