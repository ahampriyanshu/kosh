import { readPortfolio, getWatchlist } from '../../lib/reports';
import { ticker, Section } from '../../components/market/Figure';
import { Pct } from '../../components/Pct';

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function price(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAsOf(value: string): string {
  if (!value) return 'Not synced';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }) + ' IST';
  } catch {
    return value;
  }
}

function isStale(value: string): boolean {
  if (!value) return true;
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return true;
  return Date.now() - then > 36 * 60 * 60 * 1000;
}

function StatBlock({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'gain' | 'loss' }) {
  const color =
    tone === 'gain'
      ? 'text-[var(--color-bullish)]'
      : tone === 'loss'
      ? 'text-[var(--color-bearish)]'
      : 'text-[var(--color-ink)]';

  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] rounded-lg px-4 py-3">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-1">
        {label}
      </p>
      <p className={`font-mono text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export default async function PortfolioPage() {
  const [portfolio, watchlist] = await Promise.all([readPortfolio(), getWatchlist()]);
  const holdings = portfolio.holdings;
  const stocks = watchlist.stocks;
  const stale = isStale(portfolio.asOf);
  const pnlTone = portfolio.summary.pnl > 0 ? 'gain' : portfolio.summary.pnl < 0 ? 'loss' : 'neutral';
  const dayTone = portfolio.summary.dayChange > 0 ? 'gain' : portfolio.summary.dayChange < 0 ? 'loss' : 'neutral';

  return (
    <div>
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Holdings
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Portfolio
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <p className="font-mono text-xs text-[var(--color-faint)]">
          {portfolio.source === 'kite' ? 'Kite snapshot' : 'Manual snapshot'} - {formatAsOf(portfolio.asOf)}
        </p>
        {stale && (
          <span className="font-mono text-xs text-[var(--color-bearish)] bg-[var(--color-bearish-bg)] border border-[var(--color-bearish-bg)] rounded px-2 py-1">
            stale
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatBlock label="Current value" value={money(portfolio.summary.currentValue)} />
        <StatBlock label="Invested" value={money(portfolio.summary.investedValue)} />
        <StatBlock label="Total P&L" value={`${money(portfolio.summary.pnl)} (${portfolio.summary.pnlPct.toFixed(2)}%)`} tone={pnlTone} />
        <StatBlock label="Day P&L" value={`${money(portfolio.summary.dayChange)} (${portfolio.summary.dayChangePct.toFixed(2)}%)`} tone={dayTone} />
      </div>

      {holdings.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">
            No holdings synced.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-[var(--color-hairline)]">
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-6">
                  Ticker
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6">
                  Qty
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6">
                  Avg
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6">
                  LTP
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6">
                  Value
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6">
                  P&L
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6">
                  Day
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {holdings.map((h) => (
                <tr key={h.ticker} className="group hover:bg-[var(--color-raised)] transition-colors">
                  <td className="py-3.5 pr-6">
                    <div>
                      <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                        {ticker(h.ticker)}
                      </span>
                      <p className="font-sans text-xs text-[var(--color-faint)] mt-0.5">{h.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-ink)] tabular-nums">
                    {h.quantity.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-muted)] tabular-nums">
                    {price(h.averagePrice)}
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-ink)] tabular-nums">
                    {price(h.lastPrice)}
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-ink)] tabular-nums">
                    {money(h.currentValue)}
                  </td>
                  <td className="py-3.5 pr-6 text-right">
                    <div className="font-mono text-sm text-[var(--color-ink)] tabular-nums">{money(h.pnl)}</div>
                    <Pct value={h.pnlPct} className="justify-end" />
                  </td>
                  <td className="py-3.5 pr-6 text-right">
                    <div className="font-mono text-sm text-[var(--color-ink)] tabular-nums">{money(h.dayChange * h.quantity)}</div>
                    <Pct value={h.dayChangePct} className="justify-end" />
                  </td>
                  <td className="py-3.5 text-right font-mono text-sm text-[var(--color-muted)] tabular-nums">
                    {h.allocationPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-mono text-xs text-[var(--color-faint)]">
            {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <Section title="Watchlist" count={stocks.length}>
        {stocks.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
            <p className="font-display text-lg text-[var(--color-faint)]">Watchlist is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-6 w-32">
                    Ticker
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-6">
                    Name
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {stocks.map((stock) => (
                  <tr key={stock.ticker} className="group hover:bg-[var(--color-raised)] transition-colors">
                    <td className="py-3.5 pr-6">
                      <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                        {ticker(stock.ticker)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6">
                      <span className="font-sans text-sm text-[var(--color-muted)]">{stock.name}</span>
                    </td>
                    <td className="py-3.5">
                      {stock.notes ? (
                        <span className="font-sans text-sm text-[var(--color-muted)]">{stock.notes}</span>
                      ) : (
                        <span className="font-sans text-xs text-[var(--color-faint)] italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
