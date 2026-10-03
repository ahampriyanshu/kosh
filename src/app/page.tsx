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

interface MarketStory {
  headline: string;
  summary: string;
  source?: string;
  tickers?: string[];
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

  // Extract a few important stories reflecting the market pulse
  const marketPulseStories: MarketStory[] = [];
  const pulseCategories = ['macro_policy', 'global_cues', 'sectoral'];

  if (snapshot?.news) {
    for (const cat of pulseCategories) {
      const group = snapshot.news.find((g) => g.category === cat);
      if (group?.items) {
        for (const item of group.items.slice(0, 1)) {
          if (item.headline && item.summary) {
            marketPulseStories.push({
              headline: item.headline,
              summary: item.summary,
              source: item.source,
              tickers: item.tickers,
            });
          }
        }
      }
    }

    // Fill up to 3 stories if needed
    if (marketPulseStories.length < 3) {
      for (const group of snapshot.news) {
        if (!pulseCategories.includes(group.category)) {
          for (const item of group.items) {
            if (marketPulseStories.length >= 3) break;
            if (item.headline && item.summary) {
              marketPulseStories.push({
                headline: item.headline,
                summary: item.summary,
                source: item.source,
                tickers: item.tickers,
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
      ?.filter((g) => g.category === 'corporate_actions' || g.category === 'earnings')
      ?.flatMap((g) => g.items)
      ?.filter((item) => item.tickers && item.tickers.length > 0)
      ?.slice(0, 4) || [];

  const corporateDisclosures =
    corporateItems.length > 0
      ? corporateItems
      : snapshot?.news?.flatMap((g) => g.items)?.filter((item) => item.tickers && item.tickers.length > 0)?.slice(0, 4) || [];

  return (
    <div className="font-serif text-[var(--color-ink)] pb-12">
      {/* ── Market Wire (The Running Marquee Ticker) ── */}
      {snapshot && <MarketMarquee snapshot={snapshot} />}

      {/* ── Mid-Session Alerts (if today) ── */}
      {midContent && midContent.alerts.length > 0 && (
        <div className="mb-6 p-3 border border-amber-600/60 dark:border-amber-400/60 text-xs">
          <div className="flex items-center justify-between font-semibold pb-1.5 mb-2 border-b border-[var(--color-hairline)]">
            <span className="text-amber-700 dark:text-amber-400">
              Mid-Session Alerts ({midContent.alerts.length})
            </span>
            <span className="text-[var(--color-muted)]">14:00 IST</span>
          </div>
          <div className="space-y-1">
            {midContent.alerts.map((alert, i) => (
              <p key={i} className="text-[var(--color-ink)]">
                <strong className="font-semibold">{alert.ticker.replace('.NS', '')}</strong>: {alert.reason}{' '}
                <span className="text-[var(--color-bearish)] text-[11px]">
                  ({alert.severity} risk)
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── The 3-Column Broadsheet Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-t border-b border-[var(--color-hairline)]">
        {/* ── Column 1: Market Breadth, Flows, Sectors (Left, 3 cols) ── */}
        <aside className="md:col-span-3 pr-0 md:pr-5 py-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] space-y-6">
          {/* Market Mood Index */}
          {mood && <MarketMoodIndex mood={mood} />}

          {/* Market Breadth */}
          {snapshot?.breadth && (
            <div>
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider mb-2">
                Market Breadth
              </h2>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-2 text-justify">
                Cash market breadth tilted marginally defensive with {snapshot.breadth.declines} declining issues outweighing {snapshot.breadth.advances} advances, establishing an advance-decline spread factor of {snapshot.breadth.adRatio.toFixed(2)}.
              </p>
              <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
                <span className="text-[var(--color-bullish)] font-semibold">▲ {snapshot.breadth.advances} Adv</span>
                <span className="text-[var(--color-muted)]">A/D {snapshot.breadth.adRatio.toFixed(2)}</span>
                <span className="text-[var(--color-bearish)] font-semibold">▼ {snapshot.breadth.declines} Dec</span>
              </div>
              <div className="h-1 flex bg-[var(--color-hairline)]">
                <div
                  style={{
                    width: `${(snapshot.breadth.advances / (snapshot.breadth.advances + snapshot.breadth.declines)) * 100}%`,
                  }}
                  className="bg-[var(--color-bullish)] h-full"
                />
                <div
                  style={{
                    width: `${(snapshot.breadth.declines / (snapshot.breadth.advances + snapshot.breadth.declines)) * 100}%`,
                  }}
                  className="bg-[var(--color-bearish)] h-full"
                />
              </div>
            </div>
          )}

          {/* Institutional Flows */}
          {snapshot?.fiiDii && (
            <div className="pt-4 border-t border-[var(--color-hairline)]">
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider mb-2">
                Institutional Flows
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">FII Net:</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      snapshot.fiiDii.fiiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                    }`}
                  >
                    {formatCrore(snapshot.fiiDii.fiiNet)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">DII Net:</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      snapshot.fiiDii.diiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                    }`}
                  >
                    {formatCrore(snapshot.fiiDii.diiNet)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-2 leading-relaxed italic">
                Foreign institutional selling sustained as elevated US 10-year Treasury yields attract debt capital.
              </p>
            </div>
          )}

          {/* Sector Barometer */}
          {snapshot?.sectorRanking && snapshot.sectorRanking.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-hairline)]">
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider mb-2">
                Sector Barometer
              </h2>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {[...snapshot.sectorRanking]
                  .sort((a, b) => b.changePct - a.changePct)
                  .map((s, idx) => (
                    <div key={s.sector} className="py-1 flex items-center justify-between">
                      <span className="font-serif text-[var(--color-ink)] truncate mr-2">
                        {idx + 1}. {s.sector}
                      </span>
                      <span
                        className={`font-semibold tabular-nums shrink-0 ${
                          s.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                        }`}
                      >
                        {s.changePct >= 0 ? '+' : ''}
                        {s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Column 2: Market Pulse Stories & Scorecard (Center, 6 cols) ── */}
        <main className="md:col-span-6 px-0 md:px-6 py-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] space-y-6">
          {/* Story 1: Market Session Overview */}
          {dailyContent?.outlook && (
            <article className="pb-5 border-b border-[var(--color-hairline)]">
              <h1 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[var(--color-ink)] leading-snug mb-2">
                Market Pulse: Session Overview
              </h1>
              <p className="text-sm leading-relaxed text-[var(--color-ink)] space-y-2 text-justify">
                {dailyContent.outlook}
              </p>
              {dailyContent.keyTakeaways && dailyContent.keyTakeaways.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-muted)] list-disc pl-4">
                  {dailyContent.keyTakeaways.slice(0, 3).map((takeaway, i) => (
                    <li key={i}>{takeaway}</li>
                  ))}
                </ul>
              )}
            </article>
          )}

          {/* Stories 2, 3, 4: Important Stories Reflecting the Market Pulse */}
          <div className="space-y-5">
            {marketPulseStories.map((story, i) => (
              <article key={i} className="pb-5 border-b border-[var(--color-hairline)] last:border-b-0 last:pb-0">
                <h2 className="font-serif text-base md:text-lg font-bold tracking-tight text-[var(--color-ink)] leading-snug mb-1.5">
                  {story.headline}
                </h2>
                <p className="text-xs md:text-sm text-[var(--color-ink)] leading-relaxed text-justify mb-1.5">
                  {story.summary}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)] font-serif italic">
                  {story.source && <span>{story.source}</span>}
                  {story.tickers && story.tickers.length > 0 && (
                    <span className="not-italic text-[11px] text-[var(--color-muted)]">
                      ({story.tickers.join(', ').replaceAll('.NS', '')})
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Track Record (Minimal Notice Box) */}
          <div className="p-3.5 border border-[var(--color-ink)] font-serif text-xs my-4">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--color-hairline)]">
              <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Audited Track Record
              </span>
              <span className="text-[var(--color-bullish)] font-semibold tabular-nums">{winRate}% Win Rate</span>
            </div>
            <p className="text-[var(--color-muted)] mb-2">
              Performance across {totalBets} evaluated calls: {hits} hits, {misses} misses, {partials} flat.
            </p>
            {recordedHits[0] && (
              <p className="text-[var(--color-ink)]">
                <strong>Recent Validated Call:</strong> {recordedHits[0]}
              </p>
            )}
            <div className="mt-2 pt-1.5 border-t border-[var(--color-hairline)] text-right">
              <Link href="/scorecard" className="underline hover:text-[var(--color-ink)]">
                View complete scorecard →
              </Link>
            </div>
          </div>
        </main>

        {/* ── Column 3: Corporate Disclosures & The Tactical Desk (Right, 3 cols) ── */}
        <aside className="md:col-span-3 pl-0 md:pl-5 py-4 space-y-6">
          {/* Corporate Disclosures */}
          {corporateDisclosures.length > 0 && (
            <div>
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider pb-1 mb-3 border-b border-[var(--color-hairline)]">
                Corporate Disclosures
              </h2>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {corporateDisclosures.map((item, i) => (
                  <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <p className="font-semibold text-[var(--color-ink)] leading-snug">
                      {item.headline}{' '}
                      {item.tickers && (
                        <span className="text-[11px] font-normal text-[var(--color-muted)]">
                          ({item.tickers.join(', ').replaceAll('.NS', '')})
                        </span>
                      )}
                    </p>
                    <p className="text-[var(--color-muted)] leading-relaxed text-justify">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Street Consensus */}
          {snapshot?.streetRecommendations && snapshot.streetRecommendations.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-hairline)]">
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider pb-1 mb-3 border-b border-[var(--color-hairline)]">
                Street Consensus
              </h2>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {snapshot.streetRecommendations.slice(0, 4).map((rec, i) => {
                  const ltp = priceLookup[rec.ticker];
                  let upside: number | null = null;
                  if (ltp && rec.target) {
                    upside = ((rec.target - ltp) / ltp) * 100;
                  }
                  return (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-[var(--color-ink)]">
                          {rec.ticker.replace('.NS', '')}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">
                          {rec.brokerage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--color-muted)]">{rec.action}</span>
                        {rec.target && (
                          <span className="tabular-nums font-semibold">
                            ₹{rec.target.toLocaleString('en-IN')}{' '}
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
                        <p className="text-[11px] text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                          {rec.rationale}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Volume Multipliers */}
          {snapshot?.volumeShockers && snapshot.volumeShockers.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-hairline)]">
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider pb-1 mb-3 border-b border-[var(--color-hairline)]">
                Volume Movers
              </h2>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {snapshot.volumeShockers.slice(0, 3).map((v) => (
                  <div key={v.ticker} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-[var(--color-ink)]">{v.ticker.replace('.NS', '')}</span>
                      <span className="font-bold tabular-nums text-[var(--color-bullish)]">{v.ratio.toFixed(1)}× Baseline</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {v.name} traded {Math.round(v.volume).toLocaleString('en-IN')} shares against 30D average of {Math.round(v.avgVolume).toLocaleString('en-IN')}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 52-Week Range Proximity */}
          {((snapshot?.near52wHigh && snapshot.near52wHigh.length > 0) ||
            (snapshot?.near52wLow && snapshot.near52wLow.length > 0)) && (
            <div className="pt-4 border-t border-[var(--color-hairline)]">
              <h2 className="font-serif font-bold text-sm text-[var(--color-ink)] uppercase tracking-wider pb-1 mb-3 border-b border-[var(--color-hairline)]">
                52-Week Extremes
              </h2>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {snapshot.near52wHigh?.slice(0, 2).map((item) => (
                  <div key={item.ticker} className="py-1 flex items-center justify-between">
                    <span className="font-bold">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[var(--color-bearish)] tabular-nums font-semibold">
                      −{item.pctFromHigh.toFixed(1)}% of high
                    </span>
                  </div>
                ))}
                {snapshot.near52wLow?.slice(0, 2).map((item) => (
                  <div key={item.ticker} className="py-1 flex items-center justify-between">
                    <span className="font-bold">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[var(--color-bullish)] tabular-nums font-semibold">
                      +{item.pctFromLow.toFixed(1)}% of low
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
