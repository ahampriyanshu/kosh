import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  formatDisplayDate,
  renderRetroEmail,
  renderDailyEmail,
  renderRecapEmail,
  renderResearchEmail,
} from '../../lib/email-templates';
import type { RetroContent, DailyContent, RecapContent, ResearchContent } from '../../lib/schemas';

const dailyContent: DailyContent = {
  date: '2026-06-14',
  marketOutlook: 'Banks lead while <script>alert("x")</script> stays risky.',
  stocksToWatch: [
    {
      ticker: 'TCS.NS',
      name: 'Tata Consultancy Services',
      reason: 'Breakout & relative strength.',
      signal: 'bullish',
    },
  ],
  exitSignals: [{ ticker: 'HDFCBANK.NS', reason: 'Lost the 50DMA <support> zone.' }],
  topRecommendation: {
    ticker: 'RELIANCE.NS',
    action: 'buy',
    reasoning: 'Risk reward is clean & volume confirms.',
    confidence: 0.64,
  },
  sectorMovers: [{ sector: 'IT & Services', note: 'Defensives are firm.' }],
  fiiDiiSentiment: 'FII selling moderated.',
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
  retrospective: {
    calls: [],
    hits: 2,
    total: 3,
    summary: 'Most defensive calls worked.',
  },
  outlook: {
    themes: ['Rates & liquidity', 'IT earnings'],
    stocksToWatch: [
      {
        ticker: 'INFY.NS',
        name: 'Infosys',
        reason: 'Momentum improved.',
        signal: 'neutral',
      },
    ],
    recommendation: {
      ticker: 'INFY.NS',
      action: 'hold',
      reasoning: 'Wait for confirmation.',
      confidence: 0.58,
    },
  },
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
    expect(html).toContain('14th June, 2026');
    expect(html).not.toContain('Daily Brief - 2026-06-14');
    expect(html).toContain('Market Outlook');
    expect(html).toContain('Top Recommendation');
    expect(html).toContain('FII / DII Flow');
    expect(html).toContain('Exit Signals');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('renders mid-session alerts and portfolio scan details', () => {
    const html = renderRetroEmail(midSessionContent);

    expect(html).toContain('Mid-Session');
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

  it('renders recap retrospectives, themes, watches, and recommendations', () => {
    const html = renderRecapEmail(recapContent, 'Kosh Weekly Recap - 2026-W24');

    expect(html).toContain('Kosh Weekly Recap - 2026-W24');
    expect(html).toContain('Retrospective');
    expect(html).toContain('2/3 calls hit');
    expect(html).toContain('Themes to Watch');
    expect(html).toContain('Rates &amp; liquidity');
    expect(html).toContain('Stocks to Watch');
    expect(html).toContain('HOLD');
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
    expect(html).toContain('ahampriyanshu.com');
  });
});
