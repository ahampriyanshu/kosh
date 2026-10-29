import Link from 'next/link';
import type { ReactNode } from 'react';
import { getLatest } from '../lib/reports';
import type {
  DailyContent,
  MarketSnapshot,
  SystematicBet,
} from '../../lib/schemas';
import { SentimentGauge } from '../components/SentimentGauge';
import { MarketMarquee } from '../components/market/MarketMarquee';
import { computeMoodSnapshot } from '../../lib/sentiment';
import { getActiveBets } from '../../lib/bets-store';
import { dateReportPath } from '../../lib/report-routes';
import {
  formatCategory,
  cleanSource,
  safeArticleUrl,
  cleanTicker,
} from '../lib/news-format';

function number(value: number, digits = 1) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

function actionDate(value: string) {
  const date = new Date(`${value}T12:00:00+05:30`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      });
}

function Delta({ value }: { value: number }) {
  return (
    <span
      className={`market-delta ${value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : ''}`}
    >
      {value > 0 ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

function DeskSection({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="desk-section">
      <div className="desk-section-heading">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="desk-empty">{children}</p>;
}

function Quotes({
  rows,
}: {
  rows: { name: string; value?: number; changePct?: number; prefix?: string }[];
}) {
  if (!rows.length) return <Empty>No quotes in this edition.</Empty>;
  return (
    <dl className="quote-list">
      {rows.map((row) => (
        <div className="quote-row" key={row.name}>
          <dt>{row.name}</dt>
          <dd>
            {row.value !== undefined && (
              <span>
                {row.prefix}
                {number(row.value, 2)}
              </span>
            )}
            {row.changePct !== undefined && <Delta value={row.changePct} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Movers({
  title,
  rows,
}: {
  title: string;
  rows: MarketSnapshot['topGainers'];
}) {
  return (
    <DeskSection title={title}>
      <div className="stock-list">
        {rows.length ? (
          rows.slice(0, 5).map((row) => (
            <div className="stock-row" key={row.ticker}>
              <div>
                <strong>{cleanTicker(row.ticker)}</strong>
                <span className="stock-name">{row.name}</span>
              </div>
              <div className="stock-value">
                <span>₹{number(row.ltp, 2)}</span>
                <Delta value={row.changePct} />
              </div>
            </div>
          ))
        ) : (
          <Empty>No movers in this edition.</Empty>
        )}
      </div>
    </DeskSection>
  );
}

function ModelCalls({
  title,
  bets,
  href,
}: {
  title: string;
  bets: SystematicBet[];
  href: string;
}) {
  return (
    <DeskSection title={title}>
      <div className="call-list">
        {bets.length ? (
          bets.slice(0, 3).map((bet) => (
            <article key={bet.id} className="model-call">
              <div className="call-heading">
                <h3>{cleanTicker(bet.ticker)}</h3>
                <span
                  className={
                    bet.action === 'buy'
                      ? 'is-positive'
                      : bet.action === 'sell'
                        ? 'is-negative'
                        : ''
                  }
                >
                  {bet.action}
                </span>
              </div>
              <p className="stock-name">{bet.name}</p>
              <dl className="call-levels">
                <div>
                  <dt>Entry</dt>
                  <dd>₹{number(bet.entryPrice)}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>₹{number(bet.targetPrice)}</dd>
                </div>
                <div>
                  <dt>Stop</dt>
                  <dd>₹{number(bet.stopLossPrice)}</dd>
                </div>
              </dl>
              <p>{bet.thesis}</p>
              <time dateTime={bet.expiryDate}>
                Expires {actionDate(bet.expiryDate)}
              </time>
            </article>
          ))
        ) : (
          <Empty>
            No active calls. The next screened setups will appear here.
          </Empty>
        )}
      </div>
      <Link href={href} className="editorial-link">
        View models and track record <span aria-hidden="true">↗</span>
      </Link>
    </DeskSection>
  );
}

export default async function TodayPage() {
  const [daily, shortBets, longBets] = await Promise.all([
    getLatest('daily'),
    getActiveBets('short_term'),
    getActiveBets('long_term'),
  ]);
  if (!daily)
    return (
      <div className="edition-empty">
        <p className="story-category">Kosh Daily</p>
        <h1>The next edition is on its way.</h1>
        <p>
          Market briefings, company research and the day’s important numbers,
          all in one place.
        </p>
        <Link href="/reports" className="editorial-link">
          Browse the report archive
        </Link>
      </div>
    );
  const content = daily.content as DailyContent;
  const snapshot = content.snapshot;
  const mood = snapshot.sentiment ?? computeMoodSnapshot(snapshot, 'closing');
  const seen = new Set<string>();
  const stories = snapshot.news
    .flatMap((group) =>
      group.items.map((story) => ({ ...story, category: group.category })),
    )
    .filter((story) => {
      if (!story.headline.trim() || seen.has(story.headline)) return false;
      seen.add(story.headline);
      return true;
    })
    .slice(0, 8);
  const sectors = [...snapshot.sectorRanking].sort(
    (a, b) => b.changePct - a.changePct,
  );
  const reportHref = dateReportPath(daily.dateKey);
  const actions = [...snapshot.corporateActions].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const macro = [
    ...snapshot.commodities.map((quote) => ({
      ...quote,
      prefix: quote.name.toLowerCase().includes('brent') ? '$' : undefined,
    })),
    ...snapshot.currencies.map((quote) => ({
      name: quote.pair,
      value: quote.value,
      changePct: quote.changePct,
    })),
  ];

  return (
    <div className="homepage-dashboard">
      <MarketMarquee snapshot={snapshot} />
      <div className="front-page-grid">
        <section className="front-page-news" aria-label="Latest market news">
          <div className="edition-section-label">
            The market briefing <span>India edition</span>
          </div>
          <div className="homepage-stories">
            {stories.length ? (
              stories.map((story, index) => {
                const url = safeArticleUrl(story.url);
                const source = cleanSource(story.source);
                const Heading = index === 0 ? 'h1' : 'h2';
                return (
                  <article
                    className={`homepage-story${index === 0 ? ' lead-story' : ''}`}
                    key={story.headline}
                  >
                    <p className="story-category">
                      {formatCategory(story.category)}
                    </p>
                    <Heading>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {story.headline}
                        </a>
                      ) : (
                        story.headline
                      )}
                    </Heading>
                    {index === 0 &&
                      story.summary &&
                      story.summary !== story.headline && (
                        <p className="story-summary">{story.summary}</p>
                      )}
                    <div className="story-byline">
                      {source && <span>{source}</span>}
                      {story.tickers?.length ? (
                        <span>{story.tickers.map(cleanTicker).join(', ')}</span>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <>
                <h1 className="edition-fallback-title">The market briefing</h1>
                <Empty>No headlines in this edition.</Empty>
              </>
            )}
          </div>
          <Link href={reportHref} className="editorial-link">
            Read the full daily report <span aria-hidden="true">↗</span>
          </Link>
        </section>

        <aside className="front-page-markets" aria-label="Market indicators">
          <DeskSection
            title="Market mood"
            aside={
              <Link
                href="/sentiment-index"
                aria-label="Explore the sentiment index"
              >
                ↗
              </Link>
            }
          >
            <Link href="/sentiment-index" className="gauge-link">
              <SentimentGauge
                score={mood.composite}
                regime={mood.regime}
                compact
              />
            </Link>
            <p className="desk-caption">
              A reading of breadth, flows, volatility and positioning.
            </p>
          </DeskSection>
          <DeskSection
            title="Institutional Flows"
            aside={
              snapshot.fiiDii && (
                <time dateTime={snapshot.fiiDii.asOf}>
                  {actionDate(snapshot.fiiDii.asOf)}
                </time>
              )
            }
          >
            {snapshot.fiiDii ? (
              <dl className="quote-list flow-list">
                {[
                  ['FII Net Cash', snapshot.fiiDii.fiiNet],
                  ['DII Net Cash', snapshot.fiiDii.diiNet],
                ].map(([label, value]) => (
                  <div className="quote-row" key={label}>
                    <dt>{label}</dt>
                    <dd>
                      {Number(value) > 0 ? '+' : Number(value) < 0 ? '−' : ''}
                      {number(Math.abs(Number(value)), 0)} <small>cr</small>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Empty>Flow data is unavailable for this edition.</Empty>
            )}
          </DeskSection>
          <DeskSection title="Global markets">
            <Quotes
              rows={snapshot.globalIndices.map((quote) => ({
                name: quote.name,
                value: quote.ltp,
                changePct: quote.changePct,
              }))}
            />
          </DeskSection>
          <DeskSection title="Commodities & FX">
            <Quotes rows={macro} />
            {snapshot.bondYield && (
              <p className="desk-caption">
                India 10Y yield{' '}
                <strong>{snapshot.bondYield.value.toFixed(2)}%</strong>
              </p>
            )}
          </DeskSection>
          <DeskSection title="Sector Rotation">
            <Quotes
              rows={sectors.map((sector) => ({
                name: sector.sector.replace(/^NIFTY /, ''),
                changePct: sector.changePct,
              }))}
            />
          </DeskSection>
        </aside>

        <aside
          className="front-page-calendar"
          aria-label="Desk notes and calendar"
        >
          <DeskSection title="From the desk">
            <p className="desk-note">{content.outlook}</p>
            <Link href={reportHref} className="editorial-link">
              Full report <span aria-hidden="true">↗</span>
            </Link>
          </DeskSection>
          {content.keyTakeaways.length > 0 && (
            <DeskSection title="Worth watching">
              <ul className="takeaway-list">
                {content.keyTakeaways.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DeskSection>
          )}
          <DeskSection title="Corporate Actions" aside={<span>Calendar</span>}>
            {actions.length ? (
              <ol className="calendar-list">
                {actions.slice(0, 5).map((action) => (
                  <li key={`${action.ticker}-${action.type}-${action.date}`}>
                    <time dateTime={action.date}>
                      {actionDate(action.date)}
                    </time>
                    <div>
                      <strong>{cleanTicker(action.ticker)}</strong>
                      <span>{action.type}</span>
                      <p>{action.name}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>No corporate actions in this edition.</Empty>
            )}
          </DeskSection>
          <div className="archive-note">
            <h2>Go beyond the day.</h2>
            <p>
              Company research, market reviews and the record behind every model
              call.
            </p>
            <Link href="/research" className="editorial-link">
              Explore the research desk <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </aside>
      </div>

      <section className="market-section" aria-label="Market activity">
        <div className="section-heading">
          <h2>The trading floor</h2>
          <span>Prices from this edition</span>
        </div>
        <div className="market-three-column">
          <Movers title="Top gainers" rows={snapshot.topGainers} />
          <Movers title="Top losers" rows={snapshot.topLosers} />
          <DeskSection title="Most active">
            <div className="stock-list">
              {snapshot.mostActive.length ? (
                snapshot.mostActive.slice(0, 5).map((row) => (
                  <div className="stock-row" key={row.ticker}>
                    <div>
                      <strong>{cleanTicker(row.ticker)}</strong>
                      <span className="stock-name">{row.name}</span>
                    </div>
                    <div className="stock-value">
                      <span>₹{number(row.ltp, 2)}</span>
                      <span className="stock-name">
                        {number(row.volume / 100000, 1)} L shares
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <Empty>No volume data in this edition.</Empty>
              )}
            </div>
          </DeskSection>
        </div>
        {(snapshot.near52wHigh.length > 0 ||
          snapshot.near52wLow.length > 0 ||
          snapshot.volumeShockers.length > 0) && (
          <div className="market-three-column range-columns">
            <DeskSection title="Near 52-week highs">
              {snapshot.near52wHigh.length ? (
                <Quotes
                  rows={snapshot.near52wHigh.slice(0, 4).map((row) => ({
                    name: cleanTicker(row.ticker),
                    value: row.ltp,
                    prefix: '₹',
                  }))}
                />
              ) : (
                <Empty>No stocks near their highs.</Empty>
              )}
            </DeskSection>
            <DeskSection title="Near 52-week lows">
              {snapshot.near52wLow.length ? (
                <Quotes
                  rows={snapshot.near52wLow.slice(0, 4).map((row) => ({
                    name: cleanTicker(row.ticker),
                    value: row.ltp,
                    prefix: '₹',
                  }))}
                />
              ) : (
                <Empty>No stocks near their lows.</Empty>
              )}
            </DeskSection>
            <DeskSection title="Unusual volume">
              <dl className="quote-list">
                {snapshot.volumeShockers.slice(0, 4).map((row) => (
                  <div className="quote-row" key={row.ticker}>
                    <dt>{cleanTicker(row.ticker)}</dt>
                    <dd>
                      {row.ratio.toFixed(1)}× <small>20-day avg</small>
                    </dd>
                  </div>
                ))}
              </dl>
            </DeskSection>
          </div>
        )}
      </section>

      <section className="market-section" aria-label="Research and model calls">
        <div className="section-heading">
          <h2>Ideas &amp; analysis</h2>
          <Link href="/research">
            The research archive <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="market-three-column">
          <DeskSection title="The street’s view">
            {snapshot.streetRecommendations.length ? (
              snapshot.streetRecommendations.slice(0, 4).map((rec) => (
                <article
                  className="street-note"
                  key={`${rec.ticker}-${rec.brokerage}`}
                >
                  <p className="story-category">{rec.brokerage}</p>
                  <h3>{rec.name || cleanTicker(rec.ticker)}</h3>
                  <div className="street-rating">
                    <span>{rec.action}</span>
                    {rec.target !== undefined && (
                      <span>Target ₹{number(rec.target)}</span>
                    )}
                  </div>
                  <p>{rec.rationale}</p>
                </article>
              ))
            ) : (
              <Empty>No brokerage updates in this edition.</Empty>
            )}
          </DeskSection>
          <ModelCalls
            title="Short-term calls"
            bets={shortBets}
            href="/bets/short-term"
          />
          <ModelCalls
            title="Long-term calls"
            bets={longBets}
            href="/bets/long-term"
          />
        </div>
      </section>
    </div>
  );
}
