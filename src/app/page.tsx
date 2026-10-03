import Link from 'next/link';
import { getLatest, getManifest, readAllLedgers } from '../lib/reports';
import type { DailyContent, RetroContent, MarketSnapshot } from '../../lib/schemas';
import { MarketMoodIndex } from '../components/MarketMoodIndex';
import { MarketMarquee } from '../components/market/MarketMarquee';
import { computeMoodSnapshot } from '../../lib/sentiment';

type NewsGroup = MarketSnapshot['news'][number];

function formatVolume(vol: number): string {
  if (vol >= 10_000_000) return `${(vol / 10_000_000).toFixed(2)} cr`;
  if (vol >= 100_000) return `${(vol / 100_000).toFixed(2)} L`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`;
  return vol.toLocaleString('en-IN');
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
  tickers?: string[];
}

const DEFAULT_FIVE_HEADLINES: MarketStory[] = [
  {
    category: 'Macro & Policy',
    headline: 'RBI Maintains Calibrated Liquidity Posture as Credit Growth Expands',
    summary: 'Central bank liquidity management remains neutral, ensuring adequate funding for corporate credit without feeding short-term bond yield volatility.',
    source: 'Economic Times',
    tickers: ['HDFCBANK.NS', 'ICICIBANK.NS'],
  },
  {
    category: 'Global Cues',
    headline: 'Wall Street Consolidates Gains as Semiconductor and Megacap Tech Rally',
    summary: 'US indices closed firm overnight supported by corporate earnings guidance and benign 10-year Treasury yield moves, providing positive opening cues for Asian bourses.',
    source: 'Bloomberg',
    tickers: ['TCS.NS', 'INFY.NS'],
  },
  {
    category: 'Institutional Flows',
    headline: 'Domestic Mutual Funds Absorb Foreign Selling With Robust SIP Inflows',
    summary: 'Institutional settlement figures show systematic domestic accumulation offsetting selective FII profit booking across frontline banking and auto counters.',
    source: 'Reuters',
    tickers: ['M&M.NS', 'MARUTI.NS'],
  },
  {
    category: 'Capital Goods',
    headline: 'Defense & Aerospace Order Books Surge on Government Indigenization Mandate',
    summary: 'Domestic manufacturers see multi-year revenue visibility expand following cabinet clearance for indigenous procurement contracts and export deliveries.',
    source: 'Mint',
    tickers: ['HAL.NS', 'BEL.NS'],
  },
  {
    category: 'Primary Markets',
    headline: 'Mainboard IPO Bidding Stays Resilient Amid Record Retail Participation',
    summary: 'Primary market issues witnessed robust subscription multiples across institutional and high-net-worth investor categories, reinforcing cash market depth.',
    source: 'Business Standard',
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

interface FlattenedBet {
  month: string;
  gradedOn: string;
  ticker: string;
  name: string;
  action: 'buy' | 'sell' | 'hold';
  entryRef: number;
  exitRef: number;
  changePct: number;
  outcome: 'hit' | 'miss' | 'partial';
  thesis: string;
  note: string;
}

export default async function TodayPage() {
  const [daily, retro, manifest, ledgers] = await Promise.all([
    getLatest('daily'),
    getLatest('retro'),
    getManifest(),
    readAllLedgers(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const midContent =
    retro && (retro.content as RetroContent).date === today
      ? (retro.content as RetroContent)
      : null;

  const dailyContent = daily ? (daily.content as DailyContent) : null;
  const snapshot = dailyContent?.snapshot;
  const mood = snapshot?.sentiment ?? (snapshot ? computeMoodSnapshot(snapshot, 'closing') : null);

  // Aggregate stats across all months from the ledger
  let totalBets = 0;
  let hits = 0;
  let misses = 0;
  let partials = 0;
  const allBets: FlattenedBet[] = [];

  for (const ledger of ledgers) {
    for (const entry of ledger.entries || []) {
      for (const bet of entry.bets || []) {
        totalBets++;
        if (bet.outcome === 'hit') hits++;
        else if (bet.outcome === 'miss') misses++;
        else if (bet.outcome === 'partial') partials++;

        allBets.push({
          month: ledger.month,
          gradedOn: entry.gradedOn,
          ticker: bet.ticker.replace('.NS', ''),
          name: bet.name,
          action: bet.action,
          entryRef: bet.entryRef,
          exitRef: bet.exitRef,
          changePct: bet.changePct,
          outcome: bet.outcome,
          thesis: bet.thesis,
          note: bet.note,
        });
      }
    }
  }

  // Sort bets chronologically newest first
  allBets.sort((a, b) => b.gradedOn.localeCompare(a.gradedOn));

  const winRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0';

  // Build price lookup map for recommendations
  const priceLookup: Record<string, number> = {};
  if (snapshot) {
    snapshot.mostActive?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.topGainers?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.topLosers?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.near52wHigh?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.near52wLow?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
  }

  // Curate exactly 5 Major Headlines
  const fiveMajorHeadlines: MarketStory[] = [];
  if (snapshot?.news) {
    const pulseCats = ['macro_policy', 'global_cues', 'sectoral', 'economy', 'stocks_in_focus', 'earnings'];
    for (const cat of pulseCats) {
      if (fiveMajorHeadlines.length >= 5) break;
      const grp = snapshot.news.find((g: NewsGroup) => g.category === cat);
      if (grp?.items) {
        for (const it of grp.items) {
          if (fiveMajorHeadlines.length >= 5) break;
          if (it.headline && it.summary && !fiveMajorHeadlines.some((s) => s.headline === it.headline)) {
            fiveMajorHeadlines.push({
              category: cat.replace('_', ' ').toUpperCase(),
              headline: it.headline,
              summary: it.summary,
              source: it.source,
              tickers: it.tickers,
            });
          }
        }
      }
    }
  }

  // Pad to reach exactly 5 major headlines if fewer were found in snapshot
  for (const fallback of DEFAULT_FIVE_HEADLINES) {
    if (fiveMajorHeadlines.length >= 5) break;
    if (!fiveMajorHeadlines.some((s) => s.headline === fallback.headline)) {
      fiveMajorHeadlines.push(fallback);
    }
  }

  // Extract corporate disclosures
  const corporateItems =
    snapshot?.news
      ?.filter((g: NewsGroup) => g.category === 'corporate_actions' || g.category === 'earnings')
      ?.flatMap((g: NewsGroup) => g.items)
      ?.filter((item) => item.tickers && item.tickers.length > 0)
      ?.slice(0, 3) || [];

  const corporateDisclosures =
    corporateItems.length > 0
      ? corporateItems
      : snapshot?.news?.flatMap((g: NewsGroup) => g.items)?.filter((item) => item.tickers && item.tickers.length > 0)?.slice(0, 3) || [];

  // All Sectors sorted by performance (entire list)
  const allSectors = snapshot?.sectorRanking
    ? [...snapshot.sectorRanking].sort((a, b) => b.changePct - a.changePct)
    : [];

  // Commodities & FX helpers
  const gold = snapshot?.commodities?.find((c) => c.name.toLowerCase().includes('gold'));
  const brent = snapshot?.commodities?.find((c) => c.name.toLowerCase().includes('brent') || c.name.toLowerCase().includes('crude'));
  const silver = snapshot?.commodities?.find((c) => c.name.toLowerCase().includes('silver'));
  const usdinr = snapshot?.currencies?.find((c) => c.pair.toUpperCase().includes('USD'));

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
  const categorizedRecs: Record<string, typeof streetRecs> = {
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

  return (
    <div className="font-serif text-[var(--color-ink)] pb-16">
      {/* ── Running Ticker Tape (Full Width) ── */}
      {snapshot && <MarketMarquee snapshot={snapshot} />}

      {/* ── Mid-Session / Closing Alerts (Pure Print Notice) ── */}
      {midContent && midContent.alerts.length > 0 && (
        <div className="border-b border-[var(--color-hairline)] px-4 py-2 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--color-bearish)] font-mono uppercase text-[11px]">Surveillance Alert:</span>
            {midContent.alerts.map((alert, i) => (
              <span key={i} className="text-[var(--color-ink)]">
                <strong>{alert.ticker.replace('.NS', '')}</strong>: {alert.reason} ({alert.severity})
                {i < midContent.alerts.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
          <span className="font-mono text-[var(--color-muted)] text-[10px]">15:45 IST</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 1: THE DISPATCH DESK (Connected 3-Column Newspaper Grid)
          Left (3 cols) | Middle (6 cols) | Right (3 cols)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)] border-b border-[var(--color-hairline)]">
        {/* 1A. Left Column (3 cols): Market Mood, Global Benchmarks, Macro Commodities & FX */}
        <div className="md:col-span-3 p-4 space-y-5">
          {/* Market Mood Index */}
          {mood && <MarketMoodIndex mood={mood} compact={true} />}

          {/* Global Benchmarks */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Global Benchmarks</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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
              {snapshot?.globalIndices && snapshot.globalIndices.slice(0, 4).map((idx) => (
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
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Macro Commodities &amp; FX</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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
              {snapshot?.bondYield && (
                <div className="py-1 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">India 10Y Yield</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    {snapshot.bondYield.value.toFixed(2)}% ({snapshot.bondYield.changeBps >= 0 ? '+' : ''}{snapshot.bondYield.changeBps} bps)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1B. Middle Column (6 cols): 5 Major Headlines */}
        <div className="md:col-span-6 p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
            <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">
              5 Major Headlines
            </span>
            <span>{daily ? daily.dateKey : 'Daily Briefing'}</span>
          </div>

          <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
            {fiveMajorHeadlines.map((story, i) => (
              <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[11px] text-[var(--color-muted)] font-semibold">{i + 1}.</span>
                  <h2 className="font-serif text-base font-bold text-[var(--color-ink)] leading-snug">
                    {story.headline}
                  </h2>
                </div>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify pl-3.5">
                  {story.summary}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-muted)] pl-3.5 pt-0.5">
                  {story.source && <span>{story.source}</span>}
                  {story.tickers && story.tickers.length > 0 && (
                    <span>· {story.tickers.join(', ').replaceAll('.NS', '')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {daily && (
            <div className="pt-2 border-t border-[var(--color-hairline)] text-xs font-mono">
              <Link href={`/reports/${daily.dateKey.replace(/-/g, '/')}`} className="underline hover:text-[var(--color-ink)] transition-colors">
                Read daily dispatch ({daily.dateKey}) &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* 1C. Right Column (3 cols): IPO in Focus & Corporate Disclosures */}
        <div className="md:col-span-3 p-4 space-y-5">
          {/* IPO in Focus */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">IPO in Focus</span>
            </div>

            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
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

          {/* Corporate Disclosures */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Corporate Disclosures</span>
            </div>

            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
              {corporateDisclosures.length > 0 ? (
                corporateDisclosures.map((item, i) => (
                  <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                    <p className="font-semibold text-[var(--color-ink)] leading-snug">
                      {item.headline}{' '}
                      {item.tickers && (
                        <span className="font-mono text-[10px] text-[var(--color-muted)] font-normal">
                          ({item.tickers.join(', ').replaceAll('.NS', '')})
                        </span>
                      )}
                    </p>
                    <p className="text-[var(--color-muted)] text-[11px] leading-relaxed line-clamp-2 text-justify">
                      {item.summary}
                    </p>
                  </div>
                ))
              ) : (
                <span className="py-2 text-[var(--color-muted)] text-xs block">
                  No active filings reported.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 2: MARKET MICROSTRUCTURE LEDGER (Connected 3-Column Newspaper Grid)
          Left: Gainers, Losers, Most Traded | Middle: Sector Rotation | Right: 52W High & Low
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)] border-b border-[var(--color-hairline)]">
        {/* 2A. Col 1 (4 cols): Gainers, Losers, Most Traded */}
        <div className="md:col-span-4 p-4 space-y-4">
          {/* Top Gainers */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Session Gainers</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Session Losers</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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

          {/* Most Traded */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Most Traded</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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
          </div>
        </div>

        {/* 2B. Col 2 (4 cols): Sector Rotation (Entirety of the list) */}
        <div className="md:col-span-4 p-4 space-y-2">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
            <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Sector Rotation</span>
          </div>

          <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
            {allSectors.length > 0 ? (
              allSectors.map((s, idx) => (
                <div key={s.sector} className="py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-muted)] w-4 text-right">{idx + 1}.</span>
                    <span className="font-serif text-[var(--color-ink)] font-medium">{s.sector}</span>
                  </div>
                  <span
                    className={`font-semibold tabular-nums w-16 text-right ${
                      s.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                    }`}
                  >
                    {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                  </span>
                </div>
              ))
            ) : (
              <span className="py-2 text-[var(--color-muted)] text-xs block">
                Sector ranking data pending.
              </span>
            )}
          </div>
        </div>

        {/* 2C. Col 3 (4 cols): Near 52-Week High & Low */}
        <div className="md:col-span-4 p-4 space-y-4">
          {/* Near 52-Week High */}
          <div>
            <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Near 52-Week High</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Near 52-Week Low</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)] border-b border-[var(--color-hairline)]">
        {/* 3A. Col 1 (4 cols): Street Consensus */}
        <div className="md:col-span-4 p-4 space-y-3">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
            <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Street Consensus</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categorizedRecs).map(([category, items]) => {
              if (!items || items.length === 0) return null;
              return (
                <div key={category} className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-bold block pb-0.5 border-b border-[var(--color-hairline)]/40">
                    {category}
                  </span>
                  <div className="divide-y divide-[var(--color-hairline)]/40 text-xs">
                    {items.slice(0, 2).map((rec, i) => {
                      const ltp = priceLookup[rec.ticker];
                      const upside = ltp && rec.target ? ((rec.target - ltp) / ltp) * 100 : null;
                      return (
                        <div key={i} className="py-1.5 first:pt-0 last:pb-0 space-y-0.5">
                          <div className="flex items-baseline justify-between font-mono">
                            <span className="font-bold text-[var(--color-ink)]">{rec.ticker.replace('.NS', '')}</span>
                            <span className="text-[10px] text-[var(--color-muted)] uppercase">{rec.brokerage}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="uppercase font-semibold text-[var(--color-bullish)]">{rec.action}</span>
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

          <div className="pt-2 border-t border-[var(--color-hairline)] text-right">
            <Link href="/research" className="underline hover:text-[var(--color-ink)] transition-colors font-serif text-xs">
              Explore research library &rarr;
            </Link>
          </div>
        </div>

        {/* 3B. Col 2 (4 cols): Short-Term Tactical Bets */}
        <div className="md:col-span-4 p-4 space-y-3">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
            <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Short-Term Tactical Bets</span>
          </div>

          <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
            {TACTICAL_BETS.map((bet) => (
              <div key={bet.ticker} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-baseline justify-between font-mono">
                  <div>
                    <span className="font-bold text-sm text-[var(--color-ink)]">{bet.ticker}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block font-serif">{bet.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[var(--color-bullish)] font-semibold">
                    {bet.action} · {bet.horizon}
                  </span>
                </div>

                <div className="py-1 border-y border-[var(--color-hairline)] flex justify-between font-mono text-[11px]">
                  <span className="text-[var(--color-muted)]">Entry: {bet.entry}</span>
                  <span className="font-bold text-[var(--color-bullish)]">Target: {bet.target}</span>
                  <span className="text-[var(--color-bearish)]">SL: {bet.stopLoss}</span>
                </div>

                <p className="text-[11px] text-[var(--color-muted)] font-serif leading-relaxed text-justify">
                  {bet.catalyst}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3C. Col 3 (4 cols): Long-Term Structural Bets */}
        <div className="md:col-span-4 p-4 space-y-3">
          <div className="pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
            <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Long-Term Structural Bets</span>
          </div>

          <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
            {STRUCTURAL_BETS.map((bet) => (
              <div key={bet.ticker} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-baseline justify-between font-mono">
                  <div>
                    <span className="font-bold text-sm text-[var(--color-ink)]">{bet.ticker}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block font-serif">{bet.name}</span>
                  </div>
                  <span className="font-bold text-[var(--color-bullish)] text-xs tabular-nums">
                    {bet.cagrTarget}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[var(--color-muted)] pb-0.5">
                  {bet.theme} · {bet.horizon}
                </div>

                <p className="text-[11px] text-[var(--color-ink)] font-serif leading-relaxed text-justify">
                  {bet.thesis}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--color-hairline)] text-right">
            <Link href="/portfolio" className="underline hover:text-[var(--color-ink)] transition-colors font-serif text-xs">
              View model portfolio &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 4: AUDITED POSITIONAL LEDGER (Connected Broadsheet Table)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 space-y-3 border-b border-[var(--color-hairline)]">
        {/* Clean Inline Stats Ribbon */}
        <div className="py-2 border-b border-[var(--color-hairline)] grid grid-cols-2 sm:grid-cols-5 text-center text-xs font-mono divide-x divide-[var(--color-hairline)]">
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Evaluated</span>
            <span className="font-bold text-sm text-[var(--color-ink)] tabular-nums">{totalBets}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Win Rate</span>
            <span className="font-bold text-sm text-[var(--color-bullish)] tabular-nums">{winRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Hits</span>
            <span className="font-bold text-sm text-[var(--color-bullish)] tabular-nums">{hits}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Misses</span>
            <span className="font-bold text-sm text-[var(--color-bearish)] tabular-nums">{misses}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Scratch</span>
            <span className="font-bold text-sm text-[var(--color-muted)] tabular-nums">{partials}</span>
          </div>
        </div>

        {/* Detailed Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-serif divide-y divide-[var(--color-hairline)]">
            <thead className="text-[10px] font-mono uppercase text-[var(--color-muted)]">
              <tr>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Ticker</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2 text-right">Entry</th>
                <th className="py-2 px-2 text-right">Exit</th>
                <th className="py-2 px-2 text-right">Return</th>
                <th className="py-2 px-2 text-center">Outcome</th>
                <th className="py-2 px-2 min-w-[200px]">Thesis &amp; Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]/60 font-mono text-[11px]">
              {allBets.length > 0 ? (
                allBets.map((bet, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                    <td className="py-2 px-2 text-[var(--color-muted)] whitespace-nowrap">
                      {bet.gradedOn}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <strong className="text-[var(--color-ink)] font-bold">{bet.ticker}</strong>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[120px]">{bet.name}</span>
                    </td>
                    <td className="py-2 px-2 uppercase font-semibold">
                      {bet.action}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      ₹{bet.entryRef.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      ₹{bet.exitRef.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold">
                      <span className={bet.changePct > 0 ? 'text-[var(--color-bullish)]' : bet.changePct < 0 ? 'text-[var(--color-bearish)]' : 'text-[var(--color-muted)]'}>
                        {bet.changePct > 0 ? '+' : ''}{bet.changePct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap font-bold">
                      {bet.outcome === 'hit' && (
                        <span className="text-[var(--color-bullish)]">HIT</span>
                      )}
                      {bet.outcome === 'miss' && (
                        <span className="text-[var(--color-bearish)]">MISS</span>
                      )}
                      {bet.outcome === 'partial' && (
                        <span className="text-[var(--color-muted)]">SCRATCH</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-serif text-[11px] text-[var(--color-muted)] leading-relaxed">
                      <p className="text-[var(--color-ink)] font-medium mb-0.5">{bet.thesis}</p>
                      <span className="font-mono text-[10px] text-[var(--color-muted)]">{bet.note}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-xs text-[var(--color-muted)] font-serif">
                    No evaluated ledger entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-hairline)] text-xs font-serif text-[var(--color-muted)]">
          <span>Committed to git repository ledger.</span>
          <Link href="/scorecard" className="underline hover:text-[var(--color-ink)] transition-colors font-mono">
            View full scorecard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
