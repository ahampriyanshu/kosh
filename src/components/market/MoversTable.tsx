import { Pct, ticker } from './Figure';

interface MoverRow {
  ticker: string;
  name: string;
  ltp: number;
  changePct: number;
  volume?: number;
}

interface MoversTableProps {
  title: string;
  rows: MoverRow[];
}

export default function MoversTable({ rows }: MoversTableProps) {
  if (rows.length === 0) return null;

  const hasVolume = rows.some((r) => r.volume !== undefined);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-hairline)]">
            <th className="font-sans text-xs font-medium text-[var(--color-faint)] text-left py-3 pr-4">
              Ticker
            </th>
            <th className="font-sans text-xs font-medium text-[var(--color-faint)] text-left py-3 pr-4">
              Name
            </th>
            <th className="font-sans text-xs font-medium text-[var(--color-faint)] text-right py-3 pr-4">
              LTP
            </th>
            <th className="font-sans text-xs font-medium text-[var(--color-faint)] text-right py-3 pr-4">
              Change
            </th>
            {hasVolume && (
              <th className="font-sans text-xs font-medium text-[var(--color-faint)] text-right py-3">
                Volume
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className="group border-b border-[var(--color-hairline)] transition-colors last:border-0 hover:bg-[var(--color-raised)]">
              <td className="py-3 pr-4">
                <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                  {ticker(row.ticker)}
                </span>
              </td>
              <td className="py-3 pr-4 max-w-[180px]">
                <span className="font-sans text-sm text-[var(--color-muted)] truncate block">
                  {row.name}
                </span>
              </td>
              <td className="py-3 pr-4 text-right">
                <span className="font-mono text-sm text-[var(--color-ink)]">
                  {row.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </td>
              <td className="py-3 pr-4 text-right">
                <Pct value={row.changePct} />
              </td>
              {hasVolume && (
                <td className="py-3 text-right">
                  <span className="font-mono text-sm text-[var(--color-ink)]">
                    {row.volume !== undefined
                      ? row.volume >= 1_000_000
                        ? `${(row.volume / 1_000_000).toFixed(2)}M`
                        : row.volume >= 1_000
                          ? `${(row.volume / 1_000).toFixed(1)}K`
                          : row.volume.toLocaleString()
                      : '—'}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
