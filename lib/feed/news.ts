import { generateGroundedObject } from '../llm';
import { NewsSliceSchema, type NewsSlice } from '../schemas';

export async function fetchNews(
  now: Date = new Date(),
  session: 'morning' | 'closing' | 'evening' = 'morning',
): Promise<NewsSlice> {
  const date = now.toISOString().slice(0, 10);
  const sessionDescriptor = session === 'morning'
    ? 'morning pre-market opening'
    : 'evening market close and post-market';
  const researchPrompt =
    `Research today's (${date}) ${sessionDescriptor} most important Indian stock-market news using current sources. ` +
    `Cover: macro/policy (RBI, inflation, govt), global cues, earnings/results, sectoral moves, ` +
    `corporate actions/M&A, and specific stocks in focus. ` +
    `Also actively research notable institutional brokerage and equity research analyst recommendations published recently for Indian stocks ` +
    `(e.g., calls from Jefferies, Morgan Stanley, Goldman Sachs, Nomura, Citi, Macquarie, Kotak Institutional Equities, ICICI Securities, Motilal Oswal, Axis Capital, Emkay, etc., ` +
    `with the exact brokerage name, stock ticker, rating/action, target price, and rationale).`;
  const buildStructurePrompt = (research: string) =>
    `From the research, produce: "news" grouped by category ` +
    `(one of macro_policy, global_cues, earnings, sectoral, corporate_actions, stocks_in_focus), producing at least 8 to 14 distinct news items total across the categories (with at least 1 per major category), each item with ` +
    `headline, summary, source, url (the canonical URL of the specific source article), optional tickers (NSE symbols like RELIANCE.NS), and sentiment (bullish/bearish/neutral). ` +
    `"source" MUST be the actual news outlet/publication name (e.g. Economic Times, Moneycontrol, Reuters, Business Standard, Livemint) — never a placeholder like "Research text". ` +
    `"url" MUST be the actual article URL for that item, not the publisher homepage, a search page, or an invented URL. Omit the item if its article URL cannot be verified. ` +
    `And "streetRecommendations": array of { ticker, name, brokerage, action (buy/sell/hold/accumulate/reduce), ` +
    `optional target (number), rationale }. Include at least 4 to 8 institutional brokerage calls from recognized firms with specific target price numbers and 1-2 sentence rationales. Only include items you have real sources for.\n\nResearch:\n${research}`;
  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, NewsSliceSchema);
  return object;
}
