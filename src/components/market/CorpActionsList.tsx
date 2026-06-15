import type { MarketSnapshot } from '../../../lib/schemas';
import { ticker } from './Figure';

type CorpAction = MarketSnapshot['corporateActions'][number];
type ActionType = CorpAction['type'];

function typeBadgeStyle(type: ActionType): string {
  switch (type) {
    case 'results':
      return 'bg-[var(--color-bullish-bg)] text-[var(--color-bullish)]';
    case 'dividend':
      return 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]';
    case 'split':
    case 'bonus':
      return 'bg-[var(--color-brand-bg,var(--color-raised))] text-[var(--color-brand)]';
    case 'agm':
    default:
      return 'bg-[var(--color-raised)] text-[var(--color-muted)]';
  }
}

interface CorpActionsListProps {
  actions: MarketSnapshot['corporateActions'];
}

export default function CorpActionsList({ actions }: CorpActionsListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-hairline)]">
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-4">
              Date
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-4">
              Ticker
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3 pr-4">
              Type
            </th>
            <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-3">
              Name
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-hairline)]">
          {actions.map((action, idx) => (
            <tr key={idx} className="group hover:bg-[var(--color-raised)] transition-colors">
              <td className="py-2.5 pr-4">
                <span className="font-mono text-sm text-[var(--color-muted)]">
                  {action.date}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                  {ticker(action.ticker)}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <span
                  className={`inline-block font-sans text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${typeBadgeStyle(action.type)}`}
                >
                  {action.type}
                </span>
              </td>
              <td className="py-2.5">
                <span className="font-sans text-sm text-[var(--color-muted)] truncate block max-w-[200px]">
                  {action.name}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
