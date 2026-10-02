import Link from 'next/link';

function getIstSession() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeVal = hours * 100 + minutes;

  if (day === 0 || day === 6) {
    return { label: 'WEEKEND DESK', state: 'closed', next: 'Mon 08:00 IST' };
  }
  if (timeVal >= 900 && timeVal < 915) {
    return { label: 'PRE-MARKET', state: 'pre', next: 'NSE Open 09:15 IST' };
  }
  if (timeVal >= 915 && timeVal < 1530) {
    return { label: 'LIVE TRADING', state: 'live', next: 'Market Close 15:30 IST' };
  }
  if (timeVal >= 1530 && timeVal < 2400) {
    return { label: 'POST-MARKET WRAP', state: 'post', next: 'Morning Bell 08:00 IST' };
  }
  return { label: 'PRE-BELL DESK', state: 'closed', next: 'Morning Brief 08:00 IST' };
}

interface MastheadProps {
  dateStr?: string;
  reportCount?: number;
}

export function Masthead({ dateStr, reportCount }: MastheadProps) {
  const session = getIstSession();
  const dateFormatted = dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="border-b border-[var(--color-hairline)] pb-6 mb-8">
      {/* Top Metadata Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--color-muted)] pb-3 border-b border-[var(--color-hairline)]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--color-ink)] tracking-wider uppercase">
            NSE & BSE INTELLIGENCE
          </span>
          <span className="text-[var(--color-faint)]">/</span>
          <span>{dateFormatted}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-raised)] border border-[var(--color-hairline)]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                session.state === 'live'
                  ? 'bg-[var(--color-bullish)] animate-pulse'
                  : session.state === 'pre'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-[var(--color-faint)]'
              }`}
            />
            <span className="text-[10px] font-bold text-[var(--color-ink)] tracking-wider">
              {session.label}
            </span>
            <span className="text-[10px] text-[var(--color-muted)] hidden sm:inline">
              · Next: {session.next}
            </span>
          </div>

          <a
            href="https://github.com/ahampriyanshu/kosh/tree/main/data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-brand)] transition-colors hidden md:inline"
          >
            AUDIT: SHA-256
          </a>
        </div>
      </div>

      {/* Main Editorial Headline Banner */}
      <div className="pt-5 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-ink)] leading-none">
            The Daily Dispatch
          </h1>
          <p className="font-sans text-sm text-[var(--color-muted)] mt-2 max-w-xl">
            AI-synthesized Indian market briefing, technical breadth radar, and audited positional ledger.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-[var(--color-muted)] self-start md:self-end">
          <span className="px-2 py-1 rounded bg-[var(--color-raised)] border border-[var(--color-hairline)]">
            Vol. 2026
          </span>
          {reportCount && reportCount > 0 && (
            <span className="text-[var(--color-faint)]">
              #{reportCount} editions published
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
