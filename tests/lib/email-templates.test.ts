import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  formatDisplayDate,
  renderRetroEmail,
  renderDailyEmail,
  renderWeeklyEmail,
  renderMonthlyEmail,
  renderRecapEmail,
  renderResearchEmail,
} from '../../lib/email-templates';
import type { RetroContent, DailyContent, WeeklyContent, MonthlyContent, RecapContent, ResearchContent } from '../../lib/schemas';

const sampleSnapshot = {
  asOf: '2026-06-15T02:30:00.000Z', window: '1d' as const,
  indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 23622.9, changePct: 1.99 }],
  globalIndices: [], commodities: [], currencies: [], topGainers: [], topLosers: [],
  mostActive: [], near52wHigh: [], near52wLow: [], volumeShockers: [], sectorRanking: [],
  news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
};

const dailyContent: DailyContent = {
  snapshot: sampleSnapshot,
  outlook: 'Markets look steady with IT leading. <script>alert("x")</script>',
  keyTakeaways: ['NIFTY 50 up 1.99%', 'IT sector leading', 'FII flows positive'],
};

const weeklyContent: WeeklyContent = {
  snapshot: { ...sampleSnapshot, window: '7d' as const },
  themes: ['Rotation into defensives', 'IT earnings season', 'Global rate cuts expected'],
  positionalBets: [
    { ticker: 'TCS.NS', name: 'TCS', thesis: 'Breakout on earnings', action: 'buy', signal: 'bullish', confidence: 0.72 },
  ],
};

const monthlyContent: MonthlyContent = {
  snapshot: { ...sampleSnapshot, window: '1mo' as const },
  sectorInsights: ['IT outperforming broader market', 'Banks consolidating'],
  macroThemes: ['Rate cut cycle beginning', 'INR stabilising'],
  midTermBets: [
    { ticker: 'INFY.NS', name: 'Infosys', thesis: 'Re-rating on margin expansion', action: 'buy', signal: 'bullish', confidence: 0.65 },
  ],
  ledgerRollup: null,
};

const midSessionContent: RetroContent = {
  date: '2026-06-14',
  summary: 'One watchlist name breached rules.',
  alerts: [
    {
      ticker: 'TCS.NS',
      name: 'Tata Consultancy Services',
      reason: 'Price broke support.',
      severity: 'high',
      triggeredRules: ['drawdown>3%', 'below <support>'],
    },
  ],
  evaluated: [
    {
      ticker: 'TCS.NS',
      name: 'Tata Consultancy Services',
      price: 3900.5,
      changePct: -3.42,
      note: 'Down on heavy volume\nwatch close.',
    },
  ],
};

const recapContent: RecapContent = {
  period: '2026-W24',
  sourceReportId: 'weekly-2026-W24',
  graded: [
    {
      ticker: 'TCS.NS',
      name: 'TCS',
      thesis: 'momentum',
      action: 'buy',
      entryRef: 3800,
      exitRef: 3950,
      changePct: 3.95,
      outcome: 'hit',
      note: 'ran',
    },
  ],
  hits: 1,
  total: 1,
  summary: '1/1 bets hit',
};

const researchContent: ResearchContent = {
  ticker: 'INFY.NS',
  name: 'Infosys',
  asOf: '2026-06-14T09:15:00.000+05:30',
  price: 1500.75,
  fundamental: 'Cash flow < capex pressure.',
  technical: 'Trend is improving.',
  sentiment: 'News flow is balanced.',
  recommendation: {
    action: 'buy',
    reasoning: 'Setup is attractive.',
    confidence: 0.71,
  },
};

describe('escapeHtml', () => {
  it('escapes user-controlled HTML characters', () => {
    expect(escapeHtml(`A&B <tag attr="x">'`)).toBe('A&amp;B &lt;tag attr=&quot;x&quot;&gt;&#39;');
  });
});

describe('formatDisplayDate', () => {
  it('formats ISO date strings with ordinal day labels', () => {
    expect(formatDisplayDate('2027-06-15')).toBe('15th June, 2027');
    expect(formatDisplayDate('2027-06-01')).toBe('1st June, 2027');
    expect(formatDisplayDate('2027-06-22')).toBe('22nd June, 2027');
    expect(formatDisplayDate('2027-06-13')).toBe('13th June, 2027');
  });
});

describe('email templates', () => {
  it('renders a branded, responsive daily brief with escaped content', () => {
    const html = renderDailyEmail(dailyContent);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('@media only screen and (max-width: 600px)');
    expect(html).toContain('Kosh');
    expect(html).toContain('Daily Brief');
    expect(html).toContain('15th June, 2026');
    expect(html).toContain('Outlook');
    expect(html).toContain('Key Takeaways');
    expect(html).toContain('Indian Indices');
    expect(html).toContain('NIFTY 50');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('renders a weekly email with themes, bets, and index table', () => {
    const html = renderWeeklyEmail(weeklyContent, '2026-W25');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Weekly Outlook');
    expect(html).toContain('2026-W25');
    expect(html).not.toContain('Weekly — 2026-W25');
    expect(html).toContain('Themes');
    expect(html).toContain('Rotation into defensives');
    expect(html).toContain('Positional Bets');
    expect(html).toContain('TCS');
    expect(html).toContain('Indian Indices');
    expect(html).toContain('NIFTY 50');
  });

  it('renders a monthly email with sector insights, macro themes, bets, and index table', () => {
    const html = renderMonthlyEmail(monthlyContent, '2026-06');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Monthly Digest');
    expect(html).toContain('2026-06');
    expect(html).not.toContain('Monthly — 2026-06');
    expect(html).toContain('Sector Insights');
    expect(html).toContain('IT outperforming broader market');
    expect(html).toContain('Macro Themes');
    expect(html).toContain('Rate cut cycle beginning');
    expect(html).toContain('Mid-Term Bets');
    expect(html).toContain('INFY');
    expect(html).toContain('Indian Indices');
    expect(html).toContain('NIFTY 50');
  });

  it('renders mid-session alerts and portfolio scan details', () => {
    const html = renderRetroEmail(midSessionContent);

    expect(html).toContain('Daily Retro');
    expect(html).toContain('14th June, 2026');
    expect(html).not.toContain('Mid-Session - 2026-06-14');
    expect(html).toContain('Sell Alerts');
    expect(html).toContain('Portfolio Scan');
    expect(html).toContain('High');
    expect(html).toContain('Rs 3,900.5');
    expect(html).toContain('-3.42%');
    expect(html).toContain('drawdown&gt;3%, below &lt;support&gt;');
    expect(html).toContain('Down on heavy volume<br>watch close.');
  });

  it('renders recap grading results with hit count and graded tickers', () => {
    const html = renderRecapEmail(recapContent, 'Weekly Recap');

    expect(html).toContain('Weekly Recap');
    expect(html).not.toContain('Kosh Weekly Recap - 2026-W24');
    expect(html).not.toContain('Kosh Weekly Recap — 2026-W24');
    expect(html).toContain('Grading Results');
    expect(html).toContain('1/1 bets hit');
    expect(html).toContain('1/1 bets hit');
    expect(html).toContain('TCS');
    expect(html).toContain('Bet-by-Bet Breakdown');
    expect(html).toContain('BUY');
  });

  it('renders research reports with the analysis sections', () => {
    const html = renderResearchEmail(researchContent);

    expect(html).toContain('Research - INFY.NS');
    expect(html).toContain('Snapshot');
    expect(html).toContain('Rs 1,500.75');
    expect(html).toContain('Recommendation');
    expect(html).toContain('Fundamental Analysis');
    expect(html).toContain('Technical Analysis');
    expect(html).toContain('Sentiment');
    expect(html).toContain('Cash flow &lt; capex pressure.');
    expect(html).toContain('made by');
    expect(html).toContain('>ahampriyanshu</a>');
    expect(html).toContain('href="https://ahampriyanshu.com"');
  });
});
