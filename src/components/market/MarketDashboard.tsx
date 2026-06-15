import type { MarketSnapshot } from '../../../lib/schemas';
import { Section, ticker } from './Figure';
import { IndexStrip } from './IndexStrip';
import { GlobalCues } from './GlobalCues';
import BreadthBar from './BreadthBar';
import SectorHeatmap from './SectorHeatmap';
import MoversTable from './MoversTable';
import FlowsCard from './FlowsCard';
import NewsList from './NewsList';
import RecommendationsList from './RecommendationsList';
import CorpActionsList from './CorpActionsList';

interface MarketDashboardProps {
  snapshot: MarketSnapshot;
}

export function MarketDashboard({ snapshot }: MarketDashboardProps) {
  // Pre-compute presence flags
  const hasIndices = snapshot.indianIndices.length > 0;

  const hasBreadthOrFlows =
    snapshot.breadth !== null ||
    snapshot.fiiDii !== null ||
    snapshot.vix !== null ||
    snapshot.giftNifty !== null ||
    snapshot.bondYield !== null;

  const hasSectors = snapshot.sectorRanking.length > 0;

  const hasMovers = snapshot.topGainers.length > 0 || snapshot.topLosers.length > 0;

  const hasMostActive = snapshot.mostActive.length > 0;

  const hasNear52wHigh = snapshot.near52wHigh.length > 0;
  const hasNear52wLow = snapshot.near52wLow.length > 0;
  const hasVolumeShockers = snapshot.volumeShockers.length > 0;

  const hasGlobalCues =
    snapshot.globalIndices.length > 0 ||
    snapshot.commodities.length > 0 ||
    snapshot.currencies.length > 0;

  const hasRecs = snapshot.streetRecommendations.length > 0;

  const hasNews = snapshot.news.some((g) => g.items.length > 0);

  const hasCorpActions = snapshot.corporateActions.length > 0;

  return (
    <div>
      {/* Indices */}
      {hasIndices && (
        <Section title="Indices">
          <IndexStrip indices={snapshot.indianIndices} />
        </Section>
      )}

      {/* Breadth & Flows */}
      {hasBreadthOrFlows && (
        <Section title="Breadth & Flows">
          <div className="grid sm:grid-cols-2 gap-4">
            <BreadthBar breadth={snapshot.breadth} />
            <FlowsCard
              fiiDii={snapshot.fiiDii}
              vix={snapshot.vix}
              giftNifty={snapshot.giftNifty}
              bondYield={snapshot.bondYield}
            />
          </div>
        </Section>
      )}

      {/* Sectors */}
      {hasSectors && (
        <Section title="Sectors">
          <SectorHeatmap sectors={snapshot.sectorRanking} />
        </Section>
      )}

      {/* Top Movers */}
      {hasMovers && (
        <Section title="Top Movers">
          <div className="grid lg:grid-cols-2 gap-6">
            <MoversTable title="Top Gainers" rows={snapshot.topGainers} />
            <MoversTable title="Top Losers" rows={snapshot.topLosers} />
          </div>
        </Section>
      )}

      {/* Most Active */}
      {hasMostActive && (
        <Section title="Most Active">
          <MoversTable title="Most Active" rows={snapshot.mostActive} />
        </Section>
      )}

      {/* Near 52-Week High */}
      {hasNear52wHigh && (
        <Section title="Near 52-Week High" count={snapshot.near52wHigh.length}>
          <div className="divide-y divide-[var(--color-hairline)]">
            {snapshot.near52wHigh.map((item) => (
              <div key={item.ticker} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                    {ticker(item.ticker)}
                  </span>
                  <span className="font-sans text-sm text-[var(--color-muted)] truncate max-w-[160px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-[var(--color-ink)]">
                    {item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--color-bearish)' }}>
                    -{item.pctFromHigh.toFixed(2)}% from high
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Near 52-Week Low */}
      {hasNear52wLow && (
        <Section title="Near 52-Week Low" count={snapshot.near52wLow.length}>
          <div className="divide-y divide-[var(--color-hairline)]">
            {snapshot.near52wLow.map((item) => (
              <div key={item.ticker} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                    {ticker(item.ticker)}
                  </span>
                  <span className="font-sans text-sm text-[var(--color-muted)] truncate max-w-[160px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-[var(--color-ink)]">
                    {item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--color-bullish)' }}>
                    +{item.pctFromLow.toFixed(2)}% from low
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Volume Shockers */}
      {hasVolumeShockers && (
        <Section title="Volume Shockers" count={snapshot.volumeShockers.length}>
          <div className="divide-y divide-[var(--color-hairline)]">
            {snapshot.volumeShockers.map((item) => (
              <div key={item.ticker} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                    {ticker(item.ticker)}
                  </span>
                  <span className="font-sans text-sm text-[var(--color-muted)] truncate max-w-[160px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-[var(--color-ink)]">
                    {item.volume >= 1_000_000
                      ? `${(item.volume / 1_000_000).toFixed(2)}M`
                      : item.volume >= 1_000
                        ? `${(item.volume / 1_000).toFixed(1)}K`
                        : item.volume.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-[var(--color-brand)]">
                    {item.ratio.toFixed(1)}× avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Global Cues */}
      {hasGlobalCues && (
        <Section title="Global Cues">
          <GlobalCues
            globalIndices={snapshot.globalIndices}
            commodities={snapshot.commodities}
            currencies={snapshot.currencies}
          />
        </Section>
      )}

      {/* Street Recommendations */}
      {hasRecs && (
        <Section title="Street Recommendations" count={snapshot.streetRecommendations.length}>
          <RecommendationsList recs={snapshot.streetRecommendations} />
        </Section>
      )}

      {/* News */}
      {hasNews && (
        <Section title="News">
          <NewsList groups={snapshot.news} />
        </Section>
      )}

      {/* Corporate Actions */}
      {hasCorpActions && (
        <Section title="Corporate Actions" count={snapshot.corporateActions.length}>
          <CorpActionsList actions={snapshot.corporateActions} />
        </Section>
      )}
    </div>
  );
}
