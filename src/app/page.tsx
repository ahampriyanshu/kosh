import Link from 'next/link';
import { getLatest, getManifest, readAllLedgers } from '../lib/reports';
import type { DailyContent, RetroContent } from '../../lib/schemas';
import { MarketMoodIndex } from '../components/MarketMoodIndex';
import { MarketMarquee } from '../components/market/MarketMarquee';
import { computeMoodSnapshot } from '../../lib/sentiment';

function formatCrore(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN')} cr`;
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
  const recordedHits: string[] = [];

  for (const ledger of ledgers) {
    for (const entry of ledger.entries || []) {
      for (const bet of entry.bets || []) {
        totalBets++;
        if (bet.outcome === 'hit') {
          hits++;
          if (bet.thesis && recordedHits.length < 1) {
            recordedHits.push(
              `${bet.ticker.replace('.NS', '')}: ${bet.thesis}`
            );
          }
        } else if (bet.outcome === 'miss') {
          misses++;
        } else if (bet.outcome === 'partial') {
          partials++;
        }
      }
    }
  }

  const winRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(0) : '0';

  // Build price lookup map for recommendations
  const priceLookup: Record<string, number> = {};
  if (snapshot) {
    snapshot.mostActive?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.topGainers?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.topLosers?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.near52wHigh?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.near52wLow?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
  }

  // Extract corporate disclosures
  const corporateItems =
    snapshot?.news
      ?.filter((g) => g.category === 'corporate_actions' || g.category === 'earnings')
      ?.flatMap((g) => g.items)
      ?.filter((item) => item.tickers && item.tickers.length > 0)
      ?.slice(0, 3) || [];

  const corporateDisclosures =
    corporateItems.length > 0
      ? corporateItems
      : snapshot?.news?.flatMap((g) => g.items)?.filter((item) => item.tickers && item.tickers.length > 0)?.slice(0, 3) || [];

  // Sector Leaders (Top 3) & Laggards (Bottom 3)
  const sortedSectors = snapshot?.sectorRanking
    ? [...snapshot.sectorRanking].sort((a, b) => b.changePct - a.changePct)
    : [];
  const sectorLeaders = sortedSectors.slice(0, 3);
  const sectorLaggards = sortedSectors.slice(-3).reverse();

  // Commodities & FX helpers
  const gold = snapshot?.commodities?.find((c) => c.name.toLowerCase().includes('gold'));
  const usdinr = snapshot?.currencies?.find((c) => c.pair.toUpperCase().includes('USD'));

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
          TIER 1: THE DISPATCH DESK (Lead Story & Unified Market Mood Radar)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[var(--color-hairline)]" aria-label="Dispatch Desk">
        {/* 1A. Lead Editorial Story (Left, 7 cols) */}
        <article className="md:col-span-7 flex flex-col justify-between pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] pb-6 md:pb-0">
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

            <p className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wide mb-4">
              MUMBAI — By the Quantitative Editorial Risk Desk
            </p>

            <p className="text-sm leading-relaxed text-[var(--color-ink)] text-justify space-y-2 mb-4">
              {dailyContent?.outlook || 'Indian equity markets consolidated within key technical ranges as institutional capital flows and global macro triggers dictated directional momentum across benchmark indices.'}
            </p>

            {dailyContent?.keyTakeaways && dailyContent.keyTakeaways.length > 0 && (
              <div className="pt-3 border-t border-[var(--color-hairline)]">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                  Executive Takeaways
                </span>
                <ul className="space-y-1 text-xs text-[var(--color-muted)] list-disc pl-4 font-serif">
                  {dailyContent.keyTakeaways.slice(0, 3).map((takeaway, i) => (
                    <li key={i}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {daily && (
            <div className="mt-4 pt-3 border-t border-[var(--color-hairline)] text-xs font-mono">
              <Link href={`/reports/${daily.dateKey.replace(/-/g, '/')}`} className="underline hover:text-[var(--color-ink)] transition-colors">
                Read complete daily morning dispatch ({daily.dateKey}) &rarr;
              </Link>
            </div>
          )}
        </article>

        {/* 1B. The Unified Market Mood Radar (Right, 5 cols) */}
        <aside className="md:col-span-5 flex flex-col justify-between pl-0 md:pl-2">
          {mood ? (
            <div className="space-y-4">
              <MarketMoodIndex mood={mood} compact />

              {/* Net Institutional Liquidity Summary Box */}
              {snapshot?.fiiDii && (
                <div className="p-3 border border-[var(--color-hairline)] bg-[var(--color-raised)]/30 text-xs">
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[var(--color-hairline)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
                    <span className="font-bold text-[var(--color-ink)]">Net Institutional Liquidity</span>
                    <span>Cash Market</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">FII Net</span>
                      <span className={`font-semibold tabular-nums ${snapshot.fiiDii.fiiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                        {formatCrore(snapshot.fiiDii.fiiNet)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">DII Net</span>
                      <span className={`font-semibold tabular-nums ${snapshot.fiiDii.diiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                        {formatCrore(snapshot.fiiDii.diiNet)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">Combined</span>
                      <span className={`font-bold tabular-nums ${(snapshot.fiiDii.fiiNet + snapshot.fiiDii.diiNet) >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                        {formatCrore(snapshot.fiiDii.fiiNet + snapshot.fiiDii.diiNet)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 border border-[var(--color-hairline)] text-xs text-[var(--color-muted)] font-mono">
              Sentiment data awaiting market opening tick.
            </div>
          )}
        </aside>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TIER 2: MARKET MICROSTRUCTURE & MACRO ENVIRONMENT (3 Scannable Columns)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="my-8 pt-4 border-t-2 border-[var(--color-ink)]" aria-label="Market Microstructure">
        <div className="flex items-baseline justify-between pb-2 mb-6 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
          <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider">
            Market Microstructure &amp; Macro Environment
          </h2>
          <span>NSE NIFTY 500 &amp; GLOBAL CUES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)]">
          {/* 2A. Session Movers (Gainers & Losers) (Col 1, 4 cols) */}
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

            {/* Volume Multipliers */}
            {snapshot?.volumeShockers && snapshot.volumeShockers.length > 0 && (
              <div className="pt-3 border-t border-[var(--color-hairline)]">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                  <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Turnover Multipliers</span>
                  <span className="text-[var(--color-muted)] text-[10px]">&gt;2× Baseline</span>
                </div>
                <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                  {snapshot.volumeShockers.slice(0, 3).map((v) => (
                    <div key={v.ticker} className="py-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[var(--color-ink)]">{v.ticker.replace('.NS', '')}</span>
                        <span className="text-[10px] text-[var(--color-muted)] block truncate max-w-[130px] font-serif">{v.name}</span>
                      </div>
                      <span className="font-semibold text-[var(--color-bullish)] tabular-nums">{v.ratio.toFixed(1)}× Avg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2B. Sector Rotation Matrix & Corporate Filings (Col 2, 4 cols) */}
          <div className="md:col-span-4 px-0 md:px-6 py-6 md:py-0 space-y-5">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Sector Rotation</span>
                <span className="text-[var(--color-muted)] text-[10px]">Leaders &amp; Laggards</span>
              </div>
              <div className="space-y-3">
                {sectorLeaders.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--color-bullish)] font-semibold block mb-1">
                      ▲ Outperforming Sectors
                    </span>
                    <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                      {sectorLeaders.map((s) => (
                        <div key={s.sector} className="py-1 flex items-center justify-between">
                          <span className="font-serif text-[var(--color-ink)]">{s.sector}</span>
                          <span className="font-semibold text-[var(--color-bullish)] tabular-nums">+{s.changePct.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sectorLaggards.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-hairline)]/60">
                    <span className="text-[10px] font-mono uppercase text-[var(--color-bearish)] font-semibold block mb-1">
                      ▼ Lagging Sectors
                    </span>
                    <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                      {sectorLaggards.map((s) => (
                        <div key={s.sector} className="py-1 flex items-center justify-between">
                          <span className="font-serif text-[var(--color-ink)]">{s.sector}</span>
                          <span className="font-semibold text-[var(--color-bearish)] tabular-nums">{s.changePct.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Corporate Disclosures */}
            {corporateDisclosures.length > 0 && (
              <div className="pt-3 border-t border-[var(--color-hairline)]">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                  <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Corporate Disclosures</span>
                  <span className="text-[var(--color-muted)] text-[10px]">Filings</span>
                </div>
                <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                  {corporateDisclosures.slice(0, 3).map((item, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
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
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2C. Global Macro Cues & Derivatives (Col 3, 4 cols) */}
          <div className="md:col-span-4 pl-0 md:pl-6 pt-6 md:pt-0 space-y-5">
            {/* Global Benchmarks */}
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Global Benchmarks</span>
                <span className="text-[var(--color-muted)] text-[10px]">Overnight Cues</span>
              </div>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
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

            {/* Commodities & Macro Assets */}
            <div className="pt-3 border-t border-[var(--color-hairline)]">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Macro Commodities &amp; FX</span>
                <span className="text-[var(--color-muted)] text-[10px]">Safe Haven</span>
              </div>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {gold && (
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-[var(--color-ink)]">MCX Gold</span>
                    <span className={`font-semibold tabular-nums ${gold.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                      {gold.changePct >= 0 ? '+' : ''}{gold.changePct.toFixed(2)}%
                    </span>
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

            {/* Derivatives Options Skew */}
            <div className="pt-3 border-t border-[var(--color-hairline)]">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--color-hairline)] text-xs font-mono">
                <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">Derivatives Skew</span>
                <span className="text-[var(--color-muted)] text-[10px]">Nifty Options</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 bg-[var(--color-raised)]/40 text-xs font-mono text-center">
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Nifty OI PCR</span>
                  <span className="font-bold text-[var(--color-ink)] tabular-nums">
                    {snapshot?.derivatives?.pcrOi !== null && snapshot?.derivatives?.pcrOi !== undefined ? Number(snapshot.derivatives.pcrOi).toFixed(2) : '1.00'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Hedging Tone</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {Number(snapshot?.derivatives?.pcrOi ?? 1) > 1.25 ? 'High Protection' : Number(snapshot?.derivatives?.pcrOi ?? 1) < 0.75 ? 'Low Protection' : 'Balanced'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TIER 3: ACCOUNTABILITY & THE STREET CONSENSUS (Research & Audited Calls)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="my-8 pt-4 border-t-2 border-[var(--color-ink)]" aria-label="Research and Track Record">
        <div className="flex items-baseline justify-between pb-2 mb-6 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
          <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider">
            Research, Accountability &amp; The Street Consensus
          </h2>
          <span>AUDITED PERFORMANCE &amp; INSTITUTIONAL TARGETS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* 3A. Audited Positional Ledger Box (Left, 6 cols) */}
          <div className="md:col-span-6 p-4 border border-[var(--color-ink)] font-serif text-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--color-hairline)]">
                <span className="font-bold uppercase tracking-wider text-[var(--color-ink)] font-mono text-xs">
                  Audited Positional Ledger
                </span>
                <span className="text-[var(--color-bullish)] font-semibold tabular-nums font-mono">
                  {winRate}% Win Rate ({hits}H / {misses}M)
                </span>
              </div>

              <p className="text-[var(--color-muted)] mb-3 leading-relaxed text-justify">
                All weekly positional theses are timestamped, hashed with SHA-256 digests, and graded against actual NSE market closes on Saturdays. Zero hindsight adjustments.
              </p>

              {recordedHits[0] && (
                <div className="p-2.5 bg-[var(--color-raised)]/50 border border-[var(--color-hairline)] text-xs mb-3">
                  <span className="font-mono text-[10px] uppercase text-[var(--color-muted)] block mb-0.5">
                    Recent Validated Thesis
                  </span>
                  <p className="text-[var(--color-ink)] font-semibold leading-snug">
                    {recordedHits[0]}
                  </p>
                </div>
              )}

              <p className="text-[11px] font-mono text-[var(--color-faint)]">
                Total Evaluated Bets: {totalBets} · Verifiable Git Ledger Archive
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--color-hairline)] text-right">
              <Link href="/scorecard" className="underline hover:text-[var(--color-ink)] transition-colors font-serif text-xs">
                View complete audited scorecard &amp; ledger &rarr;
              </Link>
            </div>
          </div>

          {/* 3B. The Street Consensus Radar (Right, 6 cols) */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--color-hairline)] text-xs font-mono">
              <span className="font-bold text-[var(--color-ink)] uppercase tracking-wider">
                The Street Consensus
              </span>
              <span className="text-[var(--color-muted)] text-[10px]">Institutional Brokerage Calls</span>
            </div>

            <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
              {snapshot?.streetRecommendations && snapshot.streetRecommendations.length > 0 ? (
                snapshot.streetRecommendations.slice(0, 3).map((rec, i) => {
                  const ltp = priceLookup[rec.ticker];
                  let upside: number | null = null;
                  if (ltp && rec.target) {
                    upside = ((rec.target - ltp) / ltp) * 100;
                  }
                  return (
                    <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="font-bold text-[var(--color-ink)] text-sm">
                          {rec.ticker.replace('.NS', '')}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">
                          {rec.brokerage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="uppercase text-[var(--color-ink)] font-semibold">{rec.action}</span>
                        {rec.target && (
                          <span className="tabular-nums font-semibold">
                            Target: ₹{rec.target.toLocaleString('en-IN')}{' '}
                            {upside !== null && (
                              <span
                                className={
                                  upside >= 0
                                    ? 'text-[var(--color-bullish)]'
                                    : 'text-[var(--color-bearish)]'
                                }
                              >
                                ({upside >= 0 ? '+' : ''}
                                {upside.toFixed(0)}%)
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
                })
              ) : (
                <span className="py-3 text-[var(--color-muted)] text-xs block">
                  Street consensus updates pending institutional disclosures.
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-[var(--color-hairline)] text-right">
              <Link href="/research" className="underline hover:text-[var(--color-ink)] transition-colors font-serif text-xs">
                Explore single-stock research library &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
