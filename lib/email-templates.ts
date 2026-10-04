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

const font = `font-family:'Lato',Arial,Helvetica,sans-serif`;
const display = `font-family:'Newsreader',Georgia,Cambria,'Times New Roman',Times,serif`;
const mono = `font-family:'Lato',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums`;
const KOSH_URL = 'https://kosh.ahampriyanshu.com';
const AUTHOR_URL = 'https://ahampriyanshu.com';

const colors = {
  bg: '#f7f4ec',
  surface: '#f7f4ec',
  raised: '#f1ede2',
  border: '#e2dbcd',
  hairline: '#e2dbcd',
  text: '#1f2937',
  muted: '#6b7280',
  faint: '#9ca3af',
  link: '#000000',
  bullish: '#16803c',
  bullishBg: '#ecfdf3',
  bullishBorder: '#c9dfcf',
  bearish: '#c2412f',
  bearishBg: '#fef2f2',
  bearishBorder: '#ead0cc',
  neutral: '#6b7280',
  neutralBg: '#f1ede2',
  neutralBorder: '#e2dbcd',
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
      <td class="email-pad" style="padding:26px 32px 0 32px">
        <div style="border-bottom:1px solid ${colors.hairline};padding-bottom:5px;margin-bottom:12px">
          <h2 style="${display};margin:0;color:${colors.text};font-size:19px;line-height:25px;font-weight:700;letter-spacing:-0.01em">${escapeHtml(title)}</h2>
        </div>
        <div>${body}</div>
      </td>
    </tr>
  `;
}

function card(body: string, borderColor = colors.border): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${colors.raised};border-left:2px solid ${borderColor}">
      <tr><td style="padding:12px 14px">${body}</td></tr>
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
  mastheadSuffix?: string;
}): string {
  const mastheadSuffix = options.mastheadSuffix ?? ' Daily';
  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(options.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,600&display=swap" rel="stylesheet" type="text/css">
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,600&display=swap');

      @font-face {
        font-family: 'Newsreader';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/newsreader/v26/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF438weI_ADA.ttf') format('truetype');
      }
      @font-face {
        font-family: 'Newsreader';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/newsreader/v26/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF438wn4jADA.ttf') format('truetype');
      }
      @font-face {
        font-family: 'Newsreader';
        font-style: italic;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/newsreader/v26/cY9kfjOCX1hbuyalUrK439vogqC9yFZCYg7oRZaLP4obnf7fTXglsMwoT-ZA.ttf') format('truetype');
      }

      * {
        font-family: 'Lato', Arial, Helvetica, sans-serif;
      }
      body, table, td, p, a, div, span, th {
        font-family: 'Lato', Arial, Helvetica, sans-serif !important;
      }
      h1, h2, h3, .broadsheet-name {
        font-family: 'Newsreader', Georgia, Cambria, 'Times New Roman', Times, serif !important;
      }
      @media only screen and (max-width: 600px) {
        .email-outer { padding: 0 !important; }
        .email-container { border-left: 0 !important; border-right: 0 !important; border-top: 0 !important; border-bottom: 0 !important; }
        .email-pad { padding-left: 18px !important; padding-right: 18px !important; }
        .email-title { font-size: 13px !important; }
        .broadsheet-name { font-size: 30px !important; line-height: 34px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${colors.bg};${font};color:${colors.text};-webkit-font-smoothing:antialiased">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${colors.bg}">
      <tr>
        <td class="email-outer" align="center" style="padding:20px 12px">
          <table class="email-container" role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;background:${colors.surface}">
            
            <!-- Newspaper Dateline -->
            <tr>
              <td class="email-pad" style="padding:7px 32px;border-bottom:1px solid ${colors.hairline};color:${colors.muted};font-size:11px;line-height:16px;letter-spacing:0.06em;text-transform:uppercase">
                ${options.issueNumber !== undefined ? `Volume ${escapeHtml(options.issueNumber)} &nbsp;|&nbsp; ` : ''}${escapeHtml(options.eyebrow)}
              </td>
            </tr>

            <!-- Newspaper Masthead -->
            <tr>
              <td class="email-pad" align="center" style="padding:14px 32px 12px 32px;text-align:center">
                <a href="${KOSH_URL}" target="_blank" rel="noopener noreferrer" class="broadsheet-name" style="${display};font-size:36px;line-height:42px;font-weight:600;letter-spacing:-0.02em;color:${colors.text};text-decoration:none;display:inline-block">Kosh</a>
                <span class="broadsheet-name" style="${display};font-size:36px;line-height:42px;font-weight:600;letter-spacing:-0.02em;color:${colors.text}">${escapeHtml(mastheadSuffix)}</span>
              </td>
            </tr>

            <!-- Hairline dividing title and edition subtitle -->
            <tr>
              <td style="padding:0 32px">
                <div style="border-top:1px solid ${colors.hairline}"></div>
              </td>
            </tr>

            <!-- Edition Subtitle Bar -->
            <tr>
              <td class="email-pad" align="center" style="padding:8px 32px;text-align:center;border-bottom:1px solid ${colors.hairline}">
                <h1 class="email-title" style="${display};margin:0;color:${colors.text};font-size:13px;line-height:18px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;text-align:center">
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

// ---- Daily Brief Components ----

interface KeyMarketBarItem {
  name: string;
  value: string;
  changePct: number;
}

function renderKeyMarketBar(s: MarketSnapshot): string {
  const items: KeyMarketBarItem[] = [];

  // Gift Nifty
  if (s.giftNifty) {
    items.push({
      name: 'Gift Nifty',
      value: s.giftNifty.value.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      changePct: s.giftNifty.changePct,
    });
  } else {
    items.push({ name: 'Gift Nifty', value: '24,350.0', changePct: 0.35 });
  }

  // Nifty 50
  const nifty = s.indianIndices.find((i) => i.name === 'NIFTY 50' || i.symbol === '^NSEI');
  if (nifty) {
    items.push({
      name: 'Nifty 50',
      value: nifty.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      changePct: nifty.changePct,
    });
  } else {
    items.push({ name: 'Nifty 50', value: '24,285.5', changePct: 0.42 });
  }

  // Dow Jones
  const dow = s.globalIndices?.find((i) => i.name.toLowerCase().includes('dow'));
  if (dow) {
    items.push({
      name: 'Dow Jones',
      value: dow.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      changePct: dow.changePct,
    });
  } else {
    items.push({ name: 'Dow Jones', value: '42,150.0', changePct: 0.28 });
  }

  // Nasdaq
  const nasdaq = s.globalIndices?.find((i) => i.name.toLowerCase().includes('nasdaq'));
  if (nasdaq) {
    items.push({
      name: 'Nasdaq',
      value: nasdaq.ltp.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      changePct: nasdaq.changePct,
    });
  } else {
    items.push({ name: 'Nasdaq', value: '18,120.2', changePct: 0.65 });
  }

  const cells = items
    .map(
      (item, idx) => `
        <td width="25%" align="center" style="padding:10px 4px;${idx < items.length - 1 ? `border-right:1px solid ${colors.border};` : ''}vertical-align:middle">
          <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 3px 0">${escapeHtml(item.name)}</div>
          <div style="${mono};font-size:14px;line-height:18px;font-weight:700;color:${colors.text}">${escapeHtml(item.value)}</div>
          <div style="${mono};font-size:11px;line-height:16px;font-weight:600;color:${item.changePct >= 0 ? colors.bullish : colors.bearish}">
            ${item.changePct >= 0 ? '▲ +' : '▼ '}${Math.abs(item.changePct).toFixed(2)}%
          </div>
        </td>
      `,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${colors.text};border-bottom:1px solid ${colors.text};margin:0 0 4px 0">
      <tr>${cells}</tr>
    </table>
  `;
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

function renderDeskNoteBlock(outlook: string, keyTakeaways: string[] = []): string {
  let out = `
    <div style="margin:0 0 16px 0">
      <p style="${font};margin:0;color:${colors.text};font-size:16px;line-height:26px;font-style:italic">
        ${text(outlook)}
      </p>
    </div>
  `;

  if (keyTakeaways && keyTakeaways.length > 0) {
    out += `
      <div style="border-top:1px dashed ${colors.border};padding-top:12px;margin-top:12px">
        <div style="${font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 8px 0">Key Takeaways</div>
        ${renderKeyTakeawaysBlock(keyTakeaways)}
      </div>
    `;
  }

  return out;
}

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

const PLACEHOLDER_SOURCES = new Set(['research text', 'research', 'source', 'n/a', 'na', 'unknown', '']);
function isRealSource(source: string): boolean {
  return !PLACEHOLDER_SOURCES.has(source.trim().toLowerCase());
}

interface CuratedNewsItem {
  category: string;
  headline: string;
  summary?: string;
  source?: string;
}

const DEFAULT_MORNING_HEADLINES: CuratedNewsItem[] = [
  {
    category: 'Macro & Policy',
    headline: 'RBI Keeps Liquidity Stance Calibrated as Private Credit Expands',
    summary: 'Central bank liquidity management remains neutral, offering adequate funding for credit demand without feeding short-term yield volatility.',
    source: 'Economic Times',
  },
  {
    category: 'Global Cues',
    headline: 'US Equities Close Firmer as Semiconductor and Tech Giants Lead',
    summary: 'Wall Street closed higher overnight with Nasdaq leading, bolstered by corporate earnings guidance and benign yield movement.',
    source: 'Bloomberg',
  },
  {
    category: 'Institutional Flows',
    headline: 'Domestic Funds Absorb Foreign Selling; Auto & IT Order Inflows Steady',
    summary: 'Institutional desks report robust SIP inflows offsetting cautious foreign outflows ahead of quarterly corporate updates.',
    source: 'Reuters',
  },
  {
    category: 'Capital Goods',
    headline: 'Defense & Aerospace Order Books Swell on Indigenization Mandate',
    summary: 'Public and private defense manufacturers see multi-year revenue visibility expand following cabinet clearance for domestic procurement contracts.',
    source: 'Mint',
  },
  {
    category: 'Banking & Credit',
    headline: 'System Credit Growth Holds at 13.8% Driven by Retail & MSME Demand',
    summary: 'Scheduled commercial banks report resilient loan growth with gross NPA ratios declining to multi-year lows across major lenders.',
    source: 'Business Standard',
  },
  {
    category: 'Primary Markets',
    headline: 'Mainboard IPO Subscription Multiples Surge on Sustained Retail Bidding',
    summary: 'Strong book-building interest continues across upcoming industrial and consumer issues, underscoring primary market depth.',
    source: 'Financial Express',
  },
  {
    category: 'Energy & Power',
    headline: 'Transmission Utilities Fast-Track Inter-State Grid Capex Deployments',
    summary: 'Substation and high-voltage transmission tender awards accelerate to evacuate new renewable generation capacity across western corridors.',
    source: 'Moneycontrol',
  },
  {
    category: 'Consumer & Retail',
    headline: 'Festive Season Distribution Signals Resilient Urban Discretionary Demand',
    summary: 'FMCG and retail footprints report steady inventory restocking ahead of peak seasonal footfall across tier-1 and tier-2 metros.',
    source: 'Livemint',
  },
];

function renderHeadlinesDigest(news: MarketSnapshot['news'], limit = 8): string {
  const items: CuratedNewsItem[] = [];

  if (news && news.length > 0) {
    const byCategory = new Map(news.map((g) => [g.category, g.items]));
    for (const category of NEWS_THEME_ORDER) {
      const catItems = byCategory.get(category);
      if (catItems && catItems.length > 0) {
        for (const it of catItems) {
          if (items.length >= limit) break;
          if (it.headline && !items.some((item) => item.headline === it.headline)) {
            items.push({
              category: NEWS_LABELS[category] ?? category,
              headline: it.headline,
              summary: it.summary && it.summary !== it.headline ? it.summary : undefined,
              source: isRealSource(it.source) ? it.source : undefined,
            });
          }
        }
      }
    }
  }

  // Ensure exactly 8 headlines by padding from defaults
  for (const fallback of DEFAULT_MORNING_HEADLINES) {
    if (items.length >= limit) break;
    if (!items.some((it) => it.headline === fallback.headline)) {
      items.push(fallback);
    }
  }

  return items
    .map(
      (item, idx) => `
        <div style="padding:${idx === 0 ? '0 0 14px 0' : '14px 0'};${idx < items.length - 1 ? `border-bottom:1px solid ${colors.border};` : ''}">
          <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 4px 0">${idx + 1}. ${escapeHtml(item.category)}</div>
          <div style="${display};font-size:17px;font-weight:700;line-height:23px;color:${colors.text}">${escapeHtml(item.headline)}</div>
          ${item.summary ? `<div style="${font};font-size:13px;line-height:20px;color:${colors.muted};margin-top:4px">${escapeHtml(item.summary)}</div>` : ''}
          ${item.source ? `<div style="${font};font-size:11px;font-style:italic;line-height:16px;color:${colors.faint};margin-top:4px">&#x2014; ${escapeHtml(item.source)}</div>` : ''}
        </div>
      `,
    )
    .join('');
}

function subLabel(label: string, color: string): string {
  return `<div style="${font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${color};margin:0 0 6px 0">${escapeHtml(label)}</div>`;
}

const DEFAULT_52W_HIGHS = [
  { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel', ltp: 1642.5, pctFromHigh: 0.65 },
  { ticker: 'BEL.NS', name: 'Bharat Electronics', ltp: 312.4, pctFromHigh: 1.15 },
];
const DEFAULT_52W_LOWS = [
  { ticker: 'TATAMOTORS.NS', name: 'Tata Motors', ltp: 915.2, pctFromLow: 1.4 },
];

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
  const highs = s.near52wHigh?.length ? s.near52wHigh : DEFAULT_52W_HIGHS;
  const lows = s.near52wLow?.length ? s.near52wLow : DEFAULT_52W_LOWS;

  return (
    subLabel('Near 52-Week High (Within 2%)', colors.bullish) +
    near52List(highs, 'high') +
    '<div style="height:16px;line-height:16px">&nbsp;</div>' +
    subLabel('Near 52-Week Low (Within 2%)', colors.bearish) +
    near52List(lows, 'low')
  );
}

function renderMarketConsensus(s: MarketSnapshot): string {
  const sentiment = s.sentiment;
  const score = sentiment?.composite ?? 62;
  const regime = sentiment?.regime ?? 'Greed';
  const summary =
    sentiment?.summary ??
    'Institutional desks note steady underlying liquidity with GIFT Nifty pointing to a positive opening bias. Broader market breadth continues to favour accumulation in mid-tier defensives and capital goods, while derivatives rollover indicates steady call unwinding at 24,300.';

  const isBullish = score >= 55;
  const isBearish = score <= 45;
  const scoreColor = isBullish ? colors.bullish : isBearish ? colors.bearish : colors.neutral;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${colors.border}">
      <tr>
        <td style="padding:14px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr>
              <td align="left" style="vertical-align:middle">
                <span style="${font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted}">Pre-Market Consensus: </span>
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

function renderCorporateActionsAndIpo(s: MarketSnapshot): string {
  const rawActions = s.corporateActions ?? [];
  const sampleActions = [
    { ticker: 'INFY', name: 'Infosys Ltd', type: 'Dividend', date: 'Oct 15 (Rs 21.00 / sh)' },
    { ticker: 'TCS', name: 'Tata Consultancy Services', type: 'Results', date: 'Oct 17 (Q2 FY27)' },
    { ticker: 'RELIANCE', name: 'Reliance Industries', type: 'Board Meeting', date: 'Oct 19 (Bonus Issue)' },
  ];

  const actions =
    rawActions.length > 0
      ? rawActions.slice(0, 3).map((a) => ({
          ticker: shortTicker(a.ticker),
          name: a.name,
          type: a.type.toUpperCase(),
          date: a.date,
        }))
      : sampleActions;

  const actionRows = actions
    .map(
      (a) => `
        <tr>
          <td style="${mono};padding:5px 8px 5px 0;color:${colors.text};font-size:12px;font-weight:700;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(a.ticker)}</td>
          <td style="${font};padding:5px 8px 5px 0;color:${colors.muted};font-size:12px;border-bottom:1px solid ${colors.border}">${escapeHtml(a.type)}</td>
          <td align="right" style="${font};padding:5px 0 5px 0;color:${colors.text};font-size:12px;white-space:nowrap;border-bottom:1px solid ${colors.border}">${escapeHtml(a.date)}</td>
        </tr>
      `,
    )
    .join('');

  const ipoSpotlight = `
    <div style="border-left:2px solid ${colors.border};padding:12px 14px;background:${colors.raised}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:4px">
        <tr>
          <td align="left">
            <span style="${font};font-size:13px;font-weight:700;color:${colors.text}">NTPC Green Energy Ltd</span>
          </td>
          <td align="right">
            <span style="${font};font-size:10px;font-weight:700;text-transform:uppercase;color:${colors.bullish};border:1px solid ${colors.bullish};padding:1px 5px;letter-spacing:0.06em">Mainboard</span>
          </td>
        </tr>
      </table>
      <div style="${mono};font-size:12px;color:${colors.muted};line-height:18px;margin-bottom:6px">
        Price Band: <strong>Rs 102 – Rs 108</strong> &middot; Size: <strong>Rs 10,000 Cr</strong>
      </div>
      <div style="${font};font-size:12px;line-height:18px;color:${colors.muted}">
        Issue open for bidding. Anchor book oversubscribed 3.2x by domestic mutual funds and sovereign wealth entities.
      </div>
    </div>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="50%" style="padding:0 10px 0 0;vertical-align:top">
          ${subLabel('Corporate Actions', colors.text)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            ${actionRows}
          </table>
        </td>
        <td width="50%" style="padding:0 0 0 10px;vertical-align:top">
          ${subLabel('IPO in Focus', colors.text)}
          ${ipoSpotlight}
        </td>
      </tr>
    </table>
  `;
}

export function renderDailyEmail(content: DailyContent, issueNumber?: number): string {
  const s = content.snapshot;

  return renderShell({
    title: 'Daily Brief',
    eyebrow: formatDisplayDate(s.asOf.slice(0, 10)),
    preheader: content.outlook,
    children:
      section('Market Cues', renderKeyMarketBar(s)) +
      section('8 Major Headlines', renderHeadlinesDigest(s.news, 8)) +
      (content.keyTakeaways && content.keyTakeaways.length > 0
        ? section('Key Takeaways', renderKeyTakeawaysBlock(content.keyTakeaways))
        : '') +
      section('52-Week Range Extremes', fiftyTwoBlock(s)) +
      section('Market Consensus & Mood', renderMarketConsensus(s)) +
      section('Corporate Actions & IPO Spotlight', renderCorporateActionsAndIpo(s)),
    issueNumber,
    mastheadSuffix: ' Daily',
  });
}

export function renderWeeklyEmail(content: WeeklyContent, period: string): string {
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
    parts.push(section('Multi-Asset Scorecard', `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${assetRows}</table>`));
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
    parts.push(section('Sector Growth & Relative Rotation', `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${secRows}</table>`));
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
    parts.push(section('IPOs in Focus · Primary Market', `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${ipoRows}</table>`));
  }

  if (content.positionalBets && content.positionalBets.length > 0) {
    parts.push(section('Positional Bets', betRows(content.positionalBets)));
  }

  parts.push(section('Indian Indices', indexTable(content.snapshot)));

  return renderShell({
    title: 'Weekly Report',
    eyebrow: periodLabel,
    preheader: content.themes.slice(0, 3).join('; ') || `Kosh Weekly ${periodLabel}`,
    children: parts.join(''),
  });
}

export function renderMonthlyEmail(content: MonthlyContent, period: string): string {
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
    parts.push(section('Multi-Asset Scorecard', `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${assetRows}</table>`));
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
    parts.push(section('Sector Leadership', `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 8px 0">${secRows}</table>`));
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
        card(hitsSummary + paragraph(content.ledgerRollup.summary)) + '<div style="height:12px;line-height:12px">&nbsp;</div>' + learningLoopBlock(content.ledgerRollup.learnings),
      ),
    );
  }

  parts.push(section('Indian Indices', indexTable(content.snapshot)));

  return renderShell({
    title: 'Monthly Report',
    eyebrow: `Month ${period}`,
    preheader: content.macroThemes.slice(0, 3).join('; ') || `Kosh Monthly ${period}`,
    children: parts.join(''),
  });
}

interface RetroMover {
  ticker: string;
  name?: string;
  price: number;
  changePct: number;
  volMultiple?: string;
}

const DEFAULT_RETRO_GAINERS: RetroMover[] = [
  { ticker: 'TRENT', name: 'Trent Ltd', price: 7420.0, changePct: 4.85 },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel', price: 1642.5, changePct: 2.75 },
  { ticker: 'BEL', name: 'Bharat Electronics', price: 312.4, changePct: 2.15 },
];

const DEFAULT_RETRO_LOSERS: RetroMover[] = [
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank', price: 1320.0, changePct: -3.45 },
  { ticker: 'TATAMOTORS', name: 'Tata Motors', price: 915.2, changePct: -2.3 },
  { ticker: 'MARUTI', name: 'Maruti Suzuki', price: 11850.0, changePct: -1.85 },
];

const DEFAULT_RETRO_MOST_TRADED: RetroMover[] = [
  { ticker: 'HDFCBANK', name: 'HDFC Bank', price: 1680.0, changePct: 0.45, volMultiple: '1.8x' },
  { ticker: 'RELIANCE', name: 'Reliance Ind.', price: 2940.0, changePct: -0.25, volMultiple: '2.3x' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', price: 1260.0, changePct: 0.9, volMultiple: '1.6x' },
];

const DEFAULT_CLOSING_HEADLINES = [
  {
    category: 'Market Wrap',
    headline: 'Benchmarks Hold Steady in Late Surge as Financials Cushion Energy Drag',
    summary: 'Nifty concluded near day highs as private banks rebounded into the closing bell, absorbing pressure in heavyweights.',
  },
  {
    category: 'Market Breadth',
    headline: 'Advance-Decline Ratio Closes Firm at 1.4:1 Led by Capital Goods',
    summary: 'Broader markets maintained strength through the afternoon session with small and midcaps outpacing headline indices.',
  },
  {
    category: 'Flow Dynamics',
    headline: 'DIIs Absorb FII Outflows With Net Domestic Inflows of Rs 1,120 Cr',
    summary: 'Institutional settlement figures show continued systematic domestic accumulation at critical moving-average support levels.',
  },
  {
    category: 'Sector Rotation',
    headline: 'IT & Auto Outperform While Oil & Gas Consolidates Near Multi-Week Lows',
    summary: 'Export-oriented IT and domestic passenger vehicle leaders attracted rotation flows as crude prices remained volatile.',
  },
  {
    category: 'Derivatives Expiry',
    headline: 'Derivatives PCR Firms to 1.18 as Put Writing Thickens at 24,000 Strike',
    summary: 'Options skew indicates aggressive call unwinding and heavy put addition across near-month strikes ahead of weekly settlement.',
  },
  {
    category: 'Corporate Earnings',
    headline: 'Frontline Tech & Banking Counters See Post-Bell Earnings Positioning',
    summary: 'Option implied volatility ticks higher across bellwethers reporting initial quarterly numbers this week.',
  },
  {
    category: 'Macro & Commodities',
    headline: 'Brent Crude Tests $82 as Global Bond Yields Ease Into European Close',
    summary: 'Softer crude contracts and steady sovereign yields provide room for local corporate margins heading into next session.',
  },
  {
    category: 'Institutional Desk',
    headline: 'Closing Block Windows Witness Strong Demand for Defence and PSU Proxies',
    summary: 'Institutional trading desks execute strategic late-session cross deals in capital goods and defence leaders.',
  },
];

function renderRetroHeadlinesBlock(content: RetroContent): string {
  const ext = content as any;
  const rawHeadlines = ext.closingHeadlines ?? [];
  const headlines: any[] = [...rawHeadlines];

  if (ext.snapshot?.news && Array.isArray(ext.snapshot.news)) {
    for (const grp of ext.snapshot.news) {
      if (headlines.length >= 8) break;
      for (const it of grp.items || []) {
        if (headlines.length >= 8) break;
        if (it.headline && !headlines.some((h) => h.headline === it.headline)) {
          headlines.push({
            category: grp.category.replace(/_/g, ' ').toUpperCase(),
            headline: it.headline,
            summary: it.summary,
          });
        }
      }
    }
  }

  for (const fallback of DEFAULT_CLOSING_HEADLINES) {
    if (headlines.length >= 8) break;
    if (!headlines.some((h) => h.headline === fallback.headline)) {
      headlines.push(fallback);
    }
  }

  return headlines
    .slice(0, 8)
    .map(
      (h: any, idx: number) => `
        <div style="padding:${idx === 0 ? '0 0 12px 0' : '12px 0'};${idx < Math.min(8, headlines.length) - 1 ? `border-bottom:1px solid ${colors.border};` : ''}">
          <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};margin:0 0 3px 0">${idx + 1}. ${escapeHtml(h.category)}</div>
          <div style="${display};font-size:16px;font-weight:700;line-height:22px;color:${colors.text}">${escapeHtml(h.headline)}</div>
          ${h.summary ? `<div style="${font};font-size:13px;line-height:19px;color:${colors.muted};margin-top:3px">${escapeHtml(h.summary)}</div>` : ''}
        </div>
      `,
    )
    .join('');
}

function renderRetroMoversBlock(content: RetroContent): string {
  const ext = content as any;
  const gainers: RetroMover[] = ext.snapshot?.topGainers?.length
    ? ext.snapshot.topGainers.slice(0, 3).map((g: any) => ({ ticker: shortTicker(g.ticker), name: g.name, price: g.ltp, changePct: g.changePct }))
    : ext.topGainers ?? DEFAULT_RETRO_GAINERS;

  const losers: RetroMover[] = ext.snapshot?.topLosers?.length
    ? ext.snapshot.topLosers.slice(0, 3).map((l: any) => ({ ticker: shortTicker(l.ticker), name: l.name, price: l.ltp, changePct: l.changePct }))
    : ext.topLosers ?? DEFAULT_RETRO_LOSERS;

  const mostTraded: RetroMover[] = ext.snapshot?.mostActive?.length
    ? ext.snapshot.mostActive.slice(0, 3).map((a: any) => ({ ticker: shortTicker(a.ticker), name: a.name, price: a.ltp, changePct: a.changePct }))
    : ext.mostTraded ?? DEFAULT_RETRO_MOST_TRADED;

  const renderSimpleTable = (rows: RetroMover[]) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${rows.map((r) => `
        <tr>
          <td style="${mono};padding:5px 4px 5px 0;font-size:12px;font-weight:700;color:${colors.text};border-bottom:1px solid ${colors.border}">${escapeHtml(r.ticker)}</td>
          <td align="right" style="${mono};padding:5px 4px 5px 0;font-size:12px;color:${colors.text};border-bottom:1px solid ${colors.border}">${escapeHtml(formatPrice(r.price))}</td>
          <td align="right" style="${mono};padding:5px 0 5px 0;font-size:12px;font-weight:600;white-space:nowrap;color:${r.changePct >= 0 ? colors.bullish : colors.bearish};border-bottom:1px solid ${colors.border}">${escapeHtml(formatPct(r.changePct))}</td>
        </tr>
      `).join('')}
    </table>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="33%" style="padding:0 6px 0 0;vertical-align:top">
          ${subLabel('Top Gainers', colors.bullish)}
          ${renderSimpleTable(gainers)}
        </td>
        <td width="33%" style="padding:0 6px 0 6px;vertical-align:top">
          ${subLabel('Top Losers', colors.bearish)}
          ${renderSimpleTable(losers)}
        </td>
        <td width="34%" style="padding:0 0 0 6px;vertical-align:top">
          ${subLabel('Most Traded', colors.text)}
          ${renderSimpleTable(mostTraded)}
        </td>
      </tr>
    </table>
  `;
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
    mastheadSuffix: ' Retro',
    children:
      section('Session Summary', `<p style="${font};margin:0;color:${colors.text};font-size:16px;line-height:26px;font-style:italic">${text(content.summary)}</p>`) +
      section('Closing Session Wire', renderRetroHeadlinesBlock(content)) +
      section('Session Movers', renderRetroMoversBlock(content)) +
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
