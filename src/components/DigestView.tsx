import type { MarketSnapshot } from '../../lib/schemas';

interface DigestViewProps {
  snapshot: MarketSnapshot;
}

function signedPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export function DigestView({ snapshot }: DigestViewProps) {
  const hasIndices = snapshot.indianIndices.length > 0;
  const hasGainers = snapshot.topGainers.length > 0;
  const hasLosers = snapshot.topLosers.length > 0;
  const hasSectors = snapshot.sectorRanking.length > 0;

  return (
    <div className="space-y-6">
      {/* Index Strip */}
      <section>
        <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-hairline)]">
          Indices
        </h3>
        {hasIndices ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-1.5 pr-4">
                    Index
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-1.5 pr-4">
                    LTP
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-1.5">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {snapshot.indianIndices.map((idx) => (
                  <tr key={idx.symbol}>
                    <td className="py-2 pr-4 font-sans text-sm text-[var(--color-ink)]">{idx.name}</td>
                    <td className="py-2 pr-4 text-right font-mono text-sm tabular-nums text-[var(--color-ink)]">
                      {idx.ltp.toLocaleString('en-IN')}
                    </td>
                    <td
                      className="py-2 text-right font-mono text-sm tabular-nums"
                      style={{ color: idx.changePct >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
                    >
                      {signedPct(idx.changePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-faint)]">—</p>
        )}
      </section>

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section>
          <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-2 pb-1 border-b border-[var(--color-hairline)]">
            Top Gainers
          </h3>
          {hasGainers ? (
            <ul className="space-y-1">
              {snapshot.topGainers.map((g) => (
                <li key={g.ticker} className="flex justify-between items-center py-1">
                  <span className="font-mono text-sm text-[var(--color-ink)]">
                    {g.ticker.replace('.NS', '').replace('.BO', '')}
                  </span>
                  <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--color-bullish)' }}>
                    {signedPct(g.changePct)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-faint)]">—</p>
          )}
        </section>

        <section>
          <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-2 pb-1 border-b border-[var(--color-hairline)]">
            Top Losers
          </h3>
          {hasLosers ? (
            <ul className="space-y-1">
              {snapshot.topLosers.map((g) => (
                <li key={g.ticker} className="flex justify-between items-center py-1">
                  <span className="font-mono text-sm text-[var(--color-ink)]">
                    {g.ticker.replace('.NS', '').replace('.BO', '')}
                  </span>
                  <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--color-bearish)' }}>
                    {signedPct(g.changePct)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-faint)]">—</p>
          )}
        </section>
      </div>

      {/* Sector Ranking */}
      <section>
        <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-2 pb-1 border-b border-[var(--color-hairline)]">
          Sector Ranking
        </h3>
        {hasSectors ? (
          <ul className="space-y-1">
            {snapshot.sectorRanking.map((s) => (
              <li key={s.sector} className="flex justify-between items-center py-1">
                <span className="text-sm text-[var(--color-muted)]">{s.sector}</span>
                <span
                  className="font-mono text-sm tabular-nums"
                  style={{ color: s.changePct >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
                >
                  {signedPct(s.changePct)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-faint)]">—</p>
        )}
      </section>

      {/* Breadth, FII/DII, VIX */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <section>
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-1 pb-1 border-b border-[var(--color-hairline)]">
            Market Breadth
          </h3>
          {snapshot.breadth ? (
            <dl className="space-y-1 mt-1">
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">Advances</dt>
                <dd className="font-mono tabular-nums" style={{ color: 'var(--color-bullish)' }}>
                  {snapshot.breadth.advances}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">Declines</dt>
                <dd className="font-mono tabular-nums" style={{ color: 'var(--color-bearish)' }}>
                  {snapshot.breadth.declines}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">A/D Ratio</dt>
                <dd className="font-mono tabular-nums text-[var(--color-ink)]">
                  {snapshot.breadth.adRatio.toFixed(2)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-faint)] mt-1">—</p>
          )}
        </section>

        <section>
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-1 pb-1 border-b border-[var(--color-hairline)]">
            FII / DII
          </h3>
          {snapshot.fiiDii ? (
            <dl className="space-y-1 mt-1">
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">FII Net</dt>
                <dd
                  className="font-mono tabular-nums"
                  style={{ color: snapshot.fiiDii.fiiNet >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
                >
                  {snapshot.fiiDii.fiiNet >= 0 ? '+' : ''}{snapshot.fiiDii.fiiNet.toFixed(0)} cr
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">DII Net</dt>
                <dd
                  className="font-mono tabular-nums"
                  style={{ color: snapshot.fiiDii.diiNet >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
                >
                  {snapshot.fiiDii.diiNet >= 0 ? '+' : ''}{snapshot.fiiDii.diiNet.toFixed(0)} cr
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-faint)] mt-1">—</p>
          )}
        </section>

        <section>
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-1 pb-1 border-b border-[var(--color-hairline)]">
            VIX
          </h3>
          {snapshot.vix ? (
            <dl className="space-y-1 mt-1">
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">Value</dt>
                <dd className="font-mono tabular-nums text-[var(--color-ink)]">
                  {snapshot.vix.value.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--color-faint)]">Change</dt>
                <dd
                  className="font-mono tabular-nums"
                  style={{ color: snapshot.vix.changePct >= 0 ? 'var(--color-bearish)' : 'var(--color-bullish)' }}
                >
                  {signedPct(snapshot.vix.changePct)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-faint)] mt-1">—</p>
          )}
        </section>
      </div>
    </div>
  );
}
