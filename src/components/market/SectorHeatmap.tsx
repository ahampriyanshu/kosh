import type { MarketSnapshot } from '../../../lib/schemas';
import { Pct } from './Figure';

interface SectorHeatmapProps {
  sectors: MarketSnapshot['sectorRanking'];
}

export default function SectorHeatmap({ sectors }: SectorHeatmapProps) {
  if (!sectors || sectors.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {sectors.map((s) => {
        const bg =
          s.changePct > 0
            ? 'var(--color-bullish-bg)'
            : s.changePct < 0
              ? 'var(--color-bearish-bg)'
              : 'var(--color-neutral-bg)';

        return (
          <div
            key={s.sector}
            className="rounded-lg p-3"
            style={{ backgroundColor: bg }}
          >
            <p className="font-sans text-xs text-[var(--color-ink)] truncate mb-1">{s.sector}</p>
            <Pct value={s.changePct} className="text-sm" />
          </div>
        );
      })}
    </div>
  );
}
