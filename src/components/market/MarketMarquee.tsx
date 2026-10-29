import type { MarketSnapshot } from '../../../lib/schemas';

export function MarketMarquee({ snapshot }: { snapshot: MarketSnapshot }) {
  const quotes = snapshot.indianIndices;
  if (!quotes.length) return null;
  return (
    <section className="market-tape" aria-label="Market snapshot">
      <div className="market-tape-track">
        {quotes.map((quote) => (
          <div className="market-tape-quote" key={quote.symbol}>
            <span className="market-tape-name">{quote.name}</span>
            <strong>
              {quote.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </strong>
            <span
              className={`market-delta ${quote.changePct > 0 ? 'is-positive' : quote.changePct < 0 ? 'is-negative' : ''}`}
            >
              {quote.changePct > 0 ? '+' : ''}
              {quote.changePct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
