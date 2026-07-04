'use client';

import { useEffect, useMemo, useState } from 'react';
import { decryptPortfolioEnvelope } from '../../lib/portfolio-crypto';
import type { Portfolio } from '../../lib/schemas';
import { sortPortfolioHoldings, type PortfolioSort, type PortfolioSortKey } from '../../lib/portfolio-sort';
import { Pct } from './Pct';
import { ticker } from './market/Figure';

const STORAGE_KEY = 'kosh_portfolio_key';
const ENCRYPTED_PORTFOLIO_URL = '/data/portfolio.enc.json';
const MISSING_SNAPSHOT_ERROR = 'missing-portfolio-snapshot';
const INTEGRATION_REQUEST_URL =
  'https://github.com/ahampriyanshu/kosh/issues/new?title=Integration%20request%3A%20&body=Which%20broker%20or%20portfolio%20source%20should%20Kosh%20support%3F%0A%0AContext%3A%0A-%20Provider%3A%20%0A-%20Country%2Fmarket%3A%20%0A-%20API%20docs%20link%3A%20';

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function price(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAsOf(value: string): string {
  if (!value) return 'Not synced';
  try {
    return `${new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: false,
    })} IST`;
  } catch {
    return value;
  }
}

function isStale(value: string): boolean {
  if (!value) return true;
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return true;
  return Date.now() - then > 36 * 60 * 60 * 1000;
}

function StatBlock({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'gain' | 'loss' }) {
  const color =
    tone === 'gain'
      ? 'text-[var(--color-bullish)]'
      : tone === 'loss'
      ? 'text-[var(--color-bearish)]'
      : 'text-[var(--color-ink)]';

  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] rounded-lg px-4 py-3">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-1">
        {label}
      </p>
      <p className={`font-mono text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function SetupPage({ onOpenKeyModal }: { onOpenKeyModal: () => void }) {
  return (
    <div>
      <div className="mb-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Holdings
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Portfolio
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      <section>
        <div className="max-w-3xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-3">
            Setup required
          </p>
          <h2 className="font-display text-2xl font-black text-[var(--color-ink)] leading-tight mb-4">
            Bring your own portfolio feed.
          </h2>
          <p className="text-sm leading-6 text-[var(--color-muted)] max-w-xl">
            To make this page work for your repo, create a Kite Connect v3 app, paste the required API{' '}
            <button
              type="button"
              onClick={onOpenKeyModal}
              aria-label="Open portfolio unlock"
              className="cursor-text text-inherit outline-none focus-visible:text-[var(--color-ink)] focus-visible:underline focus-visible:decoration-[var(--color-brand)] focus-visible:underline-offset-4"
            >
              values
            </button>{' '}
            into the required environment secrets, run the portfolio sync workflow, and read{' '}
            <a
              href="https://github.com/ahampriyanshu/kosh#portfolio-encryption"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-link)] underline underline-offset-4 hover:text-[var(--color-link-hover)]"
            >
              README.md
            </a>
            .
          </p>
        </div>
        <ol className="mt-8 grid gap-0 border-t border-[var(--color-hairline)] md:grid-cols-3">
          {[
            'Create the Kite app and keep the API values ready.',
            'Add the required secrets in your fork.',
            'Run the portfolio sync, then return here.',
          ].map((step, index) => (
            <li
              key={step}
              className="border-b border-[var(--color-hairline)] py-5 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"
            >
              <span className="font-mono text-xs text-[var(--color-faint)]">0{index + 1}</span>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink)]">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href={INTEGRATION_REQUEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
          >
            Request New Integration
          </a>
        </div>
      </section>
    </div>
  );
}

function KeyModal({
  error,
  loading,
  onClose,
  onSave,
}: {
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay-primary)] px-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-1">
              Unlock
            </p>
            <h2 className="font-display text-xl font-black text-[var(--color-ink)]">Portfolio phrase</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <label className="mt-5 block">
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)]">
            Phrase
          </span>
          <input
            type="password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
            className="mt-2 w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)]"
          />
        </label>
        {error && <p className="mt-3 text-sm text-[var(--color-bearish)]">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !value.trim()}
            onClick={() => onSave(value.trim())}
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Unlocking' : 'Save phrase'}
          </button>
        </div>
      </div>
    </div>
  );
}
function PortfolioTable({ portfolio, onReplaceKey }: { portfolio: Portfolio; onReplaceKey: () => void }) {
  const holdings = portfolio.holdings;
  const [sort, setSort] = useState<PortfolioSort>({ key: 'currentValue', direction: 'desc' });
  const sortedHoldings = useMemo(() => sortPortfolioHoldings(holdings, sort), [holdings, sort]);
  const stale = isStale(portfolio.asOf);
  const pnlTone = portfolio.summary.pnl > 0 ? 'gain' : portfolio.summary.pnl < 0 ? 'loss' : 'neutral';
  const dayTone = portfolio.summary.dayChange > 0 ? 'gain' : portfolio.summary.dayChange < 0 ? 'loss' : 'neutral';
  const columns: Array<{ label: string; key: PortfolioSortKey; align: 'left' | 'right'; pad: string }> = [
    { label: 'Ticker', key: 'ticker', align: 'left', pad: 'pr-6' },
    { label: 'Qty', key: 'quantity', align: 'right', pad: 'pr-6' },
    { label: 'Avg', key: 'averagePrice', align: 'right', pad: 'pr-6' },
    { label: 'LTP', key: 'lastPrice', align: 'right', pad: 'pr-6' },
    { label: 'Value', key: 'currentValue', align: 'right', pad: 'pr-6' },
    { label: 'P&L', key: 'pnl', align: 'right', pad: 'pr-6' },
    { label: 'Day', key: 'dayValue', align: 'right', pad: 'pr-6' },
    { label: 'Weight', key: 'allocationPct', align: 'right', pad: '' },
  ];

  function updateSort(key: PortfolioSortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Holdings
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Portfolio
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <p className="font-mono text-xs text-[var(--color-faint)]">
          <button
            type="button"
            onClick={onReplaceKey}
            aria-label="Open portfolio phrase"
            className="cursor-pointer text-inherit outline-none hover:text-[var(--color-ink)] focus-visible:text-[var(--color-ink)] focus-visible:underline focus-visible:decoration-[var(--color-brand)] focus-visible:underline-offset-4"
          >
            {portfolio.source === 'kite' ? 'Kite snapshot' : 'Manual snapshot'}
          </button>{' '}
          - {formatAsOf(portfolio.asOf)}
        </p>
        {stale && (
          <span className="font-mono text-xs text-[var(--color-bearish)] bg-[var(--color-bearish-bg)] border border-[var(--color-bearish-bg)] rounded px-2 py-1">
            stale
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatBlock label="Current value" value={money(portfolio.summary.currentValue)} />
        <StatBlock label="Invested" value={money(portfolio.summary.investedValue)} />
        <StatBlock label="Total P&L" value={`${money(portfolio.summary.pnl)} (${portfolio.summary.pnlPct.toFixed(2)}%)`} tone={pnlTone} />
        <StatBlock label="Day P&L" value={`${money(portfolio.summary.dayChange)} (${portfolio.summary.dayChangePct.toFixed(2)}%)`} tone={dayTone} />
      </div>

      {holdings.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">
            No holdings synced.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-[var(--color-hairline)]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={
                      sort.key === column.key
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className={`py-3 ${column.align === 'left' ? 'text-left' : 'text-right'} ${column.pad}`}
                  >
                    <button
                      type="button"
                      onClick={() => updateSort(column.key)}
                      className={`inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] hover:text-[var(--color-ink)] focus:outline-none focus-visible:text-[var(--color-ink)] focus-visible:underline focus-visible:decoration-[var(--color-brand)] focus-visible:underline-offset-4 ${column.align === 'right' ? 'justify-end' : ''}`}
                    >
                      <span>{column.label}</span>
                      <span className="font-mono text-[10px] text-[var(--color-brand)]">
                        {sort.key === column.key ? (sort.direction === 'asc' ? '^' : 'v') : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {sortedHoldings.map((holding) => (
                <tr key={holding.ticker} className="group hover:bg-[var(--color-raised)] transition-colors">
                  <td className="py-3.5 pr-6">
                    <div>
                      <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                        {ticker(holding.ticker)}
                      </span>
                      <p className="font-sans text-xs text-[var(--color-faint)] mt-0.5">{holding.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-ink)] tabular-nums">
                    {holding.quantity.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-muted)] tabular-nums">
                    {price(holding.averagePrice)}
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-ink)] tabular-nums">
                    {price(holding.lastPrice)}
                  </td>
                  <td className="py-3.5 pr-6 text-right font-mono text-sm text-[var(--color-ink)] tabular-nums">
                    {money(holding.currentValue)}
                  </td>
                  <td className="py-3.5 pr-6 text-right">
                    <div className="font-mono text-sm text-[var(--color-ink)] tabular-nums">{money(holding.pnl)}</div>
                    <Pct value={holding.pnlPct} className="justify-end" />
                  </td>
                  <td className="py-3.5 pr-6 text-right">
                    <div className="font-mono text-sm text-[var(--color-ink)] tabular-nums">{money(holding.dayChange * holding.quantity)}</div>
                    <Pct value={holding.dayChangePct} className="justify-end" />
                  </td>
                  <td className="py-3.5 text-right font-mono text-sm text-[var(--color-muted)] tabular-nums">
                    {holding.allocationPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-mono text-xs text-[var(--color-faint)]">
            {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export function PortfolioUnlock() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [checking, setChecking] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock(passphrase: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(ENCRYPTED_PORTFOLIO_URL, { cache: 'no-store' });
      if (response.status === 404) throw new Error(MISSING_SNAPSHOT_ERROR);
      if (!response.ok) throw new Error('Could not fetch encrypted portfolio snapshot.');
      const encrypted = await response.json();
      const decrypted = await decryptPortfolioEnvelope(encrypted, passphrase);
      localStorage.setItem(STORAGE_KEY, passphrase);
      setPortfolio(decrypted);
      setModalOpen(false);
    } catch (unlockError) {
      const missingSnapshot =
        unlockError instanceof Error && unlockError.message === MISSING_SNAPSHOT_ERROR;
      setPortfolio(null);
      setError(
        missingSnapshot
          ? 'No portfolio snapshot found. Run the portfolio sync first, then return here.'
          : 'Could not unlock portfolio. Check the phrase and try again.',
      );
      if (!missingSnapshot) localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setChecking(false);
      return;
    }
    void unlock(saved);
  }, []);

  if (checking) {
    return (
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Holdings
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Portfolio
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
        <p className="mt-8 text-sm text-[var(--color-faint)]">Preparing portfolio.</p>
      </div>
    );
  }

  return (
    <>
      {portfolio ? (
        <PortfolioTable portfolio={portfolio} onReplaceKey={() => setModalOpen(true)} />
      ) : (
        <SetupPage onOpenKeyModal={() => setModalOpen(true)} />
      )}
      {modalOpen && (
        <KeyModal
          error={error}
          loading={loading}
          onClose={() => setModalOpen(false)}
          onSave={(key) => void unlock(key)}
        />
      )}
    </>
  );
}
