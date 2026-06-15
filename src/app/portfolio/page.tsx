import { readPortfolio, getWatchlist } from '../../lib/reports';
import { ticker, Section } from '../../components/market/Figure';

export default async function PortfolioPage() {
  const [portfolio, watchlist] = await Promise.all([readPortfolio(), getWatchlist()]);
  const holdings = portfolio.holdings;
  const stocks = watchlist.stocks;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Holdings
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Portfolio
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {/* Holdings table */}
      {holdings.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">
            No holdings — commit data/portfolio.json
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {portfolio.asOf && (
            <p className="font-mono text-xs text-[var(--color-faint)] mb-3">
              as of {portfolio.asOf}
            </p>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-hairline)]">
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-6 w-32">
                  Ticker
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-6">
                  Name
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-6 w-24">
                  Qty
                </th>
                <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 w-32">
                  Avg Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {holdings.map((h) => (
                <tr key={h.ticker} className="group hover:bg-[var(--color-raised)] transition-colors">
                  <td className="py-3.5 pr-6">
                    <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                      {ticker(h.ticker)}
                    </span>
                  </td>
                  <td className="py-3.5 pr-6">
                    <span className="font-sans text-sm text-[var(--color-muted)]">{h.name}</span>
                  </td>
                  <td className="py-3.5 pr-6 text-right">
                    <span className="font-mono text-sm text-[var(--color-ink)]">{h.qty}</span>
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="font-mono text-sm text-[var(--color-ink)]">
                      ₹{h.avgCost.toLocaleString('en-IN')}
                    </span>
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

      {/* Watchlist section */}
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
                        <span className="font-sans text-xs text-[var(--color-faint)] italic">—</span>
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
