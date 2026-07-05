import type { MarketSnapshot } from '../../../lib/schemas';
import { Section, ticker } from './Figure';
import { IndexStrip } from './IndexStrip';
import MoversTable from './MoversTable';

type IndexQuote = MarketSnapshot['indianIndices'][number];
type NearHigh = MarketSnapshot['near52wHigh'][number];
type NearLow = MarketSnapshot['near52wLow'][number];

// Hardcoded display order for the sectoral Nifty indices — looked up by name so
// the order is stable on every rerun regardless of fetch order.
const SECTOR_ORDER = [
  'NIFTY BANK',
  'NIFTY IT',
  'NIFTY PHARMA',
  'NIFTY AUTO',
  'NIFTY METAL',
  'NIFTY ENERGY',
  'NIFTY REALTY',
  'NIFTY FIN SERVICE',
  'NIFTY FMCG',
];

// Fixed set + order for the headline "Market Cues" row.
function buildCues(s: MarketSnapshot): IndexQuote[] {
  const indian = (name: string) => s.indianIndices.find((i) => i.name === name);
  const global = (name: string) => s.globalIndices.find((i) => i.name === name);
  const commodity = (name: string) => s.commodities.find((c) => c.name === name);

  const cues: IndexQuote[] = [];
  const nifty = indian('NIFTY 50');
  if (nifty) cues.push({ name: 'NIFTY 50', symbol: 'NIFTY50', ltp: nifty.ltp, changePct: nifty.changePct });
  const sensex = indian('SENSEX');
  if (sensex) cues.push({ name: 'SENSEX', symbol: 'SENSEX', ltp: sensex.ltp, changePct: sensex.changePct });
  if (s.giftNifty) cues.push({ name: 'GIFT NIFTY', symbol: 'GIFTNIFTY', ltp: s.giftNifty.value, changePct: s.giftNifty.changePct });
  const nasdaq = global('NASDAQ');
  if (nasdaq) cues.push({ name: 'NASDAQ', symbol: 'NASDAQ', ltp: nasdaq.ltp, changePct: nasdaq.changePct });
  const gold = commodity('Gold');
  if (gold) cues.push({ name: 'GOLD', symbol: 'GOLD', ltp: gold.value, changePct: gold.changePct });
  if (s.vix) cues.push({ name: 'INDIA VIX', symbol: 'INDIAVIX', ltp: s.vix.value, changePct: s.vix.changePct });
  return cues;
}

function formatCrore(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toLocaleString('en-IN')} cr`;
}

function NearList({ rows, kind }: { rows: Array<NearHigh | NearLow>; kind: 'high' | 'low' }) {
  if (rows.length === 0) {
    return (
      <p className="font-sans text-sm text-[var(--color-faint)] py-2">
        No stocks within 2% of their 52-week {kind}.
      </p>
    );
  }
  return (
    <div className="divide-y divide-[var(--color-hairline)]">
      {rows.map((item) => {
        const pct = kind === 'high' ? (item as NearHigh).pctFromHigh : (item as NearLow).pctFromLow;
        return (
          <div key={item.ticker} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-sm font-bold text-[var(--color-ink)]">{ticker(item.ticker)}</span>
              <span className="font-sans text-sm text-[var(--color-muted)] truncate max-w-[140px]">{item.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-mono text-sm tabular-nums text-[var(--color-ink)]">
                {item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className="font-mono text-sm tabular-nums"
                style={{ color: kind === 'high' ? 'var(--color-bearish)' : 'var(--color-bullish)' }}
              >
                {kind === 'high' ? '−' : '+'}
                {pct.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MarketDashboardProps {
  snapshot: MarketSnapshot;
}

export function MarketDashboard({ snapshot }: MarketDashboardProps) {
  const cues = buildCues(snapshot);
  const sectors = SECTOR_ORDER
    .map((name) => snapshot.indianIndices.find((i) => i.name === name))
    .filter((i): i is IndexQuote => Boolean(i));

  const topGainers = snapshot.topGainers.slice(0, 5);
  const topLosers = snapshot.topLosers.slice(0, 5);

  const has52w = snapshot.near52wHigh.length > 0 || snapshot.near52wLow.length > 0;

  return (
    <div>
      {/* FII / DII Activity */}
      {snapshot.fiiDii && (
        <Section title="FII / DII Activity">
          <div className="grid grid-cols-2 gap-6 max-w-md">
            <div>
              <p className="font-sans text-xs text-[var(--color-faint)] mb-1">FII Net</p>
              <p
                className="font-mono text-xl tabular-nums"
                style={{ color: snapshot.fiiDii.fiiNet >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
              >
                {formatCrore(snapshot.fiiDii.fiiNet)}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-[var(--color-faint)] mb-1">DII Net</p>
              <p
                className="font-mono text-xl tabular-nums"
                style={{ color: snapshot.fiiDii.diiNet >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
              >
                {formatCrore(snapshot.fiiDii.diiNet)}
              </p>
            </div>
          </div>
          <p className="font-mono text-xs text-[var(--color-faint)] mt-2">As of {snapshot.fiiDii.asOf}</p>
        </Section>
      )}

      {/* Market Cues */}
      {cues.length > 0 && (
        <Section title="Market Cues">
          <IndexStrip indices={cues} />
        </Section>
      )}

      {/* Market Sectors */}
      {sectors.length > 0 && (
        <Section title="Market Sectors">
          <IndexStrip indices={sectors} />
        </Section>
      )}

      {/* Top Gainers & Losers (top 5) */}
      {(topGainers.length > 0 || topLosers.length > 0) && (
        <Section title="Top Gainers & Losers">
          <div className="grid lg:grid-cols-2 gap-6">
            {topGainers.length > 0 && (
              <div>
                <h3 className="font-sans text-sm font-semibold text-[var(--color-bullish)] mb-2">
                  Top Gainers
                </h3>
                <MoversTable title="Top Gainers" rows={topGainers} />
              </div>
            )}
            {topLosers.length > 0 && (
              <div>
                <h3 className="font-sans text-sm font-semibold text-[var(--color-bearish)] mb-2">
                  Top Losers
                </h3>
                <MoversTable title="Top Losers" rows={topLosers} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 52-Week High & Low — always show both columns */}
      {has52w && (
        <Section title="52-Week High & Low">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-sans text-sm font-semibold text-[var(--color-bullish)] mb-2">
                Near 52-Week High
              </h3>
              <NearList rows={snapshot.near52wHigh} kind="high" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-[var(--color-bearish)] mb-2">
                Near 52-Week Low
              </h3>
              <NearList rows={snapshot.near52wLow} kind="low" />
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
