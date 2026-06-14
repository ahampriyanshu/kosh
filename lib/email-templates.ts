import type {
  AlertSeverity,
  MidSessionContent,
  DailyContent,
  RecapContent,
  ResearchContent,
  Signal,
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
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                  <tr>
                    <td style="${font};color:${colors.faint};font-size:12px;line-height:18px">Kosh</td>
                    <td class="email-footer-link" align="right" style="${font};color:${colors.faint};font-size:12px;line-height:18px">
                      <a href="https://ahampriyanshu.com" style="color:${colors.link};text-decoration:none">ahampriyanshu.com</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderDailyEmail(content: DailyContent): string {
  const rec = content.topRecommendation;
  const watchCards = content.stocksToWatch.map((stock) =>
    card(
      tickerLine(stock.ticker, stock.name, ` <span style="margin-left:6px">${signalBadge(stock.signal)}</span>`) +
        paragraph(stock.reason),
    ),
  );
  const sectors = content.sectorMovers
    .map(
      (item) => `
        <tr>
          <td style="${font};padding:8px 14px 8px 0;color:${colors.link};font-size:12px;line-height:18px;font-weight:800;text-transform:uppercase;vertical-align:top">${escapeHtml(item.sector)}</td>
          <td style="${font};padding:8px 0;color:${colors.muted};font-size:14px;line-height:22px;vertical-align:top">${text(item.note)}</td>
        </tr>
      `,
    )
    .join('');
  const exits = content.exitSignals.length
    ? section(
        'Exit Signals',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${content.exitSignals
          .map(
            (item) => `
              <tr>
                <td style="${mono};padding:6px 14px 6px 0;color:${colors.bearish};font-size:14px;font-weight:800;vertical-align:top">${escapeHtml(shortTicker(item.ticker))}</td>
                <td style="${font};padding:6px 0;color:${colors.muted};font-size:14px;line-height:22px;vertical-align:top">${text(item.reason)}</td>
              </tr>
            `,
          )
          .join('')}</table>`,
      )
    : '';

  return renderShell({
    title: `Daily Brief - ${content.date}`,
    eyebrow: 'Daily Brief',
    preheader: content.marketOutlook,
    children:
      section('Market Outlook', paragraph(content.marketOutlook, colors.text)) +
      section(
        'Top Recommendation',
        card(
          tickerLine(rec.ticker, undefined, ` <span style="margin-left:8px">${actionBadge(rec.action)}</span> <span style="${mono};margin-left:8px;color:${colors.faint};font-size:12px">Confidence: ${confidencePct(rec.confidence)}</span>`) +
            paragraph(rec.reasoning),
          colors.link,
        ),
      ) +
      section('Stocks to Watch', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardStack(watchCards)}</table>`) +
      section('FII / DII Flow', paragraph(content.fiiDiiSentiment)) +
      (sectors
        ? section('Sector Movers', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${sectors}</table>`)
        : '') +
      exits,
  });
}

export function renderMidSessionEmail(content: MidSessionContent): string {
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
    title: `Mid-Session - ${content.date}`,
    eyebrow: 'Mid-Session',
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
  const retro = content.retrospective
    ? section(
        'Retrospective',
        card(
          `<div style="${font};font-size:14px;line-height:20px;margin:0 0 8px 0;color:${colors.text};font-weight:800">${escapeHtml(content.retrospective.hits)}/${escapeHtml(content.retrospective.total)} calls hit</div>` +
            paragraph(content.retrospective.summary),
        ),
      )
    : section('Retrospective', paragraph('No prior calls to evaluate for this period.'));
  const themes = content.outlook.themes.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${content.outlook.themes
        .map(
          (theme) => `
            <tr>
              <td style="${font};padding:0 8px 8px 0;color:${colors.link};font-size:15px;line-height:22px;vertical-align:top">-</td>
              <td style="${font};padding:0 0 8px 0;color:${colors.muted};font-size:15px;line-height:22px;vertical-align:top">${text(theme)}</td>
            </tr>
          `,
        )
        .join('')}</table>`
    : paragraph('No themes provided.');
  const watchCards = content.outlook.stocksToWatch.map((stock) =>
    card(
      tickerLine(stock.ticker, stock.name, ` <span style="margin-left:6px">${signalBadge(stock.signal)}</span>`) +
        paragraph(stock.reason),
    ),
  );
  const rec = content.outlook.recommendation;

  return renderShell({
    title,
    eyebrow: 'Recap',
    preheader: content.outlook.themes.join('; ') || title,
    children:
      retro +
      section('Themes to Watch', themes) +
      section('Stocks to Watch', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardStack(watchCards)}</table>`) +
      section(
        'Recommendation',
        card(
          tickerLine(rec.ticker, undefined, ` <span style="margin-left:8px">${actionBadge(rec.action)}</span> <span style="${mono};margin-left:8px;color:${colors.faint};font-size:12px">Confidence: ${confidencePct(rec.confidence)}</span>`) +
            paragraph(rec.reasoning),
          rec.action === 'buy' ? colors.link : colors.border,
        ),
      ),
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
