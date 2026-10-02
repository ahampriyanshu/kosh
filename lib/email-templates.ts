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
import { EMAIL_LOGO_CONTENT_ID } from './email-assets';
import { formatPeriodLabel, formatPeriodText } from './time';

const font = `font-family:'Newsreader',Georgia,Cambria,'Times New Roman',Times,serif`;
const display = `font-family:'Newsreader',Georgia,Cambria,'Times New Roman',Times,serif`;
const mono = `font-family:'Newsreader',Georgia,Cambria,'Times New Roman',Times,serif;font-variant-numeric:tabular-nums`;
const KOSH_URL = 'https://kosh.ahampriyanshu.com';
const AUTHOR_URL = 'https://ahampriyanshu.com';

const colors = {
  bg: '#ffffff',
  surface: '#ffffff',
  raised: '#ffffff',
  border: '#e5e7eb',
  hairline: '#e5e7eb',
  text: '#111827',
  muted: '#4b5563',
  faint: '#9ca3af',
  link: '#111827',
  bullish: '#16803c',
  bullishBg: '#ffffff',
  bullishBorder: '#16803c',
  bearish: '#c2412f',
  bearishBg: '#ffffff',
  bearishBorder: '#c2412f',
  neutral: '#6b7280',
  neutralBg: '#ffffff',
  neutralBorder: '#e5e7eb',
  medium: '#b7791f',
  mediumBg: '#ffffff',
  mediumBorder: '#b7791f',
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
  return ticker.replace('.NS', '');
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
  const suffix = teen ? 'th' : day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
  return `${day}${suffix} ${months[monthIndex]}, ${year}`;
}

function badge(label: string, fg: string, bg: string, border: string): string {
  return `<span style="${font};display:inline-block;font-size:11px;font-weight:700;line-height:16px;color:${fg};background:${bg};border:1px solid ${border};padding:1px 5px;vertical-align:middle;text-transform:uppercase;letter-spacing:0.06em">${escapeHtml(label)}</span>`;
}

function signalBadge(signal: Signal): string {
  if (signal === 'bullish') return badge('Bullish', colors.bullish, colors.bullishBg, colors.bullishBorder);
  if (signal === 'bearish') return badge('Bearish', colors.bearish, colors.bearishBg, colors.bearishBorder);
  return badge('Neutral', colors.neutral, colors.neutralBg, colors.neutralBorder);
}

function severityBadge(severity: AlertSeverity): string {
  if (severity === 'high') return badge('High', colors.bearish, colors.bearishBg, colors.bearishBorder);
  if (severity === 'medium') return badge('Medium', colors.medium, colors.mediumBg, colors.mediumBorder);
  return badge('Low', colors.neutral, colors.neutralBg, colors.neutralBorder);
}

function actionBadge(action: string): string {
  if (action === 'buy') return badge('BUY', colors.bullish, colors.bullishBg, colors.bullishBorder);
  if (action === 'sell') return badge('SELL', colors.bearish, colors.bearishBg, colors.bearishBorder);
  return badge('HOLD', colors.neutral, colors.neutralBg, colors.neutralBorder);
}

function paragraph(content: unknown, color = colors.muted): string {
  return `<p style="${font};margin:0;color:${color};font-size:15px;line-height:24px">${text(content)}</p>`;
}

function section(title: string, body: string): string {
  return `
    <tr>
      <td class="email-pad" style="padding:24px 32px 0 32px">
        <div style="border-bottom:1px solid ${colors.text};padding-bottom:4px;margin-bottom:14px">
          <h2 style="${font};margin:0;color:${colors.text};font-size:16px;line-height:22px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">${escapeHtml(title)}</h2>
        </div>
        <div>${body}</div>
      </td>
    </tr>
  `;
}

function card(body: string, borderColor = colors.border): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid ${borderColor}">
      <tr>
        <td style="padding:14px 16px">${body}</td>
      </tr>
    </table>
  `;
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
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(options.title)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .email-outer { padding: 0 !important; }
        .email-container { border-left: 0 !important; border-right: 0 !important; border-top: 0 !important; border-bottom: 0 !important; }
        .email-pad { padding-left: 18px !important; padding-right: 18px !important; }
        .email-title { font-size: 13px !important; }
        .broadsheet-name { font-size: 28px !important; line-height: 32px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${colors.bg};${font};color:${colors.text};-webkit-font-smoothing:antialiased">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${colors.bg}">
      <tr>
        <td class="email-outer" align="center" style="padding:24px 12px">
          <table class="email-container" role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;background:${colors.surface};border:1px solid ${colors.border}">
            
            <!-- Top Dateline Bar -->
            <tr>
              <td class="email-pad" style="padding:10px 32px;border-bottom:1px solid ${colors.border}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                  <tr>
                    <td align="left" style="${font};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colors.muted}">
                      ${escapeHtml(options.eyebrow)}
                    </td>
                    <td align="right" style="${font};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colors.faint}">
                      ${options.issueNumber ? `Issue ${escapeHtml(String(options.issueNumber))}` : 'NSE &amp; BSE INTELLIGENCE'}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Grand Broadsheet Masthead -->
            <tr>
              <td class="email-pad" align="center" style="padding:20px 32px 14px 32px;text-align:center">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse">
                  <tr>
                    <td align="center" style="padding:0 0 8px 0">
                      <a href="${KOSH_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block">
                        <img src="cid:${EMAIL_LOGO_CONTENT_ID}" width="32" height="32" alt="Kosh" style="display:block;margin:0 auto;width:32px;height:32px;border:0">
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="${KOSH_URL}" target="_blank" rel="noopener noreferrer" class="broadsheet-name" style="${font};font-size:36px;line-height:40px;font-weight:800;letter-spacing:-0.025em;color:${colors.text};text-transform:uppercase;text-decoration:none;display:inline-block">Kosh</a>
                      <span class="broadsheet-name" style="${font};font-size:36px;line-height:40px;font-weight:800;letter-spacing:-0.025em;color:${colors.text};text-transform:uppercase"> Daily</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hairline dividing title and edition subtitle -->
            <tr>
              <td style="padding:0 32px">
                <div style="border-top:1px solid ${colors.border}"></div>
              </td>
            </tr>

            <!-- Edition Subtitle Bar -->
            <tr>
              <td class="email-pad" align="center" style="padding:10px 32px;text-align:center;border-bottom:1px solid ${colors.text}">
                <h1 class="email-title" style="${font};margin:0;color:${colors.text};font-size:13px;line-height:18px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-align:center">
                  ${escapeHtml(options.title)}
                </h1>
              </td>
            </tr>

            <!-- Main Content Area -->
            ${options.children}

            <!-- Disclaimer -->
            <tr>
              <td class="email-pad" align="center" style="padding:22px 32px 22px 32px;border-top:1px solid ${colors.border}">
                <p style="${font};margin:0;color:${colors.muted};font-size:12px;line-height:18px;text-align:center">
                  <strong style="color:${colors.text};font-weight:700">Disclaimer:</strong>
                  Kosh is an experimental, learning-focused project. It is not investment advice or a recommendation to buy or sell securities.
                </p>
              </td>
            </tr>

            <!-- Newspaper Colophon -->
            <tr>
              <td class="email-pad" align="center" style="padding:0 32px 26px 32px;color:${colors.faint};font-size:12px;line-height:18px">
                <p style="${font};margin:0;color:${colors.faint};font-size:12px;line-height:18px;text-align:center">
                  made by <a href="${AUTHOR_URL}" target="_blank" rel="noopener noreferrer" style="color:${colors.text};text-decoration:underline;font-weight:700">ahampriyanshu</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function indexTable(snapshot: MarketSnapshot): string {
  if (!snapshot.indianIndices.length) return paragraph('No index data available.');
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
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid ${colors.text}">
        <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Index</th>
        <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">LTP</th>
        <th align="right" style="${font};padding:0 0 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Change</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

function betRows(bets: Array<{ ticker: string; name?: string; action: string; signal: string; confidence: number; thesis: string }>): string {
  if (!bets.length) return paragraph('No bets for this period.');
  const rows = bets
    .map(
      (b) => `
        <tr>
          <td style="${mono};padding:8px 10px 8px 0;color:${colors.text};font-size:13px;font-weight:700;vertical-align:top;border-bottom:1px solid ${colors.border}">${escapeHtml(shortTicker(b.ticker))}</td>
          <td style="${font};padding:8px 10px 8px 0;vertical-align:top;border-bottom:1px solid ${colors.border}">${actionBadge(b.action)}</td>
          <td style="${font};padding:8px 10px 8px 0;vertical-align:top;border-bottom:1px solid ${colors.border}">${signalBadge(b.signal as Signal)}</td>
          <td align="right" style="${mono};padding:8px 10px 8px 0;color:${colors.muted};font-size:12px;vertical-align:top;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(confidencePct(b.confidence))}</td>
          <td style="${font};padding:8px 0;color:${colors.muted};font-size:13px;line-height:19px;vertical-align:top;border-bottom:1px solid ${colors.border}">${text(b.thesis)}</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid ${colors.text}">
        <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Ticker</th>
        <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Action</th>
        <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Signal</th>
        <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Conf.</th>
        <th align="left" style="${font};padding:0 0 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Thesis</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
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
  if (!metrics?.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px">
    <tr>
      ${metrics.map((metric) => `
        <td width="25%" style="padding:4px 8px 6px 0;vertical-align:top">
          <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 3px 0">${escapeHtml(metric.label)}</div>
          <div style="${mono};font-size:15px;line-height:21px;font-weight:700;color:${colors.text}">${escapeHtml(metric.value)}</div>
        </td>
      `).reduce((html, cell, index) => html + (index > 0 && index % 4 === 0 ? '</tr><tr>' : '') + cell, '')}
    </tr>
  </table>`;
}

function fixedRows(rows: Array<{ label: string; value: string }>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${rows.map((row) => `
      <tr>
        <td style="${font};padding:6px 12px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(row.label)}</td>
        <td style="${font};padding:6px 0 6px 0;color:${colors.text};font-size:14px;line-height:21px;vertical-align:top;border-bottom:1px solid ${colors.border}">${text(row.value)}</td>
      </tr>
    `).join('')}
  </table>`;
}

function targetRows(targets: Array<{ source: string; target: string; duration: string; view: string }>): string {
  if (!targets.length) return paragraph('No sourced targets found.', colors.faint);
  return fixedRows(targets.map((target) => ({
    label: target.source,
    value: `${target.target} · ${target.duration} · ${target.view}`,
  })));
}

function learningLoopBlock(learnings: { worked: string[]; missed: string[] } | undefined): string {
  const worked = learnings?.worked ?? [];
  const missed = learnings?.missed ?? [];
  if (!worked.length && !missed.length) return paragraph('No learning notes for this period.');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="50%" style="padding:0 12px 0 0;vertical-align:top">
          ${subLabel('What worked', colors.bullish)}
          ${bulletList(worked)}
        </td>
        <td width="50%" style="padding:0 0 0 12px;vertical-align:top">
          ${subLabel('What missed', colors.bearish)}
          ${bulletList(missed)}
        </td>
      </tr>
    </table>
  `;
}

// ---- Daily dashboard helpers (mirror the web MarketDashboard) ----

interface QuoteRow {
  name: string;
  value: number;
  changePct: number;
}

// Fixed display order — stable across reruns regardless of fetch order.
const SECTOR_ORDER = [
  'NIFTY BANK',
  'NIFTY IT',
  'NIFTY PHARMA',
  'NIFTY AUTO',
  'NIFTY METAL',
  'NIFTY ENERGY',
  'NIFTY REALTY',
  'NIFTY FIN SERVICE',
  'NIFTY FMCG',
];

const NEWS_THEME_ORDER = [
  'macro_policy',
  'global_cues',
  'earnings',
  'sectoral',
  'corporate_actions',
  'stocks_in_focus',
] as const;

const NEWS_LABELS: Record<(typeof NEWS_THEME_ORDER)[number], string> = {
  macro_policy: 'Macro & Policy',
  global_cues: 'Global Cues',
  earnings: 'Earnings',
  sectoral: 'Sectoral',
  corporate_actions: 'Corporate Actions',
  stocks_in_focus: 'Stocks in Focus',
};

function cueRows(s: MarketSnapshot): QuoteRow[] {
  const indian = (name: string) => s.indianIndices.find((i) => i.name === name);
  const global = (name: string) => s.globalIndices.find((i) => i.name === name);
  const commodity = (name: string) => s.commodities.find((c) => c.name === name);

  const rows: QuoteRow[] = [];
  const nifty = indian('NIFTY 50');
  if (nifty) rows.push({ name: 'NIFTY 50', value: nifty.ltp, changePct: nifty.changePct });
  const sensex = indian('SENSEX');
  if (sensex) rows.push({ name: 'SENSEX', value: sensex.ltp, changePct: sensex.changePct });
  if (s.giftNifty) rows.push({ name: 'GIFT NIFTY', value: s.giftNifty.value, changePct: s.giftNifty.changePct });
  const nasdaq = global('NASDAQ');
  if (nasdaq) rows.push({ name: 'NASDAQ', value: nasdaq.ltp, changePct: nasdaq.changePct });
  const gold = commodity('Gold');
  if (gold) rows.push({ name: 'GOLD', value: gold.value, changePct: gold.changePct });
  if (s.vix) rows.push({ name: 'INDIA VIX', value: s.vix.value, changePct: s.vix.changePct });
  return rows;
}

function sectorRows(s: MarketSnapshot): QuoteRow[] {
  return SECTOR_ORDER.map((name) => {
    const q = s.indianIndices.find((i) => i.name === name);
    return q ? { name, value: q.ltp, changePct: q.changePct } : null;
  }).filter((r): r is QuoteRow => r !== null);
}

function formatCrore(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toLocaleString('en-IN')} cr`;
}

function subLabel(label: string, color: string): string {
  return `<div style="${font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${color};margin:0 0 6px 0">${escapeHtml(label)}</div>`;
}

function quoteTable(rows: QuoteRow[]): string {
  if (!rows.length) return paragraph('No data available.');
  const body = rows
    .map(
      (r) => `
        <tr>
          <td style="${font};padding:7px 10px 7px 0;color:${colors.text};font-size:14px;line-height:20px;border-bottom:1px solid ${colors.border}">${escapeHtml(r.name)}</td>
          <td align="right" style="${mono};padding:7px 10px 7px 0;color:${colors.text};font-size:14px;line-height:20px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(r.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:7px 0;font-size:14px;line-height:20px;white-space:nowrap;color:${r.changePct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}">${escapeHtml(formatPct(r.changePct))}</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid ${colors.text}">
        <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Name</th>
        <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Last</th>
        <th align="right" style="${font};padding:0 0 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Change</th>
      </tr>
    </thead>
    <tbody>
      ${body}
    </tbody>
  </table>`;
}

function moversTable(rows: Array<{ ticker: string; name: string; ltp: number; changePct: number }>): string {
  const body = rows
    .map(
      (r) => `
        <tr>
          <td style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;font-weight:700;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(shortTicker(r.ticker))}</td>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.muted};font-size:13px;line-height:18px;border-bottom:1px solid ${colors.border}">${escapeHtml(r.name)}</td>
          <td align="right" style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;white-space:nowrap;color:${r.changePct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}">${escapeHtml(formatPct(r.changePct))}</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${body}</table>`;
}

function gainersLosersBlock(s: MarketSnapshot): string {
  const gainers = s.topGainers.slice(0, 5);
  const losers = s.topLosers.slice(0, 5);
  let out = '';
  if (gainers.length) out += subLabel('Top Gainers', colors.bullish) + moversTable(gainers);
  if (gainers.length && losers.length) out += '<div style="height:16px;line-height:16px">&nbsp;</div>';
  if (losers.length) out += subLabel('Top Losers', colors.bearish) + moversTable(losers);
  return out;
}

function near52List(
  rows: Array<{ ticker: string; name: string; ltp: number; pctFromHigh?: number; pctFromLow?: number }>,
  kind: 'high' | 'low',
): string {
  if (!rows.length) {
    return `<p style="${font};margin:0;color:${colors.faint};font-size:13px;line-height:20px">No stocks within 2% of their 52-week ${kind}.</p>`;
  }
  const color = kind === 'high' ? colors.bearish : colors.bullish;
  const sign = kind === 'high' ? '−' : '+';
  const body = rows
    .map((r) => {
      const pct = kind === 'high' ? r.pctFromHigh ?? 0 : r.pctFromLow ?? 0;
      return `
        <tr>
          <td style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;font-weight:700;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(shortTicker(r.ticker))}</td>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.muted};font-size:13px;line-height:18px;border-bottom:1px solid ${colors.border}">${escapeHtml(r.name)}</td>
          <td align="right" style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;white-space:nowrap;color:${color};border-bottom:1px solid ${colors.border}">${sign}${escapeHtml(pct.toFixed(2))}%</td>
        </tr>
      `;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${body}</table>`;
}

function fiftyTwoBlock(s: MarketSnapshot): string {
  return (
    subLabel('Near 52-Week High', colors.bullish) +
    near52List(s.near52wHigh, 'high') +
    '<div style="height:16px;line-height:16px">&nbsp;</div>' +
    subLabel('Near 52-Week Low', colors.bearish) +
    near52List(s.near52wLow, 'low')
  );
}

function fiiDiiBlock(fd: NonNullable<MarketSnapshot['fiiDii']>): string {
  const fiiColor = fd.fiiNet >= 0 ? colors.bullish : colors.bearish;
  const diiColor = fd.diiNet >= 0 ? colors.bullish : colors.bearish;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${colors.border};border-bottom:1px solid ${colors.border}">
      <tr>
        <td width="50%" style="padding:14px 16px 14px 0;vertical-align:top;border-right:1px solid ${colors.border}">
          <div style="${font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 4px 0">FII Net</div>
          <div style="${mono};font-size:22px;line-height:26px;font-weight:700;color:${fiiColor}">${escapeHtml(formatCrore(fd.fiiNet))}</div>
        </td>
        <td width="50%" style="padding:14px 0 14px 16px;vertical-align:top">
          <div style="${font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 4px 0">DII Net</div>
          <div style="${mono};font-size:22px;line-height:26px;font-weight:700;color:${diiColor}">${escapeHtml(formatCrore(fd.diiNet))}</div>
        </td>
      </tr>
    </table>
    <p style="${mono};margin:8px 0 0 0;color:${colors.faint};font-size:12px;line-height:18px">As of ${escapeHtml(fd.asOf)}</p>
  `;
}

// Some grounded runs emit a placeholder instead of a real outlet name; hide those.
const PLACEHOLDER_SOURCES = new Set(['research text', 'research', 'source', 'n/a', 'na', 'unknown', '']);
function isRealSource(source: string): boolean {
  return !PLACEHOLDER_SOURCES.has(source.trim().toLowerCase());
}

function newsDigest(groups: MarketSnapshot['news'], limit = 6): string {
  const byCategory = new Map(groups.map((g) => [g.category, g.items]));
  const picks: Array<{ category: (typeof NEWS_THEME_ORDER)[number]; item: MarketSnapshot['news'][number]['items'][number] }> = [];

  let round = 0;
  let added = true;
  while (picks.length < limit && added) {
    added = false;
    for (const category of NEWS_THEME_ORDER) {
      const items = byCategory.get(category);
      if (items && items[round]) {
        picks.push({ category, item: items[round] });
        added = true;
        if (picks.length >= limit) break;
      }
    }
    round += 1;
  }

  if (!picks.length) return paragraph('No notable headlines.');

  return picks
    .map(
      ({ category, item }) => `
        <div style="padding:10px 0;border-bottom:1px solid ${colors.border}">
          <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 3px 0">${escapeHtml(NEWS_LABELS[category])}</div>
          <div style="${font};font-size:15px;font-weight:700;line-height:22px;color:${colors.text}">${escapeHtml(item.headline)}</div>
          ${isRealSource(item.source) ? `<div style="${font};font-size:12px;font-style:italic;line-height:18px;color:${colors.faint};margin-top:2px">${escapeHtml(item.source)}</div>` : ''}
        </div>
      `,
    )
    .join('');
}

export function renderDailyEmail(content: DailyContent, issueNumber?: number): string {
  const s = content.snapshot;
  const cues = cueRows(s);
  const sectors = sectorRows(s);
  const hasMovers = s.topGainers.length > 0 || s.topLosers.length > 0;
  const has52w = s.near52wHigh.length > 0 || s.near52wLow.length > 0;
  const hasNews = s.news.some((g) => g.items.length > 0);

  const parts: string[] = [
    section(
      'Summary',
      `<p style="${font};margin:0;color:${colors.text};font-size:16px;line-height:26px">${text(content.outlook)}</p>`,
    ),
  ];
  if (hasNews) parts.push(section('News', newsDigest(s.news)));
  if (s.fiiDii) parts.push(section('FII / DII Activity', fiiDiiBlock(s.fiiDii)));
  if (cues.length) parts.push(section('Market Cues', quoteTable(cues)));
  if (sectors.length) parts.push(section('Market Sectors', quoteTable(sectors)));
  if (hasMovers) parts.push(section('Top Gainers & Losers', gainersLosersBlock(s)));
  if (has52w) parts.push(section('52-Week High & Low', fiftyTwoBlock(s)));

  return renderShell({
    title: 'Daily Brief',
    eyebrow: formatDisplayDate(s.asOf.slice(0, 10)),
    preheader: content.outlook,
    children: parts.join(''),
    issueNumber,
  });
}

export function renderWeeklyEmail(content: WeeklyContent, period: string): string {
  const periodLabel = formatPeriodLabel(period);
  return renderShell({
    title: 'Weekly Outlook',
    eyebrow: periodLabel,
    preheader: content.themes.slice(0, 3).join('; ') || `Kosh Weekly ${periodLabel}`,
    children:
      section('Themes', bulletList(content.themes)) +
      section('Positional Bets', betRows(content.positionalBets)) +
      section('Indian Indices', indexTable(content.snapshot)),
  });
}

export function renderMonthlyEmail(content: MonthlyContent, period: string): string {
  const parts = [
    section('Sector Insights', bulletList(content.sectorInsights)),
    section('Macro Themes', bulletList(content.macroThemes)),
    section('Mid-Term Bets', betRows(content.midTermBets)),
  ];

  if (content.ledgerRollup) {
    const hitsSummary = `<div style="${font};font-size:15px;line-height:22px;margin:0 0 8px 0;color:${colors.text};font-weight:700">${escapeHtml(String(content.ledgerRollup.hits))}/${escapeHtml(String(content.ledgerRollup.total))} bets hit</div>`;
    parts.push(
      section(
        'Ledger Rollup',
        card(hitsSummary + paragraph(content.ledgerRollup.summary)) + '<div style="height:12px;line-height:12px">&nbsp;</div>' + learningLoopBlock(content.ledgerRollup.learnings),
      ),
    );
  }

  parts.push(section('Indian Indices', indexTable(content.snapshot)));

  return renderShell({
    title: 'Monthly Digest',
    eyebrow: `Month ${period}`,
    preheader: content.macroThemes.slice(0, 3).join('; ') || `Kosh Monthly ${period}`,
    children: parts.join(''),
  });
}

export function renderRetroEmail(content: RetroContent): string {
  const alertCards = content.alerts.length
    ? content.alerts.map((alert) =>
        card(
          tickerLine(alert.ticker, alert.name, ` <span style="margin-left:8px">${severityBadge(alert.severity)}</span>`) +
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
          <td style="${font};padding:8px 8px;border-bottom:1px solid ${colors.border};font-size:13px;line-height:19px;color:${colors.muted}">${text(item.note)}</td>
        </tr>
      `,
    )
    .join('');

  return renderShell({
    title: 'Daily Retro',
    eyebrow: formatDisplayDate(content.date),
    preheader: content.summary,
    children:
      section('Session Summary', `<p style="${font};margin:0;color:${colors.text};font-size:16px;line-height:26px">${text(content.summary)}</p>`) +
      section('Sell Alerts', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardStack(alertCards)}</table>`) +
      section(
        'Portfolio Scan',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid ${colors.text}">
              <th align="left" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Ticker</th>
              <th align="right" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Price</th>
              <th align="right" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Change</th>
              <th align="left" style="${font};padding:0 8px 6px 8px;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Note</th>
            </tr>
          </thead>
          <tbody>
            ${evaluatedRows}
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
            <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Ticker</th>
            <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Action</th>
            <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Change</th>
            <th align="left" style="${font};padding:0 0 6px 0;color:${colors.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Outcome</th>
          </tr>
        </thead>
        <tbody>
          ${content.graded
            .map((bet) => {
              const changePctStr = bet.changePct > 0 ? `+${bet.changePct.toFixed(2)}%` : `${bet.changePct.toFixed(2)}%`;
              const changePctColor = bet.changePct > 0 ? colors.bullish : bet.changePct < 0 ? colors.bearish : colors.neutral;
              const outcomeColor = bet.outcome === 'hit' ? colors.bullish : bet.outcome === 'miss' ? colors.bearish : colors.neutral;
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
      section('Fundamentals', fixedRows([
        { label: 'Growth', value: content.fundamentals.growth },
        { label: 'Valuation', value: content.fundamentals.valuation },
      ])) +
      section('Technicals', fixedRows([
        { label: 'Trend', value: content.technicals.trend },
        { label: 'Momentum', value: content.technicals.momentum },
        { label: 'Key levels', value: content.technicals.levels },
      ])) +
      section('Sentiment', fixedRows([
        { label: 'News', value: content.sentiment.news },
        { label: 'Brokerage', value: content.sentiment.brokerage },
      ])) +
      section(
        'Recommendation',
        card(
          `<div style="margin:0 0 8px 0">${actionBadge(rec.action)}</div>` +
            paragraph(rec.reasoning),
          rec.action === 'buy' ? colors.bullish : colors.border,
        ),
      ) +
      section('Entry & Exit', fixedRows([
        { label: 'Fundamental', value: content.entryExit.fundamental },
        { label: 'Technical / Sentiment', value: content.entryExit.technicalSentiment },
      ])) +
      section('Target', targetRows(content.targets ?? [])),
  });
}
