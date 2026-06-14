import { getWatchlist } from '../../lib/reports';

export default async function WatchlistPage() {
  const watchlist = await getWatchlist();
  const stocks = watchlist.stocks;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Portfolio
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Watchlist
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {stocks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">Watchlist is empty.</p>
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
                      {stock.ticker.replace('.NS', '')}
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
          <p className="mt-4 font-mono text-xs text-[var(--color-faint)]">
            {stocks.length} stock{stocks.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
      )}
    </div>
  );
}
