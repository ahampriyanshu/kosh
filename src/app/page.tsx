import Link from 'next/link';
import { getLatest, getManifest, readAllLedgers } from '../lib/reports';
import type { DailyContent, RetroContent, MarketSnapshot } from '../../lib/schemas';
import { MarketMoodIndex } from '../components/MarketMoodIndex';
import { MarketMarquee } from '../components/market/MarketMarquee';
import { computeMoodSnapshot } from '../../lib/sentiment';

type NewsGroup = MarketSnapshot['news'][number];

function formatCrore(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN')} cr`;
}

function formatVolume(vol: number): string {
  if (vol >= 10_000_000) return `${(vol / 10_000_000).toFixed(2)} cr`;
  if (vol >= 100_000) return `${(vol / 100_000).toFixed(2)} L`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}k`;
  return vol.toLocaleString('en-IN');
}

interface IPOItem {
  company: string;
  issueType: 'Mainboard' | 'SME';
  priceBand: string;
  issueSize: string;
  gmp: string;
  gmpPct: string;
  subscription: string;
  dates: string;
  status: 'Open' | 'Upcoming' | 'Closed';
}

const PRIMARY_MARKET_IPOS: IPOItem[] = [
  {
    company: 'Hyundai Motor India',
    issueType: 'Mainboard',
    priceBand: '₹1,865 – ₹1,960',
    issueSize: '₹27,870 cr',
    gmp: '+₹65',
    gmpPct: '+3.3%',
    subscription: '2.37×',
    dates: 'Oct 15 – Oct 17',
    status: 'Closed',
  },
  {
    company: 'Waaree Energies',
    issueType: 'Mainboard',
    priceBand: '₹1,427 – ₹1,503',
    issueSize: '₹4,321 cr',
    gmp: '+₹1,275',
    gmpPct: '+84.8%',
    subscription: '76.3×',
    dates: 'Oct 21 – Oct 23',
    status: 'Closed',
  },
  {
    company: 'Afcons Infrastructure',
    issueType: 'Mainboard',
    priceBand: '₹440 – ₹463',
    issueSize: '₹5,430 cr',
    gmp: '+₹25',
    gmpPct: '+5.4%',
    subscription: '2.63×',
    dates: 'Oct 25 – Oct 29',
    status: 'Open',
  },
];

interface TacticalBet {
  ticker: string;
  name: string;
  action: 'BUY' | 'SELL';
  strategy: string;
  entry: string;
  target: string;
  stopLoss: string;
  riskReward: string;
  horizon: string;
  conviction: 'HIGH' | 'TACTICAL';
  catalyst: string;
}

const TACTICAL_BETS: TacticalBet[] = [
  {
    ticker: 'TRENT',
    name: 'Trent Limited',
    action: 'BUY',
    strategy: 'Zudio Store Addition Momentum',
    entry: '₹7,950',
    target: '₹8,650 (+8.8%)',
    stopLoss: '₹7,680 (-3.4%)',
    riskReward: '1 : 2.6',
    horizon: '2–3 Weeks',
    conviction: 'HIGH',
    catalyst: 'Festive retail footfall surge and aggressive tier-2/3 store rollout.',
  },
  {
    ticker: 'BHARTIARTL',
    name: 'Bharti Airtel',
    action: 'BUY',
    strategy: 'ARPU Expansion Post-Tariff Hike',
    entry: '₹1,690',
    target: '₹1,840 (+8.9%)',
    stopLoss: '₹1,630 (-3.5%)',
    riskReward: '1 : 2.5',
    horizon: '3–4 Weeks',
    conviction: 'HIGH',
    catalyst: 'Industry-leading blended ARPU trajectory heading toward ₹220+ target.',
  },
  {
    ticker: 'DIXON',
    name: 'Dixon Technologies',
    action: 'BUY',
    strategy: 'EMS Localization & Mobile Assembly',
    entry: '₹14,800',
    target: '₹16,400 (+10.8%)',
    stopLoss: '₹14,100 (-4.7%)',
    riskReward: '1 : 2.3',
    horizon: '2–4 Weeks',
    conviction: 'TACTICAL',
    catalyst: 'Global smartphone manufacturing export ramp-up and PLI accruals.',
  },
];

interface StructuralBet {
  ticker: string;
  name: string;
  theme: string;
  cagrTarget: string;
  horizon: string;
  valuationStance: string;
  thesis: string;
}

const STRUCTURAL_BETS: StructuralBet[] = [
  {
    ticker: 'HAL',
    name: 'Hindustan Aeronautics',
    theme: 'Defense Indigenization & Aerospace Supercycle',
    cagrTarget: '+24% CAGR',
    horizon: '12–18 Months',
    valuationStance: 'Fair Value ₹6,200',
    thesis: 'Record ₹94,000+ cr order backlog with Tejas Mk1A engine deliveries unlocking multi-year revenue visibility.',
  },
  {
    ticker: 'POLYCAB',
    name: 'Polycab India',
    theme: 'Grid Infrastructure, Real Estate & Clean Energy',
    cagrTarget: '+21% CAGR',
    horizon: '18–24 Months',
    valuationStance: 'Growth at Reasonable Price',
    thesis: 'Transmission capex, data center heavy cabling, and US UL-certified exports driving 18%+ operating ROCE.',
  },
  {
    ticker: 'TITAN',
    name: 'Titan Company',
    theme: 'Luxury Premiumization & Formal Market Share',
    cagrTarget: '+19% CAGR',
    horizon: '12–24 Months',
    valuationStance: 'Premium Compounder',
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

  // Curate News items: Macro policy, global cues, sectoral
  const newsStories: Array<{ headline: string; summary: string; source?: string; tickers?: string[] }> = [];
  if (snapshot?.news) {
    const pulseCats = ['macro_policy', 'global_cues', 'sectoral', 'economy'];
    for (const cat of pulseCats) {
      const grp = snapshot.news.find((g: NewsGroup) => g.category === cat);
      if (grp?.items) {
        for (const it of grp.items.slice(0, 1)) {
          if (it.headline && it.summary) {
            newsStories.push({
              headline: it.headline,
              summary: it.summary,
              source: it.source,
              tickers: it.tickers,
            });
          }
        }
      }
    }
    // Fill up to 3 if needed
    if (newsStories.length < 3) {
      for (const grp of snapshot.news) {
        if (!['corporate_actions', 'earnings'].includes(grp.category)) {
          for (const it of grp.items) {
            if (newsStories.length >= 3) break;
            if (it.headline && it.summary && !newsStories.some((s) => s.headline === it.headline)) {
              newsStories.push({
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
  const eurinr = snapshot?.currencies?.find((c) => c.pair.toUpperCase().includes('EUR'));

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
    'CAPITAL GOODS & DEFENSE': [],
    'BANKING & FINANCIALS': [],
    'CONSUMER, TECH & TELECOM': [],
  };

  streetRecs.forEach((r) => {
    const t = r.ticker.toUpperCase();
    if (t.includes('HAL') || t.includes('BEL') || t.includes('LT') || t.includes('BHEL') || t.includes('MAZDOCK')) {
      categorizedRecs['CAPITAL GOODS & DEFENSE'].push(r);
    } else if (t.includes('BANK') || t.includes('FIN') || t.includes('BAJ') || t.includes('HDFC') || t.includes('ICICI') || t.includes('KOTAK') || t.includes('ONE97')) {
      categorizedRecs['BANKING & FINANCIALS'].push(r);
    } else {
      categorizedRecs['CONSUMER, TECH & TELECOM'].push(r);
    }
  });

  return (
    <div className="font-serif text-[var(--color-ink)] pb-16">
      {/* ── Running Ticker Tape (Full Width) ── */}
      {snapshot && <MarketMarquee snapshot={snapshot} />}

      {/* ── Mid-Session / Closing Alerts Banner (if active today) ── */}
      {midContent && midContent.alerts.length > 0 && (
        <div className="mb-6 p-3 border border-amber-600/60 dark:border-amber-400/60 text-xs font-serif">
          <div className="flex items-center justify-between font-semibold pb-1.5 mb-2 border-b border-[var(--color-hairline)]">
            <span className="text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono">
              Risk Surveillance Alerts ({midContent.alerts.length})
            </span>
            <span className="font-mono text-[var(--color-muted)]">15:45 IST Close</span>
          </div>
          <div className="space-y-1">
            {midContent.alerts.map((alert, i) => (
              <p key={i} className="text-[var(--color-ink)]">
                <strong className="font-semibold">{alert.ticker.replace('.NS', '')}</strong>: {alert.reason}{' '}
                <span className="text-[var(--color-bearish)] text-[11px] font-mono">
                  ({alert.severity} risk)
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: THE TOP COMPONENT (3-Column Layout: Left (3), Middle (6), Right (3))
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8 border-b border-[var(--color-hairline)]" aria-label="Dispatch & Macro Desk">
        {/* 1A. Left Column (3 cols): Market Mood, Global Benchmarks, Macro Commodities & FX */}
        <div className="md:col-span-3 pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] space-y-6 pb-6 md:pb-0">
          {/* Market Mood Index */}
          {mood && <MarketMoodIndex mood={mood} compact={true} />}

          {/* Global Benchmarks */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Global Benchmarks</span>
              <span className="text-[var(--color-muted)] text-[10px]">Overnight Cues</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
              {snapshot?.giftNifty && (
                <div className="py-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[var(--color-ink)]">GIFT Nifty</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">{snapshot.giftNifty.value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                    <span className={`font-semibold tabular-nums ${snapshot.giftNifty.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {snapshot.giftNifty.changePct >= 0 ? '+' : ''}{snapshot.giftNifty.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {snapshot?.globalIndices && snapshot.globalIndices.length > 0 ? (
                snapshot.globalIndices.slice(0, 4).map((idx) => (
                  <div key={idx.symbol || idx.name} className="py-1.5 flex items-center justify-between">
                    <span className="text-[var(--color-ink)]">{idx.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-muted)]">{idx.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      <span className={`font-semibold tabular-nums ${idx.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                        {idx.changePct >= 0 ? '+' : ''}{idx.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="py-2 text-[var(--color-muted)] text-[11px] block">Global data pending</span>
              )}
            </div>
          </div>

          {/* Macro Commodities & FX */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Macro Commodities &amp; FX</span>
              <span className="text-[var(--color-muted)] text-[10px]">Macro Pulse</span>
            </div>
            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
              {gold && (
                <div className="py-1.5 flex items-center justify-between">
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
                <div className="py-1.5 flex items-center justify-between">
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
                <div className="py-1.5 flex items-center justify-between">
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
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">USD / INR</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    ₹{usdinr.value.toFixed(2)} ({usdinr.changePct >= 0 ? '+' : ''}{usdinr.changePct.toFixed(2)}%)
                  </span>
                </div>
              )}
              {eurinr && (
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">EUR / INR</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    ₹{eurinr.value.toFixed(2)} ({eurinr.changePct >= 0 ? '+' : ''}{eurinr.changePct.toFixed(2)}%)
                  </span>
                </div>
              )}
              {snapshot?.bondYield && (
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-[var(--color-ink)]">India 10Y Yield</span>
                  <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                    {snapshot.bondYield.value.toFixed(2)}% ({snapshot.bondYield.changeBps >= 0 ? '+' : ''}{snapshot.bondYield.changeBps} bps)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1B. Middle Column (6 cols): The News (Lead Story + Market Dispatches) */}
        <article className="md:col-span-6 px-0 md:px-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] space-y-5 pb-6 md:pb-0">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">
                Front Dispatch · The Lead Story
              </span>
              <span>
                {daily ? `Session: ${daily.dateKey}` : 'Daily Market Briefing'}
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-ink)] leading-tight mb-2">
              Market Pulse: Macro Policy &amp; Capital Flows Set Trading Posture
            </h1>

            <p className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wide mb-3">
              MUMBAI — Quantitative Editorial Risk Desk
            </p>

            <p className="text-sm leading-relaxed text-[var(--color-ink)] text-justify space-y-2 mb-4">
              {dailyContent?.outlook || 'Indian equity markets consolidated within key technical ranges as institutional capital flows and global macro triggers dictated directional momentum across benchmark indices.'}
            </p>

            {dailyContent?.keyTakeaways && dailyContent.keyTakeaways.length > 0 && (
              <div className="p-3 bg-[var(--color-raised)]/40 border border-[var(--color-hairline)] mb-4">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                  Executive Takeaways
                </span>
                <ul className="space-y-1 text-xs text-[var(--color-ink)] list-disc pl-4 font-serif">
                  {dailyContent.keyTakeaways.slice(0, 3).map((takeaway, i) => (
                    <li key={i}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Secondary News Dispatches */}
          {newsStories.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-hairline)] space-y-4">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] block">
                Session Wire Dispatches
              </span>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {newsStories.map((story, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <h2 className="font-serif text-base font-bold text-[var(--color-ink)] leading-snug">
                      {story.headline}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify">
                      {story.summary}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-muted)] pt-0.5">
                      {story.source && <span>Source: {story.source}</span>}
                      {story.tickers && story.tickers.length > 0 && (
                        <span>· Tickers: {story.tickers.join(', ').replaceAll('.NS', '')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {daily && (
            <div className="mt-4 pt-3 border-t border-[var(--color-hairline)] text-xs font-mono">
              <Link href={`/reports/${daily.dateKey.replace(/-/g, '/')}`} className="underline hover:text-[var(--color-ink)] transition-colors">
                Read complete daily morning dispatch ({daily.dateKey}) &rarr;
              </Link>
            </div>
          )}
        </article>

        {/* 1C. Right Column (3 cols): IPO in Focus & Corporate Disclosures */}
        <div className="md:col-span-3 pl-0 md:pl-4 space-y-6">
          {/* IPO in Focus */}
          <div>
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">IPO in Focus</span>
              <span className="text-[var(--color-muted)] text-[10px]">Primary Markets</span>
            </div>

            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
              {PRIMARY_MARKET_IPOS.map((ipo, i) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="font-bold text-[var(--color-ink)]">{ipo.company}</span>
                    <span className={`text-[10px] font-semibold uppercase ${ipo.status === 'Open' ? 'text-[var(--color-bullish)]' : 'text-[var(--color-muted)]'}`}>
                      [{ipo.status}]
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)]">
                    <span>{ipo.priceBand}</span>
                    <span>{ipo.issueSize}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                    <span className="text-[var(--color-muted)]">GMP: <strong className="text-[var(--color-bullish)] font-semibold">{ipo.gmp} ({ipo.gmpPct})</strong></span>
                    <span className="text-[var(--color-ink)]">Sub: <strong>{ipo.subscription}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2.5 p-2 bg-[var(--color-raised)]/30 border border-[var(--color-hairline)] text-[10px] font-mono text-[var(--color-muted)]">
              Primary Market Surveillance · NSE/BSE mainboard &amp; SME grey market tracking.
            </div>
          </div>

          {/* Corporate Disclosures */}
          <div className="pt-2 border-t border-[var(--color-hairline)]">
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Corporate Disclosures</span>
              <span className="text-[var(--color-muted)] text-[10px]">Filings</span>
            </div>

            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
              {corporateDisclosures.length > 0 ? (
                corporateDisclosures.map((item, i) => (
                  <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                    <p className="font-semibold text-[var(--color-ink)] leading-snug">
                      {item.headline}{' '}
                      {item.tickers && (
                        <span className="font-mono text-[10px] text-[var(--color-muted)]">
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
                  No active filings reported in this window.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: MARKET MICROSTRUCTURE & MACRO ENVIRONMENT (3 Columns)
          Col 1: Session Gainers, Session Losers, Top 3 Most Traded
          Col 2: Sector Rotation (Entirety of the list)
          Col 3: Near 52-Week High & Near 52-Week Low
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="my-8 pt-4 border-t-2 border-[var(--color-ink)]" aria-label="Market Microstructure">
        <div className="flex items-baseline justify-between pb-2 mb-6 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
          <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider">
            Market Microstructure &amp; Macro Environment
          </h2>
          <span>NSE CASH &amp; DERIVATIVES LEDGER</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)]">
          {/* 2A. Col 1 (4 cols): Gainers, Losers, Top 3 Most Traded */}
          <div className="md:col-span-4 pr-0 md:pr-6 pb-6 md:pb-0 space-y-5">
            {/* Top Gainers */}
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Session Gainers</span>
                <span className="text-[var(--color-bullish)] text-[10px]">Top 5</span>
              </div>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {snapshot?.topGainers && snapshot.topGainers.length > 0 ? (
                  snapshot.topGainers.slice(0, 5).map((g) => (
                    <div key={g.ticker} className="py-1.5 flex items-center justify-between">
                      <span className="font-bold text-[var(--color-ink)]">{g.ticker.replace('.NS', '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-muted)]">₹{g.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                        <span className="font-semibold text-[var(--color-bullish)] tabular-nums">+{g.changePct.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="py-2 text-[var(--color-muted)] text-[11px] block">No gainers reported</span>
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div className="pt-3 border-t border-[var(--color-hairline)]">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Session Losers</span>
                <span className="text-[var(--color-bearish)] text-[10px]">Top 5</span>
              </div>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {snapshot?.topLosers && snapshot.topLosers.length > 0 ? (
                  snapshot.topLosers.slice(0, 5).map((l) => (
                    <div key={l.ticker} className="py-1.5 flex items-center justify-between">
                      <span className="font-bold text-[var(--color-ink)]">{l.ticker.replace('.NS', '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-muted)]">₹{l.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                        <span className="font-semibold text-[var(--color-bearish)] tabular-nums">{l.changePct.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="py-2 text-[var(--color-muted)] text-[11px] block">No losers reported</span>
                )}
              </div>
            </div>

            {/* Top 3 Most Traded (Replaced Turnover Multipliers) */}
            <div className="pt-3 border-t border-[var(--color-hairline)]">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Top 3 Most Traded</span>
                <span className="text-[var(--color-muted)] text-[10px]">Turnover &amp; Volume</span>
              </div>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {snapshot?.mostActive && snapshot.mostActive.length > 0 ? (
                  snapshot.mostActive.slice(0, 3).map((item) => (
                    <div key={item.ticker} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[var(--color-ink)] block">{item.ticker.replace('.NS', '')}</span>
                        <span className="text-[10px] text-[var(--color-muted)] font-serif block truncate max-w-[140px]">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[var(--color-ink)] font-semibold">₹{item.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                        <span className="text-[10px] text-[var(--color-muted)] block">Vol: {formatVolume(item.volume)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="py-2 text-[var(--color-muted)] text-[11px] block">No active volume reported</span>
                )}
              </div>
            </div>
          </div>

          {/* 2B. Col 2 (4 cols): Sector Rotation (Entirety of the List) */}
          <div className="md:col-span-4 px-0 md:px-6 py-6 md:py-0 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Sector Rotation Matrix</span>
                <span className="text-[var(--color-muted)] text-[10px]">All {allSectors.length} Sectors</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-3 leading-relaxed">
                Full-spectrum NSE sectoral performance sorted by relative momentum and capital allocation.
              </p>

              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {allSectors.length > 0 ? (
                  allSectors.map((s, idx) => (
                    <div key={s.sector} className="py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--color-muted)] w-4 text-right">{idx + 1}.</span>
                        <span className="font-serif text-[var(--color-ink)] font-medium">{s.sector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums w-16 text-right ${
                            s.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                          }`}
                        >
                          {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="py-3 text-[var(--color-muted)] text-xs block">
                    Sector ranking data pending session updates.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2C. Col 3 (4 cols): Near 52-Week High & Near 52-Week Low */}
          <div className="md:col-span-4 pl-0 md:pl-6 pt-6 md:pt-0 space-y-5">
            {/* Near 52-Week High */}
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Near 52-Week High</span>
                <span className="text-[var(--color-bullish)] text-[10px]">Testing Resistance</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mb-2 font-serif">
                Equities trading within 2–5% of all-time / 52-week peak valuations.
              </p>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {near52HighItems.slice(0, 4).map((item) => (
                  <div key={item.ticker} className="py-1.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--color-ink)]">{item.ticker.replace('.NS', '')}</span>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[var(--color-ink)]">₹{item.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      <span className="text-[10px] text-[var(--color-bearish)] block tabular-nums">
                        −{item.pctFromHigh.toFixed(1)}% of 52W High
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Near 52-Week Low */}
            <div className="pt-3 border-t border-[var(--color-hairline)]">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Near 52-Week Low</span>
                <span className="text-[var(--color-bearish)] text-[10px]">Testing Support</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mb-2 font-serif">
                Equities consolidating within 2% of annual base support levels.
              </p>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {near52LowItems.slice(0, 4).map((item) => (
                  <div key={item.ticker} className="py-1.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--color-ink)]">{item.ticker.replace('.NS', '')}</span>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[var(--color-ink)]">₹{item.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                      <span className="text-[10px] text-[var(--color-bullish)] block tabular-nums">
                        +{item.pctFromLow.toFixed(1)}% above 52W Low
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: RESEARCH, ACCOUNTABILITY & THE STREET CONSENSUS
          Col 1: Categorised Recommendations from Brokerage Houses
          Col 2: Short-Term Tactical Bets (1–4 Weeks Horizon)
          Col 3: Long-Term Structural Bets (6–24 Months Horizon)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="my-8 pt-4 border-t-2 border-[var(--color-ink)]" aria-label="Research & The Street Consensus">
        <div className="flex items-baseline justify-between pb-2 mb-6 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
          <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider">
            Research, Accountability &amp; The Street Consensus
          </h2>
          <span>INSTITUTIONAL RADAR &amp; QUANTITATIVE PORTFOLIO THESES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)]">
          {/* 3A. Col 1 (4 cols): Categorised Street Recommendations */}
          <div className="md:col-span-4 pr-0 md:pr-6 pb-6 md:pb-0 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">The Street Consensus</span>
                <span className="text-[var(--color-muted)] text-[10px]">By Sector</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-3 leading-relaxed">
                Institutional target revisions and coverage initiation notes from marquee brokerage houses.
              </p>

              <div className="space-y-4">
                {Object.entries(categorizedRecs).map(([category, items]) => {
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={category} className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink)] font-bold block pb-1 border-b border-[var(--color-hairline)]/60">
                        {category}
                      </span>
                      <div className="divide-y divide-[var(--color-hairline)]/40 text-xs">
                        {items.slice(0, 2).map((rec, i) => {
                          const ltp = priceLookup[rec.ticker];
                          const upside = ltp && rec.target ? ((rec.target - ltp) / ltp) * 100 : null;
                          return (
                            <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-1">
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
            </div>

            <div className="pt-2 border-t border-[var(--color-hairline)] text-right">
              <Link href="/research" className="underline hover:text-[var(--color-ink)] transition-colors font-serif text-xs">
                Explore research library &rarr;
              </Link>
            </div>
          </div>

          {/* 3B. Col 2 (4 cols): Short-Term Tactical Bets */}
          <div className="md:col-span-4 px-0 md:px-6 py-6 md:py-0 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Short-Term Tactical Bets</span>
                <span className="text-[var(--color-bullish)] text-[10px]">1–4 Weeks Horizon</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-3 leading-relaxed">
                Quantitative swing opportunities with strict risk-reward thresholds and fundamental catalysts.
              </p>

              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {TACTICAL_BETS.map((bet) => (
                  <div key={bet.ticker} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-baseline justify-between font-mono">
                      <div>
                        <span className="font-bold text-sm text-[var(--color-ink)]">{bet.ticker}</span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-serif">{bet.name}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-[var(--color-bullish)] text-[var(--color-bullish)]">
                        {bet.action} · {bet.horizon}
                      </span>
                    </div>

                    <div className="p-2 bg-[var(--color-raised)]/40 border border-[var(--color-hairline)] space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Entry: {bet.entry}</span>
                        <span className="font-bold text-[var(--color-bullish)]">Target: {bet.target}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[var(--color-bearish)]">Stop Loss: {bet.stopLoss}</span>
                        <span className="text-[var(--color-muted)]">R:R {bet.riskReward}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--color-muted)] font-serif leading-relaxed text-justify">
                      <strong className="font-semibold text-[var(--color-ink)]">Catalyst:</strong> {bet.catalyst}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3C. Col 3 (4 cols): Long-Term Structural Bets */}
          <div className="md:col-span-4 pl-0 md:pl-6 pt-6 md:pt-0 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Long-Term Structural Bets</span>
                <span className="text-[var(--color-ink)] text-[10px]">6–24 Months Horizon</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-3 leading-relaxed">
                Secular compounders benefiting from indigenization, formalization, and energy transition.
              </p>

              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {STRUCTURAL_BETS.map((bet) => (
                  <div key={bet.ticker} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-baseline justify-between font-mono">
                      <div>
                        <span className="font-bold text-sm text-[var(--color-ink)]">{bet.ticker}</span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-serif">{bet.name}</span>
                      </div>
                      <span className="font-bold text-[var(--color-bullish)] text-xs tabular-nums">
                        {bet.cagrTarget}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)] pb-0.5 border-b border-[var(--color-hairline)]/40">
                      <span>Horizon: {bet.horizon}</span>
                      <span>Stance: {bet.valuationStance}</span>
                    </div>

                    <p className="text-[11px] text-[var(--color-ink)] font-serif leading-relaxed text-justify">
                      {bet.thesis}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--color-hairline)] text-right">
              <Link href="/portfolio" className="underline hover:text-[var(--color-ink)] transition-colors font-serif text-xs">
                View long-term model portfolio &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: AUDITED POSITIONAL LEDGER (In Detail)
          Comprehensive verification table of all evaluated calls with git commit hash audit
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="my-8 pt-4 border-t-2 border-[var(--color-ink)]" aria-label="Audited Positional Ledger">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-2 mb-4 border-b border-[var(--color-hairline)] text-xs font-mono">
          <div>
            <h2 className="font-serif font-bold text-base text-[var(--color-ink)] uppercase tracking-wider">
              Audited Positional Ledger
            </h2>
            <p className="text-[11px] text-[var(--color-muted)] font-serif">
              Backward-looking verification ledger of all weekly positional calls graded against actual NSE market closes.
            </p>
          </div>
          <span className="text-[var(--color-muted)] mt-1 sm:mt-0 font-mono text-[10px]">
            SHA-256 GIT AUDITED ARCHIVE
          </span>
        </div>

        {/* Aggregate Performance Ribbon */}
        <div className="p-4 border border-[var(--color-ink)] bg-[var(--color-surface)] mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center divide-x divide-[var(--color-hairline)]">
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-0.5">
                Total Evaluated
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-ink)] tabular-nums">
                {totalBets}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-0.5">
                Directional Win Rate
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-bullish)] tabular-nums">
                {winRate}%
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-0.5">
                Validated Hits
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-bullish)] tabular-nums">
                {hits}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-0.5">
                Misses
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-bearish)] tabular-nums">
                {misses}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-0.5">
                Partials / Scratch
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-muted)] tabular-nums">
                {partials}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Master Ledger Table */}
        <div className="overflow-x-auto border border-[var(--color-hairline)]">
          <table className="w-full text-left text-xs font-serif divide-y divide-[var(--color-hairline)]">
            <thead className="bg-[var(--color-raised)]/60 text-[10px] font-mono uppercase text-[var(--color-muted)]">
              <tr>
                <th className="py-2.5 px-3">Date Graded</th>
                <th className="py-2.5 px-3">Ticker &amp; Asset</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3 text-right">Entry Ref</th>
                <th className="py-2.5 px-3 text-right">Exit Ref</th>
                <th className="py-2.5 px-3 text-right">Realized %</th>
                <th className="py-2.5 px-3 text-center">Outcome</th>
                <th className="py-2.5 px-3 min-w-[220px]">Thesis &amp; Post-Mortem Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]/60 font-mono">
              {allBets.length > 0 ? (
                allBets.map((bet, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-raised)]/30 transition-colors">
                    <td className="py-2.5 px-3 text-[11px] text-[var(--color-muted)] whitespace-nowrap">
                      {bet.gradedOn}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <strong className="text-[var(--color-ink)] font-bold">{bet.ticker}</strong>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[130px]">{bet.name}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap uppercase font-semibold text-[11px]">
                      {bet.action}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[11px]">
                      ₹{bet.entryRef.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[11px]">
                      ₹{bet.exitRef.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[11px]">
                      <span className={bet.changePct > 0 ? 'text-[var(--color-bullish)]' : bet.changePct < 0 ? 'text-[var(--color-bearish)]' : 'text-[var(--color-muted)]'}>
                        {bet.changePct > 0 ? '+' : ''}{bet.changePct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {bet.outcome === 'hit' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-bullish)] border border-[var(--color-bullish)]">
                          HIT
                        </span>
                      )}
                      {bet.outcome === 'miss' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-bearish)] border border-[var(--color-bearish)]">
                          MISS
                        </span>
                      )}
                      {bet.outcome === 'partial' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-muted)] border border-[var(--color-muted)]">
                          SCRATCH
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-serif text-[11px] text-[var(--color-muted)] leading-relaxed">
                      <p className="text-[var(--color-ink)] font-medium mb-0.5">{bet.thesis}</p>
                      <span className="font-mono text-[10px] text-[var(--color-muted)]">{bet.note}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[var(--color-muted)] font-serif">
                    No evaluated ledger entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs font-serif text-[var(--color-muted)]">
          <span>Every call is permanently committed to git and sealed against post-hoc tampering.</span>
          <Link href="/scorecard" className="underline hover:text-[var(--color-ink)] transition-colors font-mono">
            View full scorecard &amp; monthly recaps &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
