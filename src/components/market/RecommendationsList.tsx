import type { MarketSnapshot } from '../../../lib/schemas';
import { ticker } from './Figure';

type StreetRec = MarketSnapshot['streetRecommendations'][number];
type RecAction = StreetRec['action'];

function actionStyle(action: RecAction): string {
  switch (action) {
    case 'buy':
    case 'accumulate':
      return 'bg-[var(--color-bullish-bg)] text-[var(--color-bullish)]';
    case 'sell':
    case 'reduce':
      return 'bg-[var(--color-bearish-bg)] text-[var(--color-bearish)]';
    case 'hold':
    default:
      return 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]';
  }
}

interface RecommendationsListProps {
  recs: MarketSnapshot['streetRecommendations'];
}

export default function RecommendationsList({ recs }: RecommendationsListProps) {
  if (recs.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-hairline)]">
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-4">
              Ticker
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-4">
              Brokerage
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-4">
              Action
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-3 pr-4">
              Target
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3">
              Rationale
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-hairline)]">
          {recs.map((rec, idx) => (
            <tr key={idx} className="group hover:bg-[var(--color-raised)] transition-colors">
              <td className="py-3 pr-4">
                <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                  {ticker(rec.ticker)}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className="font-sans text-sm text-[var(--color-muted)]">
                  {rec.brokerage}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block font-sans text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${actionStyle(rec.action)}`}
                >
                  {rec.action}
                </span>
              </td>
              <td className="py-3 pr-4 text-right">
                <span className="font-mono text-sm text-[var(--color-ink)]">
                  {rec.target !== undefined
                    ? rec.target.toLocaleString('en-IN', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : '—'}
                </span>
              </td>
              <td className="py-3 max-w-[260px]">
                <span className="font-sans text-sm text-[var(--color-muted)] truncate block">
                  {rec.rationale}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
