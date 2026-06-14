import { getLatest } from '../lib/reports';
import type { MorningContent } from '../../lib/schemas';

export default async function TodayPage() {
  const report = await getLatest('morning');

  if (!report) {
    return <p>No briefing yet.</p>;
  }

  const content = report.content as MorningContent;

  return (
    <div>
      <h1>Today&apos;s Briefing</h1>
      <section>
        <h2>Market Outlook</h2>
        <p>{content.marketOutlook}</p>
      </section>
      <section>
        <h2>Stocks to Watch</h2>
        <ul>
          {content.stocksToWatch.map((s: { ticker: string; reason: string }) => (
            <li key={s.ticker}>
              <strong>{s.ticker}</strong>: {s.reason}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Top Recommendation</h2>
        <p>{content.topRecommendation.ticker} — {content.topRecommendation.action}: {content.topRecommendation.reasoning}</p>
      </section>
    </div>
  );
}
