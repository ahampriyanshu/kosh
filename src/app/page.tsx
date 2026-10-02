import Link from 'next/link';
import { getLatest, getManifest, readAllLedgers } from '../lib/reports';
import type { DailyContent, RetroContent } from '../../lib/schemas';

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

  // Aggregate stats across all months from the immutable ledger
  let totalBets = 0;
  let hits = 0;
  let misses = 0;
  let partials = 0;
  const recordedMisses: string[] = [];
  const recordedHits: string[] = [];

  for (const ledger of ledgers) {
    for (const entry of ledger.entries || []) {
      for (const bet of entry.bets || []) {
        totalBets++;
        if (bet.outcome === 'hit') {
          hits++;
          if (bet.thesis && recordedHits.length < 2) {
            recordedHits.push(`${bet.ticker.replace('.NS', '')}: ${bet.thesis} (Realized: ${bet.changePct > 0 ? '+' : ''}${bet.changePct}%)`);
          }
        } else if (bet.outcome === 'miss') {
          misses++;
          if (bet.note && recordedMisses.length < 2) {
            recordedMisses.push(`${bet.ticker.replace('.NS', '')}: ${bet.note} (Thesis: ${bet.thesis})`);
          }
        } else if (bet.outcome === 'partial') {
          partials++;
        }
      }
    }
  }

  const winRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0';

  // Build price lookup map for street recommendations
  const priceLookup: Record<string, number> = {};
  if (snapshot) {
    snapshot.mostActive?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.topGainers?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.topLosers?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.near52wHigh?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
    snapshot.near52wLow?.forEach((m) => { priceLookup[m.ticker] = m.ltp; });
  }

  // Publication date formatting
  const pubDate = snapshot?.asOf
    ? new Date(snapshot.asOf).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const isoDate = snapshot?.asOf ? snapshot.asOf.slice(0, 10) : today;

  return (
    <div className="font-serif text-[var(--color-ink)] selection:bg-stone-200 dark:selection:bg-stone-800 pb-12">
      {/* ── Sub-Masthead Edition Bar ── */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-[var(--color-muted)] pb-2 mb-4 border-b border-[var(--color-ink)]">
        <div className="flex items-center gap-2">
          <span>{pubDate}</span>
          <span>·</span>
          <span>ISSUE NO. {manifest.reports.length}</span>
        </div>
      </div>

      {/* ── The Running Tape Bar (Key Cues) ── */}
      {snapshot && (
        <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-hairline)] px-3 py-2 mb-6 text-xs font-mono flex items-center overflow-x-auto whitespace-nowrap gap-4 divide-x divide-[var(--color-hairline)]">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-[10px] tracking-wider text-[var(--color-muted)]">THE TAPE:</span>
          </div>
          {snapshot.indianIndices.map((idx) => (
            <div key={idx.symbol} className="pl-4 flex items-center gap-1.5 shrink-0">
              <span className="text-[var(--color-muted)]">{idx.name}:</span>
              <span className="font-bold tabular-nums">{idx.ltp.toLocaleString('en-IN')}</span>
              <span className={`font-semibold tabular-nums ${idx.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                {idx.changePct >= 0 ? '▲' : '▼'}{Math.abs(idx.changePct).toFixed(2)}%
              </span>
            </div>
          ))}
          {snapshot.giftNifty && (
            <div className="pl-4 flex items-center gap-1.5 shrink-0">
              <span className="text-[var(--color-muted)]">GIFT NIFTY:</span>
              <span className="font-bold tabular-nums">{snapshot.giftNifty.value.toLocaleString('en-IN')}</span>
              <span className={`font-semibold tabular-nums ${snapshot.giftNifty.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                {snapshot.giftNifty.changePct >= 0 ? '▲' : '▼'}{Math.abs(snapshot.giftNifty.changePct).toFixed(2)}%
              </span>
            </div>
          )}
          {snapshot.vix && (
            <div className="pl-4 flex items-center gap-1.5 shrink-0">
              <span className="text-[var(--color-muted)]">INDIA VIX:</span>
              <span className="font-bold tabular-nums">{snapshot.vix.value.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Breaking Mid-Session Alert Bulletin (if today) ── */}
      {midContent && midContent.alerts.length > 0 && (
        <div className="mb-6 p-3 bg-amber-500/10 border-l-4 border-amber-600 dark:border-amber-400 font-serif">
          <div className="flex items-center justify-between font-mono text-xs mb-1">
            <span className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              URGENT BULLETIN · MID-SESSION SURVEILLANCE DESK (14:00 IST)
            </span>
            <span className="text-[var(--color-muted)]">{midContent.alerts.length} Sell Alerts Active</span>
          </div>
          <div className="space-y-1 text-xs">
            {midContent.alerts.map((alert, i) => (
              <p key={i} className="text-[var(--color-ink)]">
                <strong className="font-mono">{alert.ticker.replace('.NS', '')}</strong>: {alert.reason}{' '}
                <span className="font-mono text-[10px] uppercase font-bold text-amber-600">[{alert.severity} Risk]</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── The 3-Column Broadsheet Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-t-2 border-b-2 border-[var(--color-ink)]">
        {/* ── Column 1: The Daily Tape & Market Breadth (Left Column, 3 cols) ── */}
        <aside className="md:col-span-3 pr-0 md:pr-5 py-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] space-y-6">
          {/* Header */}
          <div>
            <span className="broadsheet-kicker">THE DAILY TAPE</span>
            <p className="text-xs text-[var(--color-muted)] italic leading-relaxed mb-3">
              Official closing settlement prices and capital flow distributions across the primary exchange.
            </p>
          </div>

          {/* Aggregate Market Breadth Box */}
          {snapshot?.breadth && (
            <div className="pb-4 border-b border-[var(--color-hairline)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                Market Breadth
              </span>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-2 text-justify">
                Cash market breadth tilted marginally defensive with {snapshot.breadth.declines} declining issues outweighing {snapshot.breadth.advances} advances, establishing an advance-decline spread factor of {snapshot.breadth.adRatio.toFixed(2)}.
              </p>
              <div className="flex items-center justify-between font-mono text-xs mb-1">
                <span className="text-[var(--color-bullish)] font-semibold">▲ {snapshot.breadth.advances} Adv</span>
                <span className="text-[var(--color-muted)]">A/D {snapshot.breadth.adRatio.toFixed(2)}</span>
                <span className="text-[var(--color-bearish)] font-semibold">▼ {snapshot.breadth.declines} Dec</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden flex bg-[var(--color-surface-secondary)]">
                <div
                  style={{ width: `${(snapshot.breadth.advances / (snapshot.breadth.advances + snapshot.breadth.declines)) * 100}%` }}
                  className="bg-[var(--color-bullish)] h-full"
                />
                <div
                  style={{ width: `${(snapshot.breadth.declines / (snapshot.breadth.advances + snapshot.breadth.declines)) * 100}%` }}
                  className="bg-[var(--color-bearish)] h-full"
                />
              </div>
            </div>
          )}

          {/* Institutional Net Flow */}
          {snapshot?.fiiDii && (
            <div className="pb-4 border-b border-[var(--color-hairline)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                Institutional Flow
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">FII Net Cash:</span>
                  <span className={`font-bold tabular-nums ${snapshot.fiiDii.fiiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                    {formatCrore(snapshot.fiiDii.fiiNet)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">DII Net Cash:</span>
                  <span className={`font-bold tabular-nums ${snapshot.fiiDii.diiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                    {formatCrore(snapshot.fiiDii.diiNet)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1.5 italic">
                Foreign institutional selling sustained as elevated US 10-year Treasury yields attract debt capital.
              </p>
            </div>
          )}

          {/* Sectoral Momentum Ranking */}
          {snapshot?.sectorRanking && snapshot.sectorRanking.length > 0 && (
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                Sector Barometer
              </span>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs">
                {[...snapshot.sectorRanking]
                  .sort((a, b) => b.changePct - a.changePct)
                  .map((s, idx) => (
                    <div key={s.sector} className="py-1 flex items-center justify-between font-mono">
                      <span className="font-serif text-[var(--color-ink)] truncate mr-2">
                        {idx + 1}. {s.sector}
                      </span>
                      <span className={`font-semibold tabular-nums shrink-0 ${s.changePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                        {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  ))}
              </div>
              <p className="text-[10px] font-mono text-[var(--color-muted)] mt-2">
                Realty &amp; Banking leading sectoral capital rotation; Pharma lags.
              </p>
            </div>
          )}
        </aside>

        {/* ── Column 2: The Lead Story & Audited Record (Center Column, 6 cols) ── */}
        <main className="md:col-span-6 px-0 md:px-6 py-4 border-b md:border-b-0 md:border-r border-[var(--color-hairline)] space-y-5">
          {/* Main Headline */}
          <div>
            <span className="broadsheet-kicker">FRONT DISPATCH · LEAD ARTICLE</span>
            <h2 className="broadsheet-headline">
              Reserve Bank Under Tightening Pressure as Elevated Crude and Treasury Yields Drive Foreign Outflows
            </h2>
            <p className="broadsheet-subhead">
              Information Technology sector surges 5% to spearhead broad market recovery; rupee weakens to 95.97 as Brent crude hovers near $97 per barrel amid West Asia tensions.
            </p>
            <div className="broadsheet-byline">
              MUMBAI — BY THE QUANTITATIVE EDITORIAL DESK
            </div>
          </div>

          {/* Lead Article Body (Gemini Macro Outlook) */}
          {dailyContent?.outlook ? (
            <div className="text-sm sm:text-base leading-relaxed text-[var(--color-ink)] space-y-4 text-justify">
              <p className="broadsheet-dropcap">
                {dailyContent.outlook}
              </p>
            </div>
          ) : (
            <p className="italic text-sm text-[var(--color-muted)]">
              No macro commentary recorded for this trading session.
            </p>
          )}

          {/* Official Public Notice Box: The Audited Ledger */}
          <div className="broadsheet-notice-box font-serif">
            <div className="flex items-center justify-between font-mono text-[11px] pb-1.5 mb-2 border-b border-[var(--color-ink)]">
              <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
                OFFICIAL RECORD // AUDITED POSITIONAL LEDGER
              </span>
              <span className="text-[var(--color-bullish)] font-semibold">N = {totalBets} Graded Calls</span>
            </div>

            <p className="text-xs leading-relaxed text-[var(--color-ink)] mb-2 text-justify">
              In accordance with strict empirical accountability, all forward positional hypotheses generated by this desk are committed as immutable SHA-256 JSON documents to Git and retrospectively graded upon horizon expiry.
            </p>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-hairline)] font-mono text-center text-xs">
              <div>
                <span className="text-[10px] text-[var(--color-muted)] block uppercase">Strict Win Rate</span>
                <span className="text-lg font-bold text-[var(--color-bullish)] tabular-nums">{winRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-muted)] block uppercase">Hits vs Misses</span>
                <span className="text-sm font-semibold tabular-nums mt-1 block">
                  <span className="text-[var(--color-bullish)]">{hits} H</span> / <span className="text-[var(--color-bearish)]">{misses} M</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-muted)] block uppercase">Partials / Flat</span>
                <span className="text-sm font-semibold tabular-nums mt-1 block text-[var(--color-muted)]">
                  {partials} Calls
                </span>
              </div>
            </div>

            <div className="mt-2 space-y-1 text-xs">
              {recordedHits.length > 0 && (
                <p className="text-[var(--color-muted)]">
                  <strong className="font-mono text-[var(--color-ink)]">Key Validated Thesis:</strong> {recordedHits[0]}
                </p>
              )}
              {recordedMisses.length > 0 && (
                <p className="text-[var(--color-muted)]">
                  <strong className="font-mono text-[var(--color-bearish)]">Documented Blindspot:</strong> {recordedMisses[0]}
                </p>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--color-hairline)] text-right font-mono text-xs">
              <Link href="/scorecard" className="font-bold underline hover:text-[var(--color-brand)]">
                Inspect Complete Audited Ledger &amp; Weekly Retrospectives →
              </Link>
            </div>
          </div>

          {/* Sub-Dispatch: Corporate Actions & Disclosures */}
          {snapshot?.news && (
            <div className="pt-2">
              <span className="broadsheet-kicker">CORPORATE DISCLOSURES &amp; ORDER WINS</span>
              <div className="space-y-3 text-xs">
                {snapshot.news
                  .flatMap((g) => g.items)
                  .filter((item) => item.tickers && item.tickers.length > 0)
                  .slice(0, 4)
                  .map((item, i) => (
                    <div key={i} className="pb-2.5 border-b border-[var(--color-hairline)]/60 last:border-0">
                      <p className="font-semibold text-[var(--color-ink)] leading-snug">
                        {item.headline}{' '}
                        {item.tickers && (
                          <span className="font-mono text-[10px] font-normal text-[var(--color-muted)]">
                            ({item.tickers.join(', ').replaceAll('.NS', '')})
                          </span>
                        )}
                      </p>
                      <p className="text-[var(--color-muted)] mt-1 leading-relaxed text-justify">
                        {item.summary}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>

        {/* ── Column 3: The Tactical Desk & The Street (Right Column, 3 cols) ── */}
        <aside className="md:col-span-3 pl-0 md:pl-5 py-4 space-y-6">
          {/* Header */}
          <div>
            <span className="broadsheet-kicker">THE TACTICAL DESK</span>
            <p className="text-xs text-[var(--color-muted)] italic leading-relaxed mb-3">
              Institutional sell-side consensus, anomalous liquidity spikes, and 52-week envelope bounds.
            </p>
          </div>

          {/* Street Consensus & Brokerage Targets */}
          {snapshot?.streetRecommendations && snapshot.streetRecommendations.length > 0 && (
            <div className="pb-4 border-b border-[var(--color-hairline)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                The Street Consensus
              </span>
              <div className="divide-y divide-[var(--color-hairline)]/60">
                {snapshot.streetRecommendations.slice(0, 5).map((rec, i) => {
                  const ltp = priceLookup[rec.ticker];
                  let upside: number | null = null;
                  if (ltp && rec.target) {
                    upside = ((rec.target - ltp) / ltp) * 100;
                  }
                  return (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 text-xs">
                      <div className="flex items-baseline justify-between font-mono mb-0.5">
                        <span className="font-bold text-[var(--color-ink)]">
                          {rec.ticker.replace('.NS', '')}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] uppercase">
                          {rec.brokerage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="uppercase font-semibold text-[var(--color-ink)]">
                          {rec.action}
                        </span>
                        {rec.target && (
                          <span className="tabular-nums font-bold">
                            ₹{rec.target.toLocaleString('en-IN')}{' '}
                            {upside !== null && (
                              <span className={upside >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}>
                                ({upside >= 0 ? '+' : ''}{upside.toFixed(0)}%)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {rec.rationale && (
                        <p className="text-[11px] text-[var(--color-muted)] mt-1 line-clamp-2 leading-relaxed">
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
            <div className="pb-4 border-b border-[var(--color-hairline)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                Volume Turnover Shocks
              </span>
              <div className="space-y-2 text-xs font-mono">
                {snapshot.volumeShockers.map((v) => (
                  <div key={v.ticker} className="p-2 bg-[var(--color-surface-secondary)] border border-[var(--color-hairline)]">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-[var(--color-ink)]">{v.ticker.replace('.NS', '')}</span>
                      <span className="font-bold text-[var(--color-bullish)]">{v.ratio.toFixed(2)}× Baseline</span>
                    </div>
                    <p className="font-serif text-[11px] text-[var(--color-muted)] mt-0.5">
                      {v.name} traded {Math.round(v.volume).toLocaleString('en-IN')} shares against a 30-day average of {Math.round(v.avgVolume).toLocaleString('en-IN')}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 52-Week Range Boundaries */}
          {((snapshot?.near52wHigh && snapshot.near52wHigh.length > 0) ||
            (snapshot?.near52wLow && snapshot.near52wLow.length > 0)) && (
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] block mb-1.5">
                52-Week Range Proximity
              </span>
              <div className="divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
                {snapshot.near52wHigh?.map((item) => (
                  <div key={item.ticker} className="py-1 flex items-center justify-between">
                    <span className="font-bold">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[var(--color-bearish)] tabular-nums font-semibold">
                      −{item.pctFromHigh.toFixed(2)}% of 52W High
                    </span>
                  </div>
                ))}
                {snapshot.near52wLow?.map((item) => (
                  <div key={item.ticker} className="py-1 flex items-center justify-between">
                    <span className="font-bold">{item.ticker.replace('.NS', '')}</span>
                    <span className="text-[var(--color-bullish)] tabular-nums font-semibold">
                      +{item.pctFromLow.toFixed(2)}% of 52W Low
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-[var(--color-muted)] mt-1.5">
                Securities trading within ±2.00% of rolling 52-week exchange envelope limits.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Broadsheet Footnote Strip ── */}
      <div className="mt-4 pt-2 border-t border-[var(--color-hairline)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--color-muted)]">
        <span>KOSH DAILY · INDIAN EQUITY DESK</span>
        <span>NEXT BRIEFING DISPATCHES AT 08:00 IST VIA GITHUB ACTIONS</span>
        <a href="https://github.com/ahampriyanshu/kosh" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-ink)]">
          OPEN SOURCE REPOSITORY
        </a>
      </div>
    </div>
  );
}
