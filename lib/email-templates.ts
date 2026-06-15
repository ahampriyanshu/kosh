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

const font = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif`;
const mono = `font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace`;

const colors = {
  bg: '#f6f8fa',
  surface: '#ffffff',
  raised: '#f6f8fa',
  border: '#e5e7eb',
  text: '#1f2937',
  muted: '#6b7280',
  faint: '#9ca3af',
  link: '#0056b2',
  bullish: '#16803c',
  bullishBg: '#ecfdf3',
  bullishBorder: '#bbf7d0',
  bearish: '#c2412f',
  bearishBg: '#fef2f2',
  bearishBorder: '#fecaca',
  neutral: '#6b7280',
  neutralBg: '#f6f8fa',
  neutralBorder: '#e5e7eb',
  medium: '#b7791f',
  mediumBg: '#fffbeb',
  mediumBorder: '#fde68a',
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
  return `<span style="${font};display:inline-block;font-size:12px;font-weight:700;line-height:16px;color:${fg};background:${bg};border:1px solid ${border};border-radius:6px;padding:2px 8px;vertical-align:middle">${escapeHtml(label)}</span>`;
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
      <td class="email-pad" style="padding:18px 32px 0 32px">
        <h2 style="${font};margin:0 0 10px 0;color:${colors.text};font-size:20px;line-height:26px;font-weight:800">${escapeHtml(title)}</h2>
        <div style="border-top:1px solid ${colors.border};padding-top:12px">${body}</div>
      </td>
    </tr>
  `;
}

function card(body: string, borderColor = colors.border): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${colors.raised};border:1px solid ${borderColor};border-radius:8px">
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
      <span style="${mono};font-weight:800">${escapeHtml(shortTicker(ticker))}</span>
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
        .email-container { border-left: 0 !important; border-right: 0 !important; border-radius: 0 !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .email-title { font-size: 24px !important; line-height: 30px !important; }
        .email-footer-link { display: block !important; text-align: left !important; padding-top: 8px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${colors.bg};${font};color:${colors.text}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${colors.bg}">
      <tr>
        <td class="email-outer" align="center" style="padding:24px 12px">
          <table class="email-container" role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;background:${colors.surface};border:1px solid ${colors.border};border-radius:8px">
            <tr>
              <td class="email-pad" style="padding:28px 32px 18px 32px;border-bottom:1px solid ${colors.border}">
                <div style="${font};color:${colors.text};font-size:18px;line-height:22px;font-weight:800;margin:0 0 18px 0">Kosh</div>
                <div style="${mono};color:${colors.link};font-size:12px;line-height:18px;font-weight:800;text-transform:uppercase;margin:0 0 6px 0">${escapeHtml(options.eyebrow)}</div>
                <h1 class="email-title" style="${font};margin:0;color:${colors.text};font-size:28px;line-height:34px;font-weight:800;letter-spacing:0">${escapeHtml(options.title)}</h1>
              </td>
            </tr>
            ${options.children}
            <tr>
              <td class="email-pad" style="padding:24px 32px 28px 32px;color:${colors.faint};font-size:12px;line-height:18px;border-top:1px solid ${colors.border}">
                <p style="${font};margin:0;color:${colors.faint};font-size:12px;line-height:18px">
                  made by <a href="https://ahampriyanshu.com" style="color:${colors.link};text-decoration:none;font-weight:700">ahampriyanshu</a>
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
          <td style="${font};padding:8px 10px 8px 0;color:${colors.text};font-size:14px;line-height:20px;vertical-align:top">${escapeHtml(i.name)}</td>
          <td align="right" style="${mono};padding:8px 10px 8px 0;color:${colors.text};font-size:14px;line-height:20px;vertical-align:top;white-space:nowrap">${escapeHtml(i.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:8px 0;font-size:14px;line-height:20px;vertical-align:top;white-space:nowrap;color:${i.changePct >= 0 ? colors.bullish : colors.bearish}">${escapeHtml(i.changePct >= 0 ? '+' : '')}${escapeHtml(i.changePct.toFixed(2))}%</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Index</th>
      <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">LTP</th>
      <th align="right" style="${font};padding:0 0 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Change</th>
    </tr>
    ${rows}
  </table>`;
}

function betRows(bets: Array<{ ticker: string; name?: string; action: string; signal: string; confidence: number; thesis: string }>): string {
  if (!bets.length) return paragraph('No bets for this period.');
  const rows = bets
    .map(
      (b) => `
        <tr>
          <td style="${mono};padding:8px 10px 8px 0;color:${colors.text};font-size:13px;font-weight:800;vertical-align:top">${escapeHtml(shortTicker(b.ticker))}</td>
          <td style="${font};padding:8px 10px 8px 0;vertical-align:top">${actionBadge(b.action)}</td>
          <td style="${font};padding:8px 10px 8px 0;vertical-align:top">${signalBadge(b.signal as Signal)}</td>
          <td align="right" style="${mono};padding:8px 10px 8px 0;color:${colors.faint};font-size:12px;vertical-align:top;white-space:nowrap">${escapeHtml(confidencePct(b.confidence))}</td>
          <td style="${font};padding:8px 0;color:${colors.muted};font-size:13px;line-height:19px;vertical-align:top">${text(b.thesis)}</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Ticker</th>
      <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Action</th>
      <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Signal</th>
      <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Conf.</th>
      <th align="left" style="${font};padding:0 0 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Thesis</th>
    </tr>
    ${rows}
  </table>`;
}

function bulletList(items: string[]): string {
  if (!items.length) return paragraph('Nothing to report.');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
    .map(
      (item) => `
        <tr>
          <td style="${font};padding:0 8px 8px 0;color:${colors.link};font-size:15px;line-height:22px;vertical-align:top">&#x2022;</td>
          <td style="${font};padding:0 0 8px 0;color:${colors.muted};font-size:15px;line-height:22px;vertical-align:top">${text(item)}</td>
        </tr>
      `,
    )
    .join('')}</table>`;
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
          <td style="${font};padding:8px 10px 8px 0;color:${colors.text};font-size:14px;line-height:20px">${escapeHtml(r.name)}</td>
          <td align="right" style="${mono};padding:8px 10px 8px 0;color:${colors.text};font-size:14px;line-height:20px;white-space:nowrap">${escapeHtml(r.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:8px 0;font-size:14px;line-height:20px;white-space:nowrap;color:${r.changePct >= 0 ? colors.bullish : colors.bearish}">${escapeHtml(formatPct(r.changePct))}</td>
        </tr>
      `,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr>
      <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Name</th>
      <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Last</th>
      <th align="right" style="${font};padding:0 0 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Change</th>
    </tr>
    ${body}
  </table>`;
}

function moversTable(rows: Array<{ ticker: string; name: string; ltp: number; changePct: number }>): string {
  const body = rows
    .map(
      (r) => `
        <tr>
          <td style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;font-weight:800;white-space:nowrap">${escapeHtml(shortTicker(r.ticker))}</td>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.muted};font-size:13px;line-height:18px">${escapeHtml(r.name)}</td>
          <td align="right" style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;white-space:nowrap">${escapeHtml(r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;white-space:nowrap;color:${r.changePct >= 0 ? colors.bullish : colors.bearish}">${escapeHtml(formatPct(r.changePct))}</td>
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
          <td style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;font-weight:800;white-space:nowrap">${escapeHtml(shortTicker(r.ticker))}</td>
          <td style="${font};padding:6px 10px 6px 0;color:${colors.muted};font-size:13px;line-height:18px">${escapeHtml(r.name)}</td>
          <td align="right" style="${mono};padding:6px 10px 6px 0;color:${colors.text};font-size:13px;white-space:nowrap">${escapeHtml(r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>
          <td align="right" style="${mono};padding:6px 0;font-size:13px;white-space:nowrap;color:${color}">${sign}${escapeHtml(pct.toFixed(2))}%</td>
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
  const cell = (label: string, val: number) => `
    <td width="50%" style="padding:0;vertical-align:top">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${colors.raised};border:1px solid ${colors.border};border-radius:8px">
        <tr>
          <td style="padding:12px 14px">
            <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.faint};margin:0 0 2px 0">${escapeHtml(label)}</div>
            <div style="${mono};font-size:18px;font-weight:800;color:${val >= 0 ? colors.bullish : colors.bearish}">${escapeHtml(formatCrore(val))}</div>
          </td>
        </tr>
      </table>
    </td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        ${cell('FII Net', fd.fiiNet)}
        <td style="width:12px">&nbsp;</td>
        ${cell('DII Net', fd.diiNet)}
      </tr>
    </table>
    <p style="${mono};margin:6px 0 0 0;color:${colors.faint};font-size:12px;line-height:18px">As of ${escapeHtml(fd.asOf)}</p>`;
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
          <div style="${font};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors.link};margin:0 0 2px 0">${escapeHtml(NEWS_LABELS[category])}</div>
          <div style="${font};font-size:15px;font-weight:700;line-height:21px;color:${colors.text}">${escapeHtml(item.headline)}</div>
          <div style="${mono};font-size:12px;line-height:18px;color:${colors.faint};margin-top:2px">${escapeHtml(item.source)}</div>
        </div>
      `,
    )
    .join('');
}

export function renderDailyEmail(content: DailyContent): string {
  const s = content.snapshot;
  const cues = cueRows(s);
  const sectors = sectorRows(s);
  const hasMovers = s.topGainers.length > 0 || s.topLosers.length > 0;
  const has52w = s.near52wHigh.length > 0 || s.near52wLow.length > 0;
  const hasNews = s.news.some((g) => g.items.length > 0);

  const parts: string[] = [section('Summary', paragraph(content.outlook, colors.text))];
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
  });
}

export function renderWeeklyEmail(content: WeeklyContent, period: string): string {
  return renderShell({
    title: 'Weekly Outlook',
    eyebrow: `Week ${period}`,
    preheader: content.themes.slice(0, 3).join('; ') || `Kosh Weekly ${period}`,
    children:
      section('Themes', bulletList(content.themes)) +
      section('Positional Bets', betRows(content.positionalBets)) +
      section('Indian Indices', indexTable(content.snapshot)),
  });
}

export function renderMonthlyEmail(content: MonthlyContent, period: string): string {
  return renderShell({
    title: 'Monthly Digest',
    eyebrow: `Month ${period}`,
    preheader: content.macroThemes.slice(0, 3).join('; ') || `Kosh Monthly ${period}`,
    children:
      section('Sector Insights', bulletList(content.sectorInsights)) +
      section('Macro Themes', bulletList(content.macroThemes)) +
      section('Mid-Term Bets', betRows(content.midTermBets)) +
      section('Indian Indices', indexTable(content.snapshot)),
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
          <td style="${mono};padding:10px 8px;border-bottom:1px solid ${colors.border};font-size:13px;font-weight:800;color:${colors.text}">${escapeHtml(shortTicker(item.ticker))}</td>
          <td align="right" style="${mono};padding:10px 8px;border-bottom:1px solid ${colors.border};font-size:13px;color:${colors.text};white-space:nowrap">${escapeHtml(formatPrice(item.price))}</td>
          <td align="right" style="${mono};padding:10px 8px;border-bottom:1px solid ${colors.border};font-size:13px;color:${item.changePct < 0 ? colors.bearish : item.changePct > 0 ? colors.bullish : colors.neutral};white-space:nowrap">${escapeHtml(formatPct(item.changePct))}</td>
          <td style="${font};padding:10px 8px;border-bottom:1px solid ${colors.border};font-size:13px;line-height:19px;color:${colors.muted}">${text(item.note)}</td>
        </tr>
      `,
    )
    .join('');

  return renderShell({
    title: 'Daily Retro',
    eyebrow: formatDisplayDate(content.date),
    preheader: content.summary,
    children:
      section('Session Summary', paragraph(content.summary, colors.text)) +
      section('Sell Alerts', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardStack(alertCards)}</table>`) +
      section(
        'Portfolio Scan',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <th align="left" style="${font};padding:0 8px 8px 8px;color:${colors.faint};font-size:11px;text-transform:uppercase">Ticker</th>
            <th align="right" style="${font};padding:0 8px 8px 8px;color:${colors.faint};font-size:11px;text-transform:uppercase">Price</th>
            <th align="right" style="${font};padding:0 8px 8px 8px;color:${colors.faint};font-size:11px;text-transform:uppercase">Change</th>
            <th align="left" style="${font};padding:0 8px 8px 8px;color:${colors.faint};font-size:11px;text-transform:uppercase">Note</th>
          </tr>
          ${evaluatedRows}
        </table>`,
      ),
  });
}

export function renderRecapEmail(content: RecapContent, title: string): string {
  const hitsSummary = `<div style="${font};font-size:14px;line-height:20px;margin:0 0 8px 0;color:${colors.text};font-weight:800">${escapeHtml(String(content.hits))}/${escapeHtml(String(content.total))} bets hit</div>`;

  const gradedRows = content.graded.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px">
        <tr>
          <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Ticker</th>
          <th align="left" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Action</th>
          <th align="right" style="${font};padding:0 10px 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Change</th>
          <th align="left" style="${font};padding:0 0 6px 0;color:${colors.faint};font-size:11px;text-transform:uppercase">Outcome</th>
        </tr>
        ${content.graded
          .map((bet) => {
            const changePctStr = bet.changePct > 0 ? `+${bet.changePct.toFixed(2)}%` : `${bet.changePct.toFixed(2)}%`;
            const changePctColor = bet.changePct > 0 ? colors.bullish : bet.changePct < 0 ? colors.bearish : colors.neutral;
            const outcomeColor = bet.outcome === 'hit' ? colors.bullish : bet.outcome === 'miss' ? colors.bearish : colors.neutral;
            return `
              <tr>
                <td style="${mono};padding:8px 10px 8px 0;color:${colors.text};font-size:13px;font-weight:800;vertical-align:top">${escapeHtml(bet.ticker.replace('.NS', ''))}</td>
                <td style="${font};padding:8px 10px 8px 0;vertical-align:top">${actionBadge(bet.action)}</td>
                <td align="right" style="${mono};padding:8px 10px 8px 0;color:${changePctColor};font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(changePctStr)}</td>
                <td style="${font};padding:8px 0;color:${outcomeColor};font-size:13px;font-weight:700;vertical-align:top;text-transform:uppercase">${escapeHtml(bet.outcome)}</td>
              </tr>
            `;
          })
          .join('')}
      </table>`
    : paragraph('No bets to grade for this period.');

  return renderShell({
    title,
    eyebrow: content.period,
    preheader: content.summary || title,
    children:
      section(
        'Grading Results',
        card(hitsSummary + paragraph(content.summary)),
      ) +
      section('Bet-by-Bet Breakdown', gradedRows),
  });
}

export function renderResearchEmail(content: ResearchContent): string {
  const rec = content.recommendation;
  return renderShell({
    title: `Research - ${content.ticker}`,
    eyebrow: 'Research',
    preheader: `${rec.action.toUpperCase()} ${content.ticker}: ${rec.reasoning}`,
    children:
      section(
        'Snapshot',
        card(
          tickerLine(content.ticker, content.name) +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">
              <tr>
                <td style="${font};color:${colors.faint};font-size:12px;line-height:18px;text-transform:uppercase;padding:0 12px 0 0">Price</td>
                <td style="${font};color:${colors.faint};font-size:12px;line-height:18px;text-transform:uppercase;padding:0">As of</td>
              </tr>
              <tr>
                <td style="${mono};color:${colors.text};font-size:18px;line-height:26px;font-weight:800;padding:2px 12px 0 0">${escapeHtml(formatPrice(content.price))}</td>
                <td style="${mono};color:${colors.text};font-size:13px;line-height:20px;padding:2px 0 0">${escapeHtml(content.asOf)}</td>
              </tr>
            </table>`,
        ),
      ) +
      section(
        'Recommendation',
        card(
          `<div style="margin:0 0 8px 0">${actionBadge(rec.action)} <span style="${mono};margin-left:8px;color:${colors.faint};font-size:12px">Confidence: ${confidencePct(rec.confidence)}</span></div>` +
            paragraph(rec.reasoning),
          rec.action === 'buy' ? colors.link : colors.border,
        ),
      ) +
      section('Fundamental Analysis', paragraph(content.fundamental)) +
      section('Technical Analysis', paragraph(content.technical)) +
      section('Sentiment', paragraph(content.sentiment)),
  });
}
