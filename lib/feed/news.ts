import { generateGroundedObject } from '../llm';
import { NewsSliceSchema, type NewsSlice } from '../schemas';

export async function fetchNews(now: Date = new Date()): Promise<NewsSlice> {
  const date = now.toISOString().slice(0, 10);
  const researchPrompt =
    `Research today's (${date}) most important Indian stock-market news using current sources. ` +
    `Cover: macro/policy (RBI, inflation, govt), global cues, earnings/results, sectoral moves, ` +
    `corporate actions/M&A, and specific stocks in focus. Also collect notable brokerage/analyst ` +
    `recommendations published recently (with the brokerage name, action, and any price target).`;
  const buildStructurePrompt = (research: string) =>
    `From the research, produce: "news" grouped by category ` +
    `(one of macro_policy, global_cues, earnings, sectoral, corporate_actions, stocks_in_focus), each item with ` +
    `headline, summary, source, optional tickers (NSE symbols like RELIANCE.NS), and sentiment (bullish/bearish/neutral). ` +
    `And "streetRecommendations": array of { ticker, name, brokerage, action (buy/sell/hold/accumulate/reduce), ` +
    `optional target (number), rationale }. Only include items you have real sources for.\n\nResearch:\n${research}`;
  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, NewsSliceSchema);
  return object;
}
