import type {
  AlertSeverity,
  RetroContent,
  DailyContent,
  WeeklyContent,
  MonthlyContent,
  RecapContent,
  ResearchContent,
  Signal,
  MarketSnapshot,
} from './schemas';
import { formatPeriodLabel, formatPeriodText } from './time';
import {
  safeArticleUrl,
  formatCategory,
  cleanSource,
  cleanTicker,
} from '../src/lib/news-format';
import { computeMoodSnapshot } from './sentiment';
import { publication } from './publication';
import { dateReportPath, reportPath } from './report-routes';

const font = `font-family:'Lato',Arial,Helvetica,sans-serif`;
const display = `font-family:'Newsreader',Georgia,Cambria,'Times New Roman',Times,serif`;
const mono = `font-family:'Lato',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums`;
const KOSH_URL = publication.url;
const AUTHOR_URL = publication.authorUrl;

const colors = {
  bg: publication.colors.paper,
  surface: publication.colors.paper,
  raised: publication.colors.inset,
  border: publication.colors.rule,
  hairline: publication.colors.rule,
  text: publication.colors.ink,
  muted: publication.colors.secondary,
  faint: publication.colors.tertiary,
  link: publication.colors.link,
  bullish: publication.colors.positive,
  bullishBg: '#eaf0e8',
  bullishBorder: '#c9dfcf',
  bearish: publication.colors.negative,
  bearishBg: '#f7eae5',
  bearishBorder: '#ead0cc',
  neutral: publication.colors.secondary,
  neutralBg: publication.colors.inset,
  neutralBorder: publication.colors.rule,
  medium: '#b7791f',
  mediumBg: '#fffbeb',
  mediumBorder: '#e8d9b6',
};

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function text(value: unknown): string {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function shortTicker(ticker: string): string {
  return cleanTicker(ticker);
}

function confidencePct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatPrice(value: number): string {
  return `Rs ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  const [, year, monthValue, dayValue] = match;
  const monthIndex = Number(monthValue) - 1;
  const day = Number(dayValue);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  if (!months[monthIndex] || day < 1 || day > 31) return value;

  const teen = day % 100 >= 11 && day % 100 <= 13;
  const suffix = teen
    ? 'th'
    : day % 10 === 1
      ? 'st'
      : day % 10 === 2
        ? 'nd'
        : day % 10 === 3
          ? 'rd'
          : 'th';
  return `${day}${suffix} ${months[monthIndex]}, ${year}`;
}

function badge(label: string, fg: string, bg: string, border: string): string {
  return `<span style="${font};display:inline-block;font-size:11px;font-weight:700;line-height:16px;color:${fg};background:${bg};border:1px solid ${border};padding:1px 5px;vertical-align:middle;text-transform:uppercase;letter-spacing:0.06em">${escapeHtml(label)}</span>`;
}

function signalBadge(signal: Signal): string {
  if (signal === 'bullish')
    return badge(
      'Bullish',
      colors.bullish,
      colors.bullishBg,
      colors.bullishBorder,
    );
  if (signal === 'bearish')
    return badge(
      'Bearish',
      colors.bearish,
      colors.bearishBg,
      colors.bearishBorder,
    );
  return badge(
    'Neutral',
    colors.neutral,
    colors.neutralBg,
    colors.neutralBorder,
  );
}

function severityBadge(severity: AlertSeverity): string {
  if (severity === 'high')
    return badge(
      'High',
      colors.bearish,
      colors.bearishBg,
      colors.bearishBorder,
    );
  if (severity === 'medium')
    return badge('Medium', colors.medium, colors.mediumBg, colors.mediumBorder);
  return badge('Low', colors.neutral, colors.neutralBg, colors.neutralBorder);
}

function actionBadge(action: string): string {
  if (action === 'buy')
    return badge('BUY', colors.bullish, colors.bullishBg, colors.bullishBorder);
  if (action === 'sell')
    return badge(
      'SELL',
      colors.bearish,
      colors.bearishBg,
      colors.bearishBorder,
    );
  return badge('HOLD', colors.neutral, colors.neutralBg, colors.neutralBorder);
}

function paragraph(content: unknown, color: string = colors.muted): string {
  return `<p style="${font};margin:0;color:${color};font-size:15px;line-height:24px">${text(content)}</p>`;
}

function section(title: string, body: string): string {
  return `<tr><td class="email-pad email-section" style="padding:28px 40px 0">
    <h2 style="${display};font-size:23px;line-height:28px;font-weight:500;letter-spacing:-0.02em;color:${colors.text};margin:0 0 16px;border-top:1px solid ${colors.border};padding-top:12px">${escapeHtml(title)}</h2>
    ${body}
  </td></tr>`;
}

function card(body: string, borderColor: string = colors.border): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-left:2px solid ${borderColor};background:${colors.raised}"><tr><td style="padding:16px 18px">${body}</td></tr></table>`;
}

function cardStack(cards: string[]): string {
  return cards
    .map(
      (item) => `
        <tr>
          <td style="padding:0 0 10px 0">${item}</td>
        </tr>
      `,
    )
    .join('');
}

function tickerLine(ticker: string, name?: string, trailing = ''): string {
  return `
    <div style="${font};font-size:14px;line-height:20px;margin:0 0 6px 0;color:${colors.text}">
      <span style="${mono};font-weight:700">${escapeHtml(shortTicker(ticker))}</span>
      ${name ? `<span style="color:${colors.muted};margin-left:6px">${escapeHtml(name)}</span>` : ''}
      ${trailing}
    </div>
  `;
}

function renderShell(options: {
  title: string;
  eyebrow: string;
  preheader: string;
  children: string;
  issueNumber?: number | string;
  webPath?: string;
}): string {
  const webUrl = `${KOSH_URL}${options.webPath ?? '/reports'}`;
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(options.title)} | ${publication.name}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Newsreader:wght@400;500;600&display=swap" rel="stylesheet"><!--<![endif]-->
  <style>
    :root { color-scheme:light; supported-color-schemes:light; }
    body { margin:0; padding:0; width:100%; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    td { overflow-wrap:break-word; }
    a { text-underline-offset:3px; }
    a:focus-visible { outline:2px solid ${colors.link}; outline-offset:3px; }
    @media only screen and (max-width: 600px) {
      .email-outer { padding:0 !important; }
      .email-pad { padding-left:20px !important; padding-right:20px !important; }
      .email-title { font-size:30px !important; line-height:34px !important; }
      .broadsheet-name { font-size:46px !important; line-height:50px !important; }
      .email-column, .email-label, .email-value { display:block !important; width:100% !important; }
      .email-column { padding:0 0 20px !important; }
      .email-label { border-bottom:0 !important; padding-bottom:4px !important; white-space:normal !important; }
      .email-value { padding-top:0 !important; }
      .email-data { font-size:12px !important; }
      .email-data td, .email-data th { padding-left:0 !important; padding-right:8px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${colors.bg};${font};color:${colors.text}">
  <div aria-hidden="true" style="display:none!important;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(options.preheader.slice(0, 180))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${colors.bg}"><tr>
    <td class="email-outer" align="center" style="padding:28px 12px">
      <!--[if mso]><table role="presentation" width="680" align="center"><tr><td><![endif]-->
      <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" bgcolor="${colors.surface}" style="width:100%;max-width:680px;background:${colors.surface};table-layout:fixed">
        <tr><td class="email-pad" style="padding:12px 40px;border-bottom:1px solid ${colors.border}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="${font};font-size:11px;line-height:16px;color:${colors.muted}">${options.issueNumber !== undefined ? `Volume ${escapeHtml(options.issueNumber)} / ` : ''}${escapeHtml(options.eyebrow)}</td><td align="right" style="${font};font-size:11px;line-height:16px"><a href="${escapeHtml(webUrl)}" style="color:${colors.link};text-decoration:none">Read online &#8599;</a></td></tr></table>
        </td></tr>
        <tr><td class="email-pad" align="center" style="padding:26px 40px 24px;text-align:center">
          <a href="${KOSH_URL}" class="broadsheet-name" target="_blank" rel="noopener noreferrer" style="${display};font-size:60px;line-height:64px;font-weight:600;letter-spacing:-3px;color:${colors.text};text-decoration:none">${publication.name}</a>
          <p style="${display};font-size:15px;line-height:21px;color:${colors.muted};margin:7px 0 0">${publication.tagline}</p>
        </td></tr>
        <tr><td class="email-pad" style="padding:22px 40px 6px;border-top:3px double ${publication.colors.strongRule}">
          <h1 class="email-title" style="${display};margin:0;font-size:36px;line-height:40px;font-weight:500;letter-spacing:-0.8px;color:${colors.text}">${escapeHtml(options.title)}</h1>
        </td></tr>
        ${options.children}
        <tr><td class="email-pad" style="padding:32px 40px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="${colors.link}" style="background:${colors.link}"><a href="${escapeHtml(webUrl)}" style="${font};display:inline-block;padding:13px 20px;border:1px solid ${colors.link};color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none">Read this edition online &#8599;</a></td></tr></table>
        </td></tr>
        <tr><td class="email-pad" style="padding:22px 40px;border-top:3px double ${publication.colors.strongRule}">
          <p style="${display};font-size:22px;line-height:26px;letter-spacing:-0.5px;color:${colors.text};margin:0 0 12px">${publication.name}</p>
          <p style="${font};font-size:12px;line-height:20px;margin:0 0 14px"><a href="${KOSH_URL}/reports" style="color:${colors.link}">Reports</a> &nbsp; / &nbsp; <a href="${KOSH_URL}/research" style="color:${colors.link}">Research</a> &nbsp; / &nbsp; <a href="${KOSH_URL}/sentiment-index" style="color:${colors.link}">Market mood</a></p>
          <p style="${font};font-size:11px;line-height:18px;color:${colors.muted};margin:0 0 14px">Kosh is an experimental, learning-focused project. It is not investment advice or a recommendation to buy or sell securities. Market data reflects the published edition.</p>
          <p style="${font};font-size:11px;line-height:18px;color:${colors.muted};margin:0">made by <a href="${AUTHOR_URL}" target="_blank" rel="noopener noreferrer" style="color:${colors.link};text-decoration:underline">ahampriyanshu</a></p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr></table>
</body></html>`;
}

function indexTable(snapshot: MarketSnapshot): string {
  if (!snapshot.indianIndices.length)
    return paragraph('No index data available.');
  const rows = snapshot.indianIndices
    .map(
      (i) => `
        <tr>
          <td style="${font};padding:7px 10px 7px 0;color:${colors.text};font-size:14px;line-height:20px;border-bottom:1px solid ${colors.border}">${escapeHtml(i.name)}</td>
          <td align="right" style="${mono};padding:7px 10px 7px 0;color:${colors.text};font-size:14px;line-height:20px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(i.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:7px 0;font-size:14px;line-height:20px;white-space:nowrap;color:${i.changePct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}">${escapeHtml(i.changePct >= 0 ? '+' : '')}${escapeHtml(i.changePct.toFixed(2))}%</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-data" style="border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid ${colors.text}">
        <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:12px;font-weight:700">Index</th>
        <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:12px;font-weight:700">LTP</th>
        <th align="right" style="${font};padding:0 0 6px 0;color:${colors.muted};font-size:12px;font-weight:700">Change</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

function betRows(
  bets: Array<{
    ticker: string;
    name?: string;
    action: string;
    signal: string;
    confidence: number;
    thesis: string;
  }>,
): string {
  if (!bets.length) return paragraph('No bets for this period.');
  return bets
    .map(
      (
        bet,
      ) => `<div style="padding:0 0 18px;margin:0 0 18px;border-bottom:1px solid ${colors.border}">
    ${tickerLine(bet.ticker, bet.name)}
    <div style="margin:8px 0 12px">${actionBadge(bet.action)} &nbsp; ${signalBadge(bet.signal as Signal)} <span style="${font};font-size:12px;color:${colors.muted}">&nbsp; ${confidencePct(bet.confidence)} confidence</span></div>
    ${paragraph(bet.thesis)}
  </div>`,
    )
    .join('');
}

function bulletList(items: string[]): string {
  if (!items.length) return paragraph('Nothing to report.');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items
    .map(
      (item) => `
        <tr>
          <td style="${font};padding:3px 10px 5px 0;color:${colors.text};font-size:14px;line-height:22px;vertical-align:top">&#x2014;</td>
          <td style="${font};padding:3px 0 5px 0;color:${colors.text};font-size:14px;line-height:22px;vertical-align:top">${text(item)}</td>
        </tr>
      `,
    )
    .join('')}</table>`;
}

function metricTable(metrics: Array<{ label: string; value: string }>): string {
  return fixedRows(metrics ?? []);
}

function fixedRows(rows: Array<{ label: string; value: string }>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${rows
      .map(
        (row) => `
      <tr>
        <td class="email-label" width="28%" style="${font};padding:10px 16px 10px 0;color:${colors.muted};font-size:12px;font-weight:700;line-height:20px;vertical-align:top;border-bottom:1px solid ${colors.border}">${escapeHtml(row.label)}</td>
        <td class="email-value" style="${font};padding:10px 0;color:${colors.text};font-size:14px;line-height:21px;vertical-align:top;border-bottom:1px solid ${colors.border}">${text(row.value)}</td>
      </tr>
    `,
      )
      .join('')}
  </table>`;
}

function targetRows(
  targets: Array<{
    source: string;
    target: string;
    duration: string;
    view: string;
  }>,
): string {
  if (!targets.length)
    return paragraph('No sourced targets found.', colors.faint);
  return fixedRows(
    targets.map((target) => ({
      label: target.source,
      value: `${target.target} · ${target.duration} · ${target.view}`,
    })),
  );
}

function learningLoopBlock(
  learnings: { worked: string[]; missed: string[] } | undefined,
): string {
  const worked = learnings?.worked ?? [];
  const missed = learnings?.missed ?? [];
  if (!worked.length && !missed.length)
    return paragraph('No learning notes for this period.');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td class="email-column" width="50%" style="padding:0 12px 0 0;vertical-align:top">
          ${subLabel('What worked', colors.bullish)}
          ${bulletList(worked)}
        </td>
        <td class="email-column" width="50%" style="padding:0 0 0 12px;vertical-align:top">
          ${subLabel('What missed', colors.bearish)}
          ${bulletList(missed)}
        </td>
      </tr>
    </table>
  `;
}

// ---- Daily Brief Components ----

function renderKeyMarketBar(s: MarketSnapshot): string {
  return indexTable({ ...s, indianIndices: s.indianIndices.slice(0, 4) });
}

function renderKeyTakeawaysBlock(keyTakeaways: string[] = []): string {
  if (!keyTakeaways || keyTakeaways.length === 0) return '';
  const bullets = keyTakeaways
    .map(
      (item) => `
        <tr>
          <td style="${font};padding:4px 8px 4px 0;color:${colors.text};font-size:14px;line-height:22px;vertical-align:top;width:14px;font-weight:700">&#x2014;</td>
          <td style="${font};padding:4px 0 4px 0;color:${colors.text};font-size:14px;line-height:22px;vertical-align:top">${text(item)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${bullets}
    </table>
  `;
}

function renderDeskNoteBlock(
  outlook: string,
  keyTakeaways: string[] = [],
): string {
  let out = `
    <div style="margin:0 0 16px 0">
      <p style="${display};margin:0;color:${colors.text};font-size:19px;line-height:29px">
        ${text(outlook)}
      </p>
    </div>
  `;

  if (keyTakeaways && keyTakeaways.length > 0) {
    out += `
      <div style="border-top:1px dashed ${colors.border};padding-top:12px;margin-top:12px">
        <div style="${font};font-size:12px;font-weight:700;color:${colors.muted};margin:0 0 8px 0">Key Takeaways</div>
        ${renderKeyTakeawaysBlock(keyTakeaways)}
      </div>
    `;
  }

  return out;
}

function renderHeadlinesDigest(
  news: MarketSnapshot['news'],
  limit = 8,
): string {
  const seen = new Set<string>();
  const items = news
    .flatMap((group) =>
      group.items.map((item) => ({ ...item, category: group.category })),
    )
    .filter((item) => {
      if (!item.headline.trim() || seen.has(item.headline)) return false;
      seen.add(item.headline);
      return true;
    })
    .slice(0, limit);
  if (!items.length) return paragraph('No headlines in this edition.');
  return items
    .map((item, index) => {
      const url = safeArticleUrl(item.url);
      const source = cleanSource(item.source);
      const headline = escapeHtml(item.headline);
      return `<div style="padding:${index === 0 ? '0 0 20px' : '20px 0'};border-bottom:1px solid ${colors.border}">
      <p style="${font};margin:0 0 6px;color:${colors.bearish};font-size:12px;line-height:18px;font-weight:700">${escapeHtml(formatCategory(item.category))}</p>
      <h3 style="${display};font-size:${index === 0 ? '25' : '21'}px;font-weight:600;line-height:1.2;margin:0 0 8px;color:${colors.text}">${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:${colors.text};text-decoration:none">${headline}</a>` : headline}</h3>
      ${item.summary && item.summary !== item.headline ? paragraph(item.summary) : ''}
      ${source ? `<p style="${font};font-size:12px;line-height:18px;color:${colors.muted};margin:8px 0 0">${escapeHtml(source)}</p>` : ''}
    </div>`;
    })
    .join('');
}

function subLabel(label: string, color: string): string {
  return `<div style="${font};font-size:12px;font-weight:700;color:${color};margin:0 0 6px 0">${escapeHtml(label)}</div>`;
}

function near52List(
  rows: Array<{
    ticker: string;
    name: string;
    ltp: number;
    pctFromHigh?: number;
    pctFromLow?: number;
  }>,
  kind: 'high' | 'low',
): string {
  if (!rows.length) {
    return `<p style="${font};margin:0;color:${colors.faint};font-size:13px;line-height:20px">No stocks within 2% of their 52-week ${kind}.</p>`;
  }
  const color = kind === 'high' ? colors.bearish : colors.bullish;
  const sign = kind === 'high' ? '−' : '+';
  const body = rows
    .map((r) => {
      const pct = kind === 'high' ? (r.pctFromHigh ?? 0) : (r.pctFromLow ?? 0);
      return `
        <tr>
          <td style="${font};padding:10px 10px 10px 0;color:${colors.text};font-size:13px;font-weight:700;border-bottom:1px solid ${colors.border}">${escapeHtml(shortTicker(r.ticker))}<br><span style="font-size:12px;font-weight:400;color:${colors.muted}">${escapeHtml(r.name)}</span></td>
          <td align="right" style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;white-space:nowrap;color:${color};border-bottom:1px solid ${colors.border}">${sign}${escapeHtml(pct.toFixed(2))}%</td>
        </tr>
      `;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${body}</table>`;
}

function fiftyTwoBlock(s: MarketSnapshot): string {
  const highs = s.near52wHigh ?? [];
  const lows = s.near52wLow ?? [];

  return (
    subLabel('Near 52-Week High (Within 2%)', colors.bullish) +
    near52List(highs.slice(0, 5), 'high') +
    '<div style="height:16px;line-height:16px">&nbsp;</div>' +
    subLabel('Near 52-Week Low (Within 2%)', colors.bearish) +
    near52List(lows.slice(0, 5), 'low')
  );
}

function renderMarketConsensus(s: MarketSnapshot): string {
  const sentiment = s.sentiment ?? computeMoodSnapshot(s, 'morning');
  const score = sentiment.composite;
  const regime = sentiment.regime;
  const summary = sentiment.summary;

  const isBullish = score >= 55;
  const isBearish = score <= 45;
  const scoreColor = isBullish
    ? colors.bullish
    : isBearish
      ? colors.bearish
      : colors.neutral;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${colors.border}">
      <tr>
        <td style="padding:14px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr>
              <td align="left" style="vertical-align:middle">
                <span style="${font};font-size:12px;font-weight:700;color:${colors.muted}">Pre-Market Consensus: </span>
                <span style="${font};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:${scoreColor}">${escapeHtml(regime)}</span>
              </td>
              <td align="right" style="vertical-align:middle">
                <span style="${mono};font-size:13px;font-weight:700;color:${scoreColor}">${score} / 100</span>
              </td>
            </tr>
          </table>
          <p style="${font};margin:8px 0 0 0;color:${colors.muted};font-size:13px;line-height:20px">
            ${text(summary)}
          </p>
        </td>
      </tr>
    </table>
  `;
}

function renderCorporateActions(s: MarketSnapshot): string {
  if (!s.corporateActions.length)
    return paragraph('No corporate actions in this edition.');
  return fixedRows(
    s.corporateActions.slice(0, 6).map((action) => ({
      label: `${shortTicker(action.ticker)} · ${action.type}`,
      value: formatDisplayDate(action.date),
    })),
  );
}

export function renderDailyEmail(
  content: DailyContent,
  issueNumber?: number,
): string {
  const s = content.snapshot;

  return renderShell({
    title: 'Daily Brief',
    eyebrow: formatDisplayDate(s.asOf.slice(0, 10)),
    preheader: content.outlook,
    children:
      section('From the desk', renderDeskNoteBlock(content.outlook)) +
      section('Market Cues', renderKeyMarketBar(s)) +
      section('In the news', renderHeadlinesDigest(s.news, 8)) +
      (content.keyTakeaways && content.keyTakeaways.length > 0
        ? section(
            'Key Takeaways',
            renderKeyTakeawaysBlock(content.keyTakeaways),
          )
        : '') +
      section('52-Week Range Extremes', fiftyTwoBlock(s)) +
      section('Market Consensus & Mood', renderMarketConsensus(s)) +
      section('Corporate Actions', renderCorporateActions(s)),
    issueNumber,
    webPath: dateReportPath(s.asOf.slice(0, 10)),
  });
}

export function renderWeeklyEmail(
  content: WeeklyContent,
  period: string,
): string {
  const periodLabel = formatPeriodLabel(period);
  const parts: string[] = [];

  if (content.themes && content.themes.length > 0) {
    parts.push(section('Themes', bulletList(content.themes)));
  }

  if (content.multiAssetScorecard && content.multiAssetScorecard.length > 0) {
    const assetRows = content.multiAssetScorecard
      .map(
        (a) => `
        <tr>
          <td style="${font};padding:7px 10px 7px 0;color:${colors.text};font-size:13px;line-height:18px;border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(a.asset)}</strong> <span style="font-size:11px;color:${colors.muted}">${escapeHtml(a.symbol)}</span></td>
          <td align="right" style="${mono};padding:7px 10px 7px 0;color:${colors.text};font-size:13px;line-height:18px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(a.close.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:7px 0;font-size:13px;line-height:18px;white-space:nowrap;color:${a.returnPct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(a.returnPct >= 0 ? '+' : '')}${escapeHtml(a.returnPct.toFixed(2))}%</strong></td>
        </tr>`,
      )
      .join('');
    parts.push(
      section(
        'Multi-Asset Scorecard',
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${assetRows}</table>`,
      ),
    );
  }

  if (content.sectorGrowth && content.sectorGrowth.length > 0) {
    const secRows = content.sectorGrowth
      .map(
        (s) => `
        <tr>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;border-bottom:1px solid ${colors.border}">${escapeHtml(String(s.rank))}. ${escapeHtml(s.sector)}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;color:${s.weeklyReturnPct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(s.weeklyReturnPct >= 0 ? '+' : '')}${escapeHtml(s.weeklyReturnPct.toFixed(2))}%</strong></td>
        </tr>`,
      )
      .join('');
    parts.push(
      section(
        'Sector Growth & Relative Rotation',
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${secRows}</table>`,
      ),
    );
  }

  if (content.fiiDiiWeekly) {
    const f = content.fiiDiiWeekly;
    const fiiHtml = `<div style="${mono};font-size:13px;padding:8px 0;border-bottom:1px solid ${colors.border}">
      <div>FII Net Cash: <strong style="color:${f.fiiNetCrore >= 0 ? colors.bullish : colors.bearish}">${f.fiiNetCrore >= 0 ? '+' : '−'}₹${Math.abs(f.fiiNetCrore).toLocaleString('en-IN')} cr</strong></div>
      <div>DII Net Cash: <strong style="color:${f.diiNetCrore >= 0 ? colors.bullish : colors.bearish}">${f.diiNetCrore >= 0 ? '+' : '−'}₹${Math.abs(f.diiNetCrore).toLocaleString('en-IN')} cr</strong></div>
      ${f.summary ? `<p style="${font};font-size:12px;color:${colors.muted};margin:6px 0 0 0">${escapeHtml(f.summary)}</p>` : ''}
    </div>`;
    parts.push(section('Institutional Cash Flow Dynamics', fiiHtml));
  }

  if (content.portfolioFocus && content.portfolioFocus.length > 0) {
    const portRows = content.portfolioFocus
      .map(
        (p) => `
        <div style="padding:8px 0;border-bottom:1px solid ${colors.border}">
          <div style="${mono};font-size:13px;font-weight:700;color:${colors.text}">${escapeHtml(p.ticker.replace('.NS', ''))} · <span style="${font};font-weight:400;color:${colors.muted}">${escapeHtml(p.name)}</span></div>
          <div style="${font};font-size:12px;color:${colors.muted};margin:2px 0"><strong style="color:${colors.text}">Recent:</strong> ${escapeHtml(p.recentEvents)}</div>
          <div style="${font};font-size:12px;color:${colors.text};margin:2px 0"><strong style="color:${colors.text}">Upcoming:</strong> ${escapeHtml(p.upcomingCatalysts)}</div>
        </div>`,
      )
      .join('');
    parts.push(section('Portfolio Focus & Catalyst Radar', portRows));
  }

  if (content.iposInFocus && content.iposInFocus.length > 0) {
    const ipoRows = content.iposInFocus
      .map(
        (ipo) => `
        <tr>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(ipo.company)}</strong></td>
          <td style="${mono};padding:6px 10px 6px 0;color:${colors.muted};font-size:12px;border-bottom:1px solid ${colors.border}">${escapeHtml(ipo.priceBand)}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:12px;color:${colors.bullish};border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(ipo.gmp)}</strong></td>
        </tr>`,
      )
      .join('');
    parts.push(
      section(
        'IPOs in Focus · Primary Market',
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${ipoRows}</table>`,
      ),
    );
  }

  if (content.positionalBets && content.positionalBets.length > 0) {
    parts.push(section('Positional Bets', betRows(content.positionalBets)));
  }

  parts.push(section('Indian Indices', indexTable(content.snapshot)));

  return renderShell({
    title: 'Weekly Report',
    eyebrow: periodLabel,
    preheader:
      content.themes.slice(0, 3).join('; ') || `Kosh Weekly ${periodLabel}`,
    webPath: reportPath({ type: 'weekly', dateKey: period, date: period }),
    children: parts.join(''),
  });
}

export function renderMonthlyEmail(
  content: MonthlyContent,
  period: string,
): string {
  const parts = [
    section('Sector Insights', bulletList(content.sectorInsights)),
    section('Macro Themes', bulletList(content.macroThemes)),
  ];

  if (content.multiAssetScorecard && content.multiAssetScorecard.length > 0) {
    const assetRows = content.multiAssetScorecard
      .map(
        (a) => `
        <tr>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;border-bottom:1px solid ${colors.border}">${escapeHtml(a.asset)}</td>
          <td style="${mono};padding:6px 10px 6px 0;color:${colors.muted};font-size:13px;border-bottom:1px solid ${colors.border}">${escapeHtml(a.close.toLocaleString('en-IN'))}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;color:${a.returnPct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(a.returnPct >= 0 ? '+' : '')}${escapeHtml(a.returnPct.toFixed(2))}%</strong></td>
        </tr>`,
      )
      .join('');
    parts.push(
      section(
        'Multi-Asset Scorecard',
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${assetRows}</table>`,
      ),
    );
  }

  if (content.sectorLeadership && content.sectorLeadership.length > 0) {
    const secRows = content.sectorLeadership
      .map(
        (s) => `
        <tr>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;border-bottom:1px solid ${colors.border}">${escapeHtml(String(s.rank))}. ${escapeHtml(s.sector)}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;color:${s.weeklyReturnPct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}"><strong>${escapeHtml(s.weeklyReturnPct >= 0 ? '+' : '')}${escapeHtml(s.weeklyReturnPct.toFixed(2))}%</strong></td>
        </tr>`,
      )
      .join('');
    parts.push(
      section(
        'Sector Leadership',
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${secRows}</table>`,
      ),
    );
  }

  if (content.fiiDiiMonthly) {
    const f = content.fiiDiiMonthly;
    const fiiHtml = `<div style="${mono};font-size:13px;padding:8px 0;border-bottom:1px solid ${colors.border}">
      <div>FII Net Cash: <strong style="color:${f.fiiNetCrore >= 0 ? colors.bullish : colors.bearish}">${f.fiiNetCrore >= 0 ? '+' : '−'}₹${Math.abs(f.fiiNetCrore).toLocaleString('en-IN')} cr</strong></div>
      <div>DII Net Cash: <strong style="color:${f.diiNetCrore >= 0 ? colors.bullish : colors.bearish}">${f.diiNetCrore >= 0 ? '+' : '−'}₹${Math.abs(f.diiNetCrore).toLocaleString('en-IN')} cr</strong></div>
      ${f.summary ? `<p style="${font};font-size:12px;color:${colors.muted};margin:6px 0 0 0">${escapeHtml(f.summary)}</p>` : ''}
    </div>`;
    parts.push(section('Institutional Monthly Flow Dynamics', fiiHtml));
  }

  if (content.midTermBets && content.midTermBets.length > 0) {
    parts.push(section('Mid-Term Bets', betRows(content.midTermBets)));
  }

  if (content.ledgerRollup) {
    const hitsSummary = `<div style="${font};font-size:15px;line-height:22px;margin:0 0 8px 0;color:${colors.text};font-weight:700">${escapeHtml(String(content.ledgerRollup.hits))}/${escapeHtml(String(content.ledgerRollup.total))} bets hit</div>`;
    parts.push(
      section(
        'Ledger Rollup',
        card(hitsSummary + paragraph(content.ledgerRollup.summary)) +
          '<div style="height:12px;line-height:12px">&nbsp;</div>' +
          learningLoopBlock(content.ledgerRollup.learnings),
      ),
    );
  }

  parts.push(section('Indian Indices', indexTable(content.snapshot)));

  return renderShell({
    title: 'Monthly Report',
    eyebrow: `Month ${period}`,
    preheader:
      content.macroThemes.slice(0, 3).join('; ') || `Kosh Monthly ${period}`,
    webPath: reportPath({ type: 'monthly', dateKey: period, date: period }),
    children: parts.join(''),
  });
}

export function renderRetroEmail(content: RetroContent): string {
  const alertCards = content.alerts.length
    ? content.alerts.map((alert) =>
        card(
          tickerLine(
            alert.ticker,
            alert.name,
            ` <span style="margin-left:8px">${severityBadge(alert.severity)}</span>`,
          ) +
            paragraph(alert.reason) +
            (alert.triggeredRules.length
              ? `<div style="${mono};margin-top:8px;color:${colors.faint};font-size:12px;line-height:18px">${escapeHtml(alert.triggeredRules.join(', '))}</div>`
              : ''),
        ),
      )
    : [card(paragraph('No sell alerts triggered this session.'))];

  const evaluatedRows = content.evaluated
    .map(
      (item) => `
        <tr>
          <td style="${mono};padding:8px 8px;border-bottom:1px solid ${colors.border};font-size:13px;font-weight:700;color:${colors.text}">${escapeHtml(shortTicker(item.ticker))}</td>
          <td align="right" style="${mono};padding:8px 8px;border-bottom:1px solid ${colors.border};font-size:13px;color:${colors.text};white-space:nowrap">${escapeHtml(formatPrice(item.price))}</td>
          <td align="right" style="${mono};padding:8px 8px;border-bottom:1px solid ${colors.border};font-size:13px;color:${item.changePct < 0 ? colors.bearish : item.changePct > 0 ? colors.bullish : colors.neutral};white-space:nowrap">${escapeHtml(formatPct(item.changePct))}</td>
        </tr>
        <tr><td colspan="3" style="${font};padding:0 8px 14px;font-size:14px;line-height:21px;color:${colors.muted};border-bottom:1px solid ${colors.border}">${text(item.note)}</td></tr>
      `,
    )
    .join('');

  return renderShell({
    title: 'Daily Retro',
    eyebrow: formatDisplayDate(content.date),
    preheader: content.summary,
    webPath: dateReportPath(content.date),
    children:
      section(
        'Session Summary',
        `<p style="${display};margin:0;color:${colors.text};font-size:19px;line-height:29px">${text(content.summary)}</p>`,
      ) +
      section(
        'Sell Alerts',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardStack(alertCards)}</table>`,
      ) +
      section(
        'Portfolio Scan',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid ${colors.text}">
              <th align="left" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:12px;font-weight:700">Ticker</th>
              <th align="right" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:12px;font-weight:700">Price</th>
              <th align="right" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:12px;font-weight:700">Change</th>
            </tr>
          </thead>
          <tbody>
            ${evaluatedRows || `<tr><td colspan="3">${paragraph('No holdings were evaluated in this edition.')}</td></tr>`}
          </tbody>
        </table>`,
      ),
  });
}

export function renderRecapEmail(content: RecapContent, title: string): string {
  const periodLabel = formatPeriodLabel(content.period);
  const hitsSummary = `<div style="${font};font-size:15px;line-height:22px;margin:0 0 8px 0;color:${colors.text};font-weight:700">${escapeHtml(String(content.hits))}/${escapeHtml(String(content.total))} bets hit</div>`;

  const gradedRows = content.graded.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px">
        <thead>
          <tr style="border-bottom:1px solid ${colors.text}">
            <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:12px;font-weight:700">Ticker</th>
            <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:12px;font-weight:700">Action</th>
            <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:12px;font-weight:700">Change</th>
            <th align="left" style="${font};padding:0 0 6px 0;color:${colors.muted};font-size:12px;font-weight:700">Outcome</th>
          </tr>
        </thead>
        <tbody>
          ${content.graded
            .map((bet) => {
              const changePctStr =
                bet.changePct > 0
                  ? `+${bet.changePct.toFixed(2)}%`
                  : `${bet.changePct.toFixed(2)}%`;
              const changePctColor =
                bet.changePct > 0
                  ? colors.bullish
                  : bet.changePct < 0
                    ? colors.bearish
                    : colors.neutral;
              const outcomeColor =
                bet.outcome === 'hit'
                  ? colors.bullish
                  : bet.outcome === 'miss'
                    ? colors.bearish
                    : colors.neutral;
              return `
                <tr>
                  <td style="${mono};padding:8px 10px 8px 0;color:${colors.text};font-size:13px;font-weight:700;vertical-align:top;border-bottom:1px solid ${colors.border}">${escapeHtml(bet.ticker.replace('.NS', ''))}</td>
                  <td style="${font};padding:8px 10px 8px 0;vertical-align:top;border-bottom:1px solid ${colors.border}">${actionBadge(bet.action)}</td>
                  <td align="right" style="${mono};padding:8px 10px 8px 0;color:${changePctColor};font-size:13px;vertical-align:top;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(changePctStr)}</td>
                  <td style="${font};padding:8px 0;color:${outcomeColor};font-size:13px;font-weight:700;vertical-align:top;text-transform:uppercase;border-bottom:1px solid ${colors.border}">${escapeHtml(bet.outcome)}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>`
    : paragraph('No bets to grade for this period.');

  return renderShell({
    title,
    eyebrow: periodLabel,
    preheader: formatPeriodText(content.summary) || title,
    children:
      section(
        'Grading Results',
        card(hitsSummary + paragraph(formatPeriodText(content.summary))),
      ) +
      section('Learning Loop', learningLoopBlock(content.learnings)) +
      section('Bet-by-Bet Breakdown', gradedRows),
  });
}

export function renderResearchEmail(content: ResearchContent): string {
  const rec = content.recommendation;
  return renderShell({
    title: `Research - ${content.name}`,
    webPath: '/research',
    eyebrow: 'Research',
    preheader: `${rec.action.toUpperCase()} ${content.ticker}: ${rec.reasoning}`,
    children:
      section(
        'Snapshot',
        card(
          tickerLine(content.ticker, content.name) +
            metricTable(content.metrics),
        ),
      ) +
      section(
        'Fundamentals',
        fixedRows([
          { label: 'Growth', value: content.fundamentals.growth },
          { label: 'Valuation', value: content.fundamentals.valuation },
        ]),
      ) +
      section(
        'Technicals',
        fixedRows([
          { label: 'Trend', value: content.technicals.trend },
          { label: 'Momentum', value: content.technicals.momentum },
          { label: 'Key levels', value: content.technicals.levels },
        ]),
      ) +
      section(
        'Sentiment',
        fixedRows([
          { label: 'News', value: content.sentiment.news },
          { label: 'Brokerage', value: content.sentiment.brokerage },
        ]),
      ) +
      section(
        'Recommendation',
        card(
          `<div style="margin:0 0 8px 0">${actionBadge(rec.action)}</div>` +
            paragraph(rec.reasoning),
          rec.action === 'buy' ? colors.bullish : colors.border,
        ),
      ) +
      section(
        'Entry & Exit',
        fixedRows([
          { label: 'Fundamental', value: content.entryExit.fundamental },
          {
            label: 'Technical / Sentiment',
            value: content.entryExit.technicalSentiment,
          },
        ]),
      ) +
      section('Target', targetRows(content.targets ?? [])),
  });
}
