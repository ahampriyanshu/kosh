import type { MarketSnapshot } from '../../../lib/schemas';
import { Pct, Stat } from './Figure';

interface FlowsCardProps {
  fiiDii: MarketSnapshot['fiiDii'];
  vix: MarketSnapshot['vix'];
  giftNifty: MarketSnapshot['giftNifty'];
  bondYield: MarketSnapshot['bondYield'];
}

export default function FlowsCard({ fiiDii, vix, giftNifty, bondYield }: FlowsCardProps) {
  if (!fiiDii && !vix && !giftNifty && !bondYield) return null;

  return (
    <div className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {fiiDii && (
          <>
            <Stat label="FII Net">
              <span
                style={{
                  color:
                    fiiDii.fiiNet >= 0
                      ? 'var(--color-bullish)'
                      : 'var(--color-bearish)',
                }}
              >
                {fiiDii.fiiNet >= 0 ? '+' : ''}
                {fiiDii.fiiNet.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                cr
              </span>
            </Stat>
            <Stat label="DII Net">
              <span
                style={{
                  color:
                    fiiDii.diiNet >= 0
                      ? 'var(--color-bullish)'
                      : 'var(--color-bearish)',
                }}
              >
                {fiiDii.diiNet >= 0 ? '+' : ''}
                {fiiDii.diiNet.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                cr
              </span>
            </Stat>
          </>
        )}
        {vix && (
          <Stat label="VIX">
            <span className="text-[var(--color-ink)]">
              {vix.value.toFixed(2)}
            </span>
          </Stat>
        )}
        {giftNifty && (
          <Stat label="GIFT Nifty">
            <span className="text-[var(--color-ink)] mr-2">
              {giftNifty.value.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <Pct value={giftNifty.changePct} />
          </Stat>
        )}
        {bondYield && (
          <Stat label="India 10Y">
            <span className="text-[var(--color-ink)] mr-1">
              {bondYield.value.toFixed(2)}%
            </span>
            <span
              style={{
                color:
                  bondYield.changeBps >= 0
                    ? 'var(--color-bearish)'
                    : 'var(--color-bullish)',
              }}
              className="text-sm"
            >
              ({bondYield.changeBps >= 0 ? '+' : ''}
              {bondYield.changeBps}bps)
            </span>
          </Stat>
        )}
      </div>
    </div>
  );
}
