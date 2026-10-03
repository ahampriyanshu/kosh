import type { WeeklyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';
import { ReportSection } from './ui/ReportSection';

interface WeeklyViewProps {
  content: WeeklyContent;
}

export function WeeklyView({ content }: WeeklyViewProps) {
  const multiAsset = content.multiAssetScorecard ?? [];
  const sectorGrowth = content.sectorGrowth ?? [];
  const flows = content.fiiDiiWeekly;
  const portfolioFocus = content.portfolioFocus ?? [];
  const ipos = content.iposInFocus ?? [];
  const themes = content.macroThemes?.length ? content.macroThemes : content.themes ?? [];
  const legacyBets = content.positionalBets ?? [];

  return (
    <div className="space-y-10 font-serif text-[var(--color-ink)]">
      {/* 1. Multi-Asset Performance Scorecard */}
      {multiAsset.length > 0 && (
        <section className="space-y-3">
          <div className="pb-1.5 border-b border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="font-serif font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Multi-Asset Performance Scorecard
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-mono">7-Day Benchmark Ledger</span>
          </div>

          <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Asset Class</th>
                  <th className="py-2.5 px-3 font-bold">Benchmark</th>
                  <th className="py-2.5 px-3 text-right font-bold">Close Price</th>
                  <th className="py-2.5 px-3 text-right font-bold">7D Return</th>
                  <th className="py-2.5 px-3 min-w-[200px] font-bold">Macro Context</th>
                </tr>
              </thead>
              <tbody>
                {multiAsset.map((item) => {
                  const isPos = item.returnPct >= 0;
                  return (
                    <tr key={item.symbol} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                      <td className="py-2 px-3 font-bold text-[var(--color-ink)]">{item.asset}</td>
                      <td className="py-2 px-3 text-[10px] text-[var(--color-muted)]">{item.symbol}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-[var(--color-ink)] font-semibold">
                        {item.close.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums font-bold ${
                          isPos ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                        }`}
                      >
                        {isPos ? '+' : ''}{item.returnPct.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-[11px] font-serif text-[var(--color-muted)] leading-relaxed">
                        {item.context || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2. Sector Growth & Relative Rotation */}
      {sectorGrowth.length > 0 && (
        <section className="space-y-3">
          <div className="pb-1.5 border-b border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="font-serif font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Sector Growth &amp; Relative Rotation
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-mono">Ranked Weekly Performance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-3 text-xs font-mono">
              <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block pb-2">
                Top Performing Sectors
              </span>
              {sectorGrowth.slice(0, Math.ceil(sectorGrowth.length / 2)).map((s) => (
                <div key={s.sector} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-muted)] w-4 text-right">{s.rank}.</span>
                    <span className="font-bold text-[var(--color-ink)]">{s.sector}</span>
                  </div>
                  <span
                    className={`font-bold tabular-nums ${
                      s.weeklyReturnPct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                    }`}
                  >
                    {s.weeklyReturnPct >= 0 ? '+' : ''}{s.weeklyReturnPct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-3 text-xs font-mono">
              <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block pb-2">
                Lagging &amp; Defensive Sectors
              </span>
              {sectorGrowth.slice(Math.ceil(sectorGrowth.length / 2)).map((s) => (
                <div key={s.sector} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-muted)] w-4 text-right">{s.rank}.</span>
                    <span className="font-bold text-[var(--color-ink)]">{s.sector}</span>
                  </div>
                  <span
                    className={`font-bold tabular-nums ${
                      s.weeklyReturnPct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                    }`}
                  >
                    {s.weeklyReturnPct >= 0 ? '+' : ''}{s.weeklyReturnPct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Institutional Flows (FII vs DII Inflows / Outflows) */}
      {flows && (
        <section className="space-y-3">
          <div className="pb-1.5 border-b border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="font-serif font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Institutional Cash Flow Dynamics
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-mono">Weekly Cumulative Inflow / Outflow</span>
          </div>

          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 text-center font-mono">
              <div className="py-2 sm:py-0 px-3">
                <span className="text-[10px] text-[var(--color-muted)] uppercase block mb-1">FII Net Cash</span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    flows.fiiNetCrore >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {flows.fiiNetCrore >= 0 ? '+' : '−'}₹{Math.abs(flows.fiiNetCrore).toLocaleString('en-IN')} cr
                </span>
              </div>
              <div className="py-2 sm:py-0 px-3">
                <span className="text-[10px] text-[var(--color-muted)] uppercase block mb-1">DII Net Cash</span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    flows.diiNetCrore >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {flows.diiNetCrore >= 0 ? '+' : '−'}₹{Math.abs(flows.diiNetCrore).toLocaleString('en-IN')} cr
                </span>
              </div>
              <div className="py-2 sm:py-0 px-3">
                <span className="text-[10px] text-[var(--color-muted)] uppercase block mb-1">Net Institutional Flow</span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    flows.netInstitutionalCrore >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {flows.netInstitutionalCrore >= 0 ? '+' : '−'}₹{Math.abs(flows.netInstitutionalCrore).toLocaleString('en-IN')} cr
                </span>
              </div>
            </div>
            {flows.summary && (
              <p className="mt-4 pt-3 border-t border-[var(--color-hairline)] text-xs text-[var(--color-muted)] font-serif leading-relaxed text-justify">
                {flows.summary}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 4. Portfolio Focus & Company Catalyst Surveillance */}
      {portfolioFocus.length > 0 && (
        <section className="space-y-3">
          <div className="pb-1.5 border-b border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="font-serif font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Portfolio Holdings &amp; Company Catalyst Radar
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-mono">Holding Events &amp; Risk Disclosures</span>
          </div>

          <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Company</th>
                  <th className="py-2.5 px-3 font-bold min-w-[220px]">Recent News &amp; Events</th>
                  <th className="py-2.5 px-3 font-bold min-w-[220px]">Upcoming Catalysts &amp; Earnings</th>
                  <th className="py-2.5 px-3 font-bold">Risk Assessment</th>
                </tr>
              </thead>
              <tbody>
                {portfolioFocus.map((item) => (
                  <tr key={item.ticker} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                    <td className="py-2.5 px-3 align-top whitespace-nowrap">
                      <span className="font-bold text-[var(--color-ink)] block">{item.ticker.replace('.NS', '')}</span>
                      <span className="text-[10px] text-[var(--color-muted)] font-serif block">{item.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-serif text-[11px] text-[var(--color-muted)] leading-relaxed align-top">
                      {item.recentEvents}
                    </td>
                    <td className="py-2.5 px-3 font-serif text-[11px] text-[var(--color-ink)] leading-relaxed align-top">
                      {item.upcomingCatalysts}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[var(--color-muted)] align-top whitespace-nowrap">
                      {item.riskNote || 'Monitored'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. IPOs in Focus (The Authoritative Weekly Primary Market Calendar) */}
      {ipos.length > 0 && (
        <section className="space-y-3">
          <div className="pb-1.5 border-b border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono">
            <span className="font-serif font-bold uppercase tracking-wider text-[var(--color-ink)]">
              IPOs in Focus · Primary Market Calendar
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-mono">Weekly Primary Market Intelligence</span>
          </div>

          <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Company</th>
                  <th className="py-2.5 px-3 font-bold">Price Band</th>
                  <th className="py-2.5 px-3 font-bold">Issue Size</th>
                  <th className="py-2.5 px-3 font-bold">GMP</th>
                  <th className="py-2.5 px-3 font-bold">Subscription</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {ipos.map((ipo, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                    <td className="py-2 px-3 font-bold text-[var(--color-ink)]">
                      {ipo.company}
                      {ipo.listingDate && (
                        <span className="text-[10px] text-[var(--color-muted)] font-normal block">
                          Listing: {ipo.listingDate}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[var(--color-muted)]">{ipo.priceBand}</td>
                    <td className="py-2 px-3 text-[var(--color-muted)]">{ipo.issueSize}</td>
                    <td className="py-2 px-3 font-semibold text-[var(--color-bullish)]">
                      {ipo.gmp} ({ipo.gmpPct})
                    </td>
                    <td className="py-2 px-3 font-bold text-[var(--color-ink)]">{ipo.subscription}</td>
                    <td className="py-2 px-3 text-center uppercase text-[10px] font-bold text-[var(--color-muted)]">
                      {ipo.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Macro Themes & Week-Ahead Strategic Outlook */}
      {themes.length > 0 && (
        <ReportSection title="Week-Ahead Macro Strategy &amp; Key Themes">
          <ul className="space-y-2">
            {themes.map((theme, i) => (
              <li key={i} className="text-sm text-[var(--color-muted)] leading-relaxed font-serif text-justify">
                {theme}
              </li>
            ))}
          </ul>
        </ReportSection>
      )}

      {/* Backward Compatibility: Legacy Positional Bets on older archived reports */}
      {legacyBets.length > 0 && multiAsset.length === 0 && (
        <ReportSection title="Historical Positional Archive">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border border-[var(--color-hairline)]">
              <thead className="bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)] text-[10px] uppercase text-[var(--color-muted)]">
                <tr>
                  <th className="py-2 px-3 text-left">Ticker</th>
                  <th className="py-2 px-3 text-left">Action</th>
                  <th className="py-2 px-3 text-left">Thesis</th>
                </tr>
              </thead>
              <tbody>
                {legacyBets.map((bet) => (
                  <tr key={bet.ticker}>
                    <td className="py-2 px-3 font-bold">{bet.ticker.replace('.NS', '')}</td>
                    <td className="py-2 px-3 uppercase">{bet.action}</td>
                    <td className="py-2 px-3 text-[var(--color-muted)] font-serif">{bet.thesis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {/* Market Microstructure Dashboard */}
      <MarketDashboard snapshot={content.snapshot} />
    </div>
  );
}
